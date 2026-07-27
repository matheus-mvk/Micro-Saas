import { InsightCategory, InsightSeverity } from '@logistics/shared';
import { Injectable } from '@nestjs/common';
import { ImportStatus, ShipmentStatus } from '@prisma/client';

import type { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { InsightCandidate, InsightGenerator, InsightGenerationPeriod } from './insight-generator.types';

@Injectable()
export class PerformanceInsightsGenerator implements InsightGenerator {
  async generate(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const [deadline, carrier, route, customer, operation, imports] = await Promise.all([
      this.fastestCarrier(input),
      this.carrierDependency(input),
      this.routeConcentration(input),
      this.customerVolume(input),
      this.operationRisks(input),
      this.importQuality(input),
    ]);
    return [...deadline, ...carrier, ...route, ...customer, ...operation, ...imports];
  }

  private async fastestCarrier(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const options = await input.prisma.freightSimulationOption.findMany({
      where: { createdAt: { gte: input.period.currentStart, lt: input.period.currentEnd }, tenantId: input.tenantId },
      select: { carrierId: true, carrierName: true, deadlineDays: true, serviceName: true },
      take: 1000,
    });
    const groups = group(options, (option) => option.carrierId, (option) => option.deadlineDays, (option) => option.carrierName);
    const best = groups.filter((item) => item.count >= 2).sort((a, b) => a.average - b.average)[0];
    if (!best) return [];
    return [{
      actionUrl: '/freight/simulate',
      category: InsightCategory.DEADLINE,
      description: `${best.label} apresentou o menor prazo medio ofertado (${round(best.average)} dia(s)) no periodo.`,
      evidence: { averageDeadlineDays: round(best.average), carrierName: best.label, optionCount: best.count },
      metricValue: round(best.average),
      resourceId: best.key,
      resourceType: 'Carrier',
      severity: InsightSeverity.INFO,
      title: `${best.label} lidera em prazo medio`,
      type: 'FASTEST_CARRIER',
    }];
  }

  private async carrierDependency(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const selected = await input.prisma.freightSimulationOption.findMany({
      where: { createdAt: { gte: input.period.currentStart, lt: input.period.currentEnd }, selected: true, tenantId: input.tenantId },
      select: { carrierId: true, carrierName: true },
      take: 1000,
    });
    if (selected.length < 4) return [];
    const counts = countBy(selected, (item) => item.carrierId, (item) => item.carrierName);
    const top = counts.sort((a, b) => b.count - a.count)[0];
    if (!top) return [];
    const share = (top.count / selected.length) * 100;
    if (share < 65) return [];
    return [{
      actionUrl: '/freight/history',
      category: InsightCategory.CARRIER,
      description: `${round(share)}% das opcoes selecionadas estao concentradas em ${top.label}. Avalie alternativas para reduzir dependencia operacional.`,
      evidence: { carrierName: top.label, selectedCount: top.count, share: round(share), totalSelected: selected.length },
      metricValue: round(share),
      resourceId: top.key,
      resourceType: 'Carrier',
      severity: share >= 80 ? InsightSeverity.WARNING : InsightSeverity.INFO,
      title: `Dependencia elevada de ${top.label}`,
      type: 'CARRIER_DEPENDENCY',
    }];
  }

  private async routeConcentration(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const simulations = await input.prisma.freightSimulation.findMany({
      where: { createdAt: { gte: input.period.currentStart, lt: input.period.currentEnd }, tenantId: input.tenantId },
      select: { destinationPostalCode: true, originPostalCode: true },
      take: 1000,
    });
    const routes = countBy(simulations, (item) => `${item.originPostalCode}->${item.destinationPostalCode}`, (item) => `${item.originPostalCode}->${item.destinationPostalCode}`);
    const top = routes.sort((a, b) => b.count - a.count)[0];
    if (!top || top.count < 3) return [];
    return [{
      actionUrl: '/freight/history',
      category: InsightCategory.ROUTE,
      description: `A rota ${top.label} concentrou ${top.count} simulacoes no periodo. Use esse volume para negociar tabela dedicada.`,
      evidence: { route: top.label, simulationCount: top.count, totalSimulations: simulations.length },
      metricValue: top.count,
      resourceType: 'Route',
      severity: InsightSeverity.OPPORTUNITY,
      title: `Rota recorrente com potencial de negociacao`,
      type: 'ROUTE_NEGOTIATION_POTENTIAL',
    }];
  }

  private async customerVolume(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const simulations = await input.prisma.freightSimulation.findMany({
      where: { createdAt: { gte: input.period.currentStart, lt: input.period.currentEnd }, customerId: { not: null }, tenantId: input.tenantId },
      include: { customer: true },
      take: 1000,
    });
    const customers = countBy(simulations, (item) => item.customerId ?? 'unknown', (item) => item.customer?.name ?? 'Cliente sem nome');
    const top = customers.sort((a, b) => b.count - a.count)[0];
    if (!top || top.count < 2) return [];
    return [{
      actionUrl: `/customers`,
      category: InsightCategory.CUSTOMER,
      description: `${top.label} concentrou ${top.count} simulacoes. Vale revisar rotas recorrentes e condicoes comerciais desse cliente.`,
      evidence: { customerName: top.label, simulationCount: top.count },
      metricValue: top.count,
      resourceId: top.key,
      resourceType: 'Customer',
      severity: InsightSeverity.INFO,
      title: `${top.label} lidera volume de simulacoes`,
      type: 'CUSTOMER_SIMULATION_VOLUME',
    }];
  }

  private async operationRisks(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const now = new Date();
    const [delayed, shipments, simulations] = await Promise.all([
      input.prisma.shipment.count({
        where: {
          estimatedDeliveryAt: { lt: now },
          status: { notIn: [ShipmentStatus.DELIVERED, ShipmentStatus.CANCELED, ShipmentStatus.RETURNED] },
          tenantId: input.tenantId,
        },
      }),
      input.prisma.shipment.count({ where: { createdAt: { gte: input.period.currentStart, lt: input.period.currentEnd }, tenantId: input.tenantId } }),
      input.prisma.freightSimulation.count({ where: { createdAt: { gte: input.period.currentStart, lt: input.period.currentEnd }, tenantId: input.tenantId } }),
    ]);
    const insights: InsightCandidate[] = [];
    if (delayed > 0) {
      insights.push({
        actionUrl: '/dashboard',
        category: InsightCategory.OPERATION,
        description: `${delayed} shipment(s) estao com previsao vencida e ainda nao possuem status terminal.`,
        evidence: { delayedShipments: delayed },
        metricValue: delayed,
        resourceType: 'Shipment',
        severity: delayed >= 3 ? InsightSeverity.CRITICAL : InsightSeverity.WARNING,
        title: 'Shipments atrasados exigem acao',
        type: 'DELAYED_SHIPMENTS',
      });
    }
    if (simulations >= 3) {
      const conversion = (shipments / simulations) * 100;
      if (conversion < 40) {
        insights.push({
          actionUrl: '/freight/history',
          category: InsightCategory.OPERATION,
          description: `A conversao de simulacoes em shipments foi de ${round(conversion)}%. Revise follow-up comercial ou criterios de selecao.`,
          evidence: { conversionRate: round(conversion), shipments, simulations },
          metricValue: round(conversion),
          severity: InsightSeverity.OPPORTUNITY,
          title: 'Conversao de simulacao em operacao esta baixa',
          type: 'LOW_SIMULATION_CONVERSION',
        });
      }
    }
    return insights;
  }

  private async importQuality(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const jobs = await input.prisma.importJob.findMany({
      where: { createdAt: { gte: input.period.currentStart, lt: input.period.currentEnd }, tenantId: input.tenantId },
      take: 200,
    });
    const insights: InsightCandidate[] = [];
    for (const job of jobs) {
      if (job.totalRows > 0 && job.errorRows / job.totalRows >= 0.2) {
        insights.push({
          actionUrl: `/imports/${job.id}`,
          category: InsightCategory.IMPORT,
          description: `O arquivo ${job.filename} teve ${job.errorRows} erro(s) em ${job.totalRows} linha(s).`,
          evidence: { errorRate: round((job.errorRows / job.totalRows) * 100), errorRows: job.errorRows, filename: job.filename, totalRows: job.totalRows },
          metricValue: round((job.errorRows / job.totalRows) * 100),
          resourceId: job.id,
          resourceType: 'ImportJob',
          severity: job.errorRows / job.totalRows >= 0.5 ? InsightSeverity.WARNING : InsightSeverity.INFO,
          title: 'Importacao com alta taxa de erro',
          type: 'IMPORT_HIGH_ERROR_RATE',
        });
      }
      if (job.status === ImportStatus.PROCESSING && job.updatedAt.getTime() < Date.now() - 30 * 60 * 1000) {
        insights.push({
          actionUrl: `/imports/${job.id}`,
          category: InsightCategory.IMPORT,
          description: `O job ${job.filename} esta em processamento ha mais de 30 minutos sem conclusao.`,
          evidence: { filename: job.filename, updatedAt: job.updatedAt.toISOString() },
          resourceId: job.id,
          resourceType: 'ImportJob',
          severity: InsightSeverity.WARNING,
          title: 'Importacao possivelmente travada',
          type: 'IMPORT_STALLED',
        });
      }
    }
    return insights.slice(0, 5);
  }
}

function group<T>(items: T[], key: (item: T) => string, value: (item: T) => number, label: (item: T) => string): Array<{ average: number; count: number; key: string; label: string }> {
  const groups = new Map<string, { count: number; label: string; sum: number }>();
  for (const item of items) {
    const mapKey = key(item);
    const current = groups.get(mapKey) ?? { count: 0, label: label(item), sum: 0 };
    current.count += 1;
    current.sum += value(item);
    groups.set(mapKey, current);
  }
  return [...groups.entries()].map(([keyValue, groupValue]) => ({ average: groupValue.sum / groupValue.count, count: groupValue.count, key: keyValue, label: groupValue.label }));
}

function countBy<T>(items: T[], key: (item: T) => string, label: (item: T) => string): Array<{ count: number; key: string; label: string }> {
  const groups = new Map<string, { count: number; label: string }>();
  for (const item of items) {
    const mapKey = key(item);
    const current = groups.get(mapKey) ?? { count: 0, label: label(item) };
    current.count += 1;
    groups.set(mapKey, current);
  }
  return [...groups.entries()].map(([keyValue, groupValue]) => ({ count: groupValue.count, key: keyValue, label: groupValue.label }));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
