import { InsightCategory, InsightSeverity } from '@logistics/shared';
import type { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface InsightGenerationPeriod {
  currentEnd: Date;
  currentStart: Date;
  previousEnd: Date;
  previousStart: Date;
}

export interface InsightCandidate {
  actionUrl?: string | null;
  category: InsightCategory;
  comparisonValue?: number | null;
  description: string;
  evidence: Record<string, unknown>;
  metricValue?: number | null;
  metadata?: Record<string, unknown> | null;
  percentageChange?: number | null;
  resourceId?: string | null;
  resourceType?: string | null;
  severity: InsightSeverity;
  title: string;
  type: string;
}

export interface InsightGenerator {
  generate(input: {
    period: InsightGenerationPeriod;
    prisma: PrismaService;
    tenantId: string;
  }): Promise<InsightCandidate[]>;
}
