import {
  InsightCategory,
  InsightSeverity,
  InsightStatus,
  type InsightDto,
  type InsightSummaryDto,
  type PaginatedResult,
  type RefreshInsightsResultDto,
} from '@logistics/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, InsightStatus as PrismaInsightStatus, type Insight, type Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

import type { ListInsightsDto } from './dto/insight.dto';
import { CostInsightsGenerator } from './generators/cost-insights.generator';
import type { InsightCandidate, InsightGenerationPeriod, InsightGenerator } from './generators/insight-generator.types';
import { PerformanceInsightsGenerator } from './generators/performance-insights.generator';

@Injectable()
export class InsightsService {
  private readonly generators: InsightGenerator[];

  constructor(
    private readonly audit: AuditService,
    costGenerator: CostInsightsGenerator,
    performanceGenerator: PerformanceInsightsGenerator,
    private readonly prisma: PrismaService,
  ) {
    this.generators = [costGenerator, performanceGenerator];
  }

  async list(tenantId: string, query: ListInsightsDto): Promise<PaginatedResult<InsightDto>> {
    const page = query.page;
    const perPage = query.perPage;
    const period = parseOptionalPeriod(query.startDate, query.endDate);
    const where: Prisma.InsightWhereInput = {
      tenantId,
      ...(query.category ? { category: query.category as unknown as Prisma.InsightWhereInput['category'] } : {}),
      ...(query.severity ? { severity: query.severity as unknown as Prisma.InsightWhereInput['severity'] } : {}),
      ...(query.status ? { status: query.status as unknown as PrismaInsightStatus } : { status: { not: PrismaInsightStatus.DISMISSED } }),
      ...(period ? { periodStart: { gte: period.start }, periodEnd: { lte: period.end } } : {}),
    };
    const [insights, total] = await this.prisma.$transaction([
      this.prisma.insight.findMany({
        where,
        orderBy: [{ severity: 'desc' }, { generatedAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.insight.count({ where }),
    ]);
    return { data: insights.map(presentInsight), meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async summary(tenantId: string): Promise<InsightSummaryDto> {
    const insights = await this.prisma.insight.findMany({
      where: { status: { not: PrismaInsightStatus.DISMISSED }, tenantId },
      orderBy: { generatedAt: 'desc' },
      take: 500,
    });
    return {
      active: insights.length,
      byCategory: enumCounts(InsightCategory, insights.map((insight) => insight.category as unknown as InsightCategory)),
      bySeverity: enumCounts(InsightSeverity, insights.map((insight) => insight.severity as unknown as InsightSeverity)),
      generatedAt: insights[0]?.generatedAt.toISOString() ?? null,
      newCount: insights.filter((insight) => insight.status === PrismaInsightStatus.NEW).length,
      opportunities: insights.filter((insight) => insight.severity === String(InsightSeverity.OPPORTUNITY)).length,
    };
  }

  async get(tenantId: string, insightId: string): Promise<InsightDto> {
    const insight = await this.prisma.insight.findFirst({ where: { id: insightId, tenantId } });
    if (!insight) throw new NotFoundException('Insight nao encontrado.');
    return presentInsight(insight);
  }

  async refresh(tenantId: string, actorId: string): Promise<RefreshInsightsResultDto> {
    const period = buildPeriod();
    const candidates = (await Promise.all(this.generators.map((generator) => generator.generate({ period, prisma: this.prisma, tenantId })))).flat();
    await Promise.all(candidates.map((candidate) => this.persistCandidate(tenantId, period, candidate)));
    await this.audit.record({
      action: AuditAction.INSIGHT_GENERATED,
      actorId,
      entityType: 'Insight',
      metadata: { generated: candidates.length, periodEnd: period.currentEnd.toISOString(), periodStart: period.currentStart.toISOString() },
      tenantId,
    });
    return { generated: candidates.length, periodEnd: period.currentEnd.toISOString(), periodStart: period.currentStart.toISOString() };
  }

  async markRead(tenantId: string, actorId: string, insightId: string): Promise<InsightDto> {
    const insight = await this.updateTenantInsight(tenantId, insightId, {
      readAt: new Date(),
      status: PrismaInsightStatus.READ,
    });
    await this.audit.record({ action: AuditAction.INSIGHT_READ, actorId, entityId: insightId, entityType: 'Insight', tenantId });
    return presentInsight(insight);
  }

  async dismiss(tenantId: string, actorId: string, insightId: string): Promise<InsightDto> {
    const insight = await this.updateTenantInsight(tenantId, insightId, {
      dismissedAt: new Date(),
      status: PrismaInsightStatus.DISMISSED,
    });
    await this.audit.record({ action: AuditAction.INSIGHT_DISMISSED, actorId, entityId: insightId, entityType: 'Insight', tenantId });
    return presentInsight(insight);
  }

  private async updateTenantInsight(
    tenantId: string,
    insightId: string,
    data: Prisma.InsightUpdateManyMutationInput,
  ): Promise<Insight> {
    const result = await this.prisma.insight.updateMany({
      where: { id: insightId, tenantId },
      data,
    });

    if (result.count === 0) throw new NotFoundException('Insight nao encontrado.');
    const insight = await this.prisma.insight.findFirst({ where: { id: insightId, tenantId } });
    if (!insight) throw new NotFoundException('Insight nao encontrado.');
    return insight;
  }

  private async persistCandidate(tenantId: string, period: InsightGenerationPeriod, candidate: InsightCandidate): Promise<void> {
    const dedupeKey = [
      candidate.type,
      candidate.resourceType ?? 'none',
      candidate.resourceId ?? stableEvidenceKey(candidate.evidence),
      period.currentStart.toISOString().slice(0, 10),
      period.currentEnd.toISOString().slice(0, 10),
    ].join(':').slice(0, 180);
    await this.prisma.insight.upsert({
      where: { tenantId_dedupeKey: { dedupeKey, tenantId } },
      create: {
        actionUrl: candidate.actionUrl ?? null,
        category: candidate.category as unknown as Prisma.InsightUncheckedCreateInput['category'],
        comparisonValue: candidate.comparisonValue ?? null,
        dedupeKey,
        description: candidate.description,
        evidence: candidate.evidence as Prisma.InputJsonObject,
        generatedAt: new Date(),
        metadata: candidate.metadata as Prisma.InputJsonObject | undefined,
        metricValue: candidate.metricValue ?? null,
        percentageChange: candidate.percentageChange ?? null,
        periodEnd: period.currentEnd,
        periodStart: period.currentStart,
        resourceId: candidate.resourceId ?? null,
        resourceType: candidate.resourceType ?? null,
        severity: candidate.severity as unknown as Prisma.InsightUncheckedCreateInput['severity'],
        status: PrismaInsightStatus.NEW,
        tenantId,
        title: candidate.title,
        type: candidate.type,
      },
      update: {
        actionUrl: candidate.actionUrl ?? null,
        comparisonValue: candidate.comparisonValue ?? null,
        description: candidate.description,
        dismissedAt: null,
        evidence: candidate.evidence as Prisma.InputJsonObject,
        generatedAt: new Date(),
        metadata: candidate.metadata as Prisma.InputJsonObject | undefined,
        metricValue: candidate.metricValue ?? null,
        percentageChange: candidate.percentageChange ?? null,
        periodEnd: period.currentEnd,
        periodStart: period.currentStart,
        readAt: null,
        resourceId: candidate.resourceId ?? null,
        resourceType: candidate.resourceType ?? null,
        severity: candidate.severity as unknown as Prisma.InsightUpdateInput['severity'],
        status: PrismaInsightStatus.NEW,
        title: candidate.title,
      },
    });
  }

}

export function buildPeriod(now = new Date()): InsightGenerationPeriod {
  const currentEnd = new Date(now);
  const currentStart = new Date(now);
  currentStart.setUTCDate(currentStart.getUTCDate() - 30);
  const previousEnd = new Date(currentStart);
  const previousStart = new Date(currentStart);
  previousStart.setUTCDate(previousStart.getUTCDate() - 30);
  return { currentEnd, currentStart, previousEnd, previousStart };
}

function presentInsight(insight: Insight): InsightDto {
  return {
    actionUrl: insight.actionUrl,
    category: insight.category as unknown as InsightCategory,
    comparisonValue: insight.comparisonValue?.toNumber() ?? null,
    description: insight.description,
    dismissedAt: insight.dismissedAt?.toISOString() ?? null,
    evidence: asRecord(insight.evidence),
    generatedAt: insight.generatedAt.toISOString(),
    id: insight.id,
    metadata: asRecordOrNull(insight.metadata),
    metricValue: insight.metricValue?.toNumber() ?? null,
    percentageChange: insight.percentageChange?.toNumber() ?? null,
    periodEnd: insight.periodEnd.toISOString(),
    periodStart: insight.periodStart.toISOString(),
    readAt: insight.readAt?.toISOString() ?? null,
    resourceId: insight.resourceId,
    resourceType: insight.resourceType,
    severity: insight.severity as unknown as InsightSeverity,
    status: insight.status as unknown as InsightStatus,
    title: insight.title,
    type: insight.type,
  };
}

function enumCounts<T extends string>(enumObject: Record<string, T>, values: T[]): Record<T, number> {
  const output = Object.fromEntries(Object.values(enumObject).map((value) => [value, 0])) as Record<T, number>;
  for (const value of values) output[value] += 1;
  return output;
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asRecordOrNull(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stableEvidenceKey(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || 'global';
}

function parseOptionalPeriod(startDate: string | undefined, endDate: string | undefined): { end: Date; start: Date } | null {
  if (!startDate && !endDate) return null;

  const start = startDate ? parseDateBoundary(startDate, 'start') : new Date(0);
  const end = endDate ? parseDateBoundary(endDate, 'end') : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new BadRequestException('Periodo de insights invalido.');
  }

  return { end, start };
}

function parseDateBoundary(value: string, boundary: 'end' | 'start'): Date {
  const date = new Date(value);
  if (boundary === 'end' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date;
}
