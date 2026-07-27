import { InsightCategory, InsightSeverity } from '@logistics/shared';
import { Injectable } from '@nestjs/common';

import type { InsightCandidate, InsightGenerator, InsightGenerationPeriod } from './insight-generator.types';
import type { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class CostInsightsGenerator implements InsightGenerator {
  async generate(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const [savings, routeIncrease, cheapestCarrier, outliers] = await Promise.all([
      this.savingsOpportunity(input),
      this.routeCostIncrease(input),
      this.cheapestCarrier(input),
      this.freightOutliers(input),
    ]);
    return [...savings, ...routeIncrease, ...cheapestCarrier, ...outliers];
  }

  private async savingsOpportunity(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const simulations = await input.prisma.freightSimulation.findMany({
      where: { createdAt: { gte: input.period.currentStart, lt: input.period.currentEnd }, tenantId: input.tenantId },
      include: { options: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    let occurrences = 0;
    let potentialSavings = 0;
    const selectedByCarrier = new Map<string, number>();
    const cheaperByCarrier = new Map<string, number>();
    for (const simulation of simulations) {
      const selected = simulation.options.find((option) => option.selected);
      const cheapest = simulation.options.reduce((best, option) => (!best || option.totalPrice.lessThan(best.totalPrice) ? option : best), undefined as (typeof simulation.options)[number] | undefined);
      if (!selected || !cheapest || selected.id === cheapest.id || !selected.totalPrice.greaterThan(cheapest.totalPrice)) continue;
      occurrences += 1;
      potentialSavings += selected.totalPrice.minus(cheapest.totalPrice).toNumber();
      selectedByCarrier.set(selected.carrierName, (selectedByCarrier.get(selected.carrierName) ?? 0) + 1);
      cheaperByCarrier.set(cheapest.carrierName, (cheaperByCarrier.get(cheapest.carrierName) ?? 0) + 1);
    }
    if (occurrences < 2 || potentialSavings <= 0) return [];
    return [{
      actionUrl: '/freight/history',
      category: InsightCategory.COST,
      description: `Em ${occurrences} simulacoes, a opcao selecionada nao foi a mais barata. A economia potencial estimada no periodo e ${formatMoney(potentialSavings)}.`,
      evidence: {
        cheaperCarrier: topKey(cheaperByCarrier),
        occurrences,
        selectedCarrier: topKey(selectedByCarrier),
      },
      metricValue: round(potentialSavings),
      resourceType: 'FreightSimulation',
      severity: InsightSeverity.OPPORTUNITY,
      title: 'Economia potencial em opcoes nao selecionadas',
      type: 'COST_SAVINGS_NOT_SELECTED',
    }];
  }

  private async routeCostIncrease(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const current = await routeAverages(input.prisma, input.tenantId, input.period.currentStart, input.period.currentEnd);
    const previous = await routeAverages(input.prisma, input.tenantId, input.period.previousStart, input.period.previousEnd);
    return current.flatMap((route) => {
      const prior = previous.find((item) => item.route === route.route);
      if (!prior || route.count < 2 || prior.count < 2 || route.average <= prior.average) return [];
      const change = percentageChange(route.average, prior.average);
      if (change < 15) return [];
      return [{
        actionUrl: `/freight/history`,
        category: InsightCategory.COST,
        comparisonValue: round(prior.average),
        description: `A rota ${route.route} teve aumento de ${round(change)}% no custo medio em relacao ao periodo anterior.`,
        evidence: { currentAverage: round(route.average), currentCount: route.count, previousAverage: round(prior.average), previousCount: prior.count, route: route.route },
        metricValue: round(route.average),
        percentageChange: round(change),
        resourceType: 'Route',
        severity: change >= 30 ? InsightSeverity.WARNING : InsightSeverity.INFO,
        title: `Custo medio subiu na rota ${route.route}`,
        type: 'ROUTE_COST_INCREASE',
      }];
    }).slice(0, 5);
  }

  private async cheapestCarrier(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const options = await input.prisma.freightSimulationOption.findMany({
      where: { createdAt: { gte: input.period.currentStart, lt: input.period.currentEnd }, tenantId: input.tenantId },
      select: { carrierId: true, carrierName: true, totalPrice: true },
      take: 1000,
    });
    const groups = aggregate(options, (option) => option.carrierId, (option) => option.totalPrice.toNumber(), (option) => option.carrierName);
    const ranked = groups.filter((group) => group.count >= 2).sort((a, b) => a.average - b.average);
    const best = ranked[0];
    if (!best) return [];
    return [{
      actionUrl: '/freight/simulate',
      category: InsightCategory.COST,
      description: `${best.label} apresentou o menor preco medio entre transportadoras com volume minimo no periodo (${formatMoney(best.average)}).`,
      evidence: { averagePrice: round(best.average), carrierName: best.label, optionCount: best.count },
      metricValue: round(best.average),
      resourceId: best.key,
      resourceType: 'Carrier',
      severity: InsightSeverity.OPPORTUNITY,
      title: `${best.label} e a transportadora mais economica no periodo`,
      type: 'CHEAPEST_CARRIER',
    }];
  }

  private async freightOutliers(input: { period: InsightGenerationPeriod; prisma: PrismaService; tenantId: string }): Promise<InsightCandidate[]> {
    const options = await input.prisma.freightSimulationOption.findMany({
      where: { createdAt: { gte: input.period.currentStart, lt: input.period.currentEnd }, tenantId: input.tenantId },
      include: { simulation: true },
      take: 1000,
    });
    const byRoute = new Map<string, number[]>();
    for (const option of options) {
      const route = `${option.simulation.originPostalCode}->${option.simulation.destinationPostalCode}`;
      byRoute.set(route, [...(byRoute.get(route) ?? []), option.totalPrice.toNumber()]);
    }
    const insights: InsightCandidate[] = [];
    for (const [route, values] of byRoute) {
      if (values.length < 4) continue;
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      const high = values.filter((value) => value > average * 1.35);
      if (high.length === 0) continue;
      insights.push({
        actionUrl: '/freight/history',
        category: InsightCategory.COST,
        description: `${high.length} opcao(oes) da rota ${route} ficaram mais de 35% acima da media da rota.`,
        evidence: { average: round(average), outliers: high.length, route, threshold: round(average * 1.35) },
        metricValue: high.length,
        resourceType: 'Route',
        severity: InsightSeverity.WARNING,
        title: `Fretes fora do padrao na rota ${route}`,
        type: 'FREIGHT_PRICE_OUTLIER',
      });
    }
    return insights.slice(0, 3);
  }
}

async function routeAverages(prisma: PrismaService, tenantId: string, start: Date, end: Date): Promise<Array<{ average: number; count: number; route: string }>> {
  const simulations = await prisma.freightSimulation.findMany({
    where: { createdAt: { gte: start, lt: end }, estimatedPrice: { not: null }, tenantId },
    select: { destinationPostalCode: true, estimatedPrice: true, originPostalCode: true },
    take: 1000,
  });
  const grouped = new Map<string, { count: number; sum: number }>();
  for (const simulation of simulations) {
    const route = `${simulation.originPostalCode}->${simulation.destinationPostalCode}`;
    const current = grouped.get(route) ?? { count: 0, sum: 0 };
    current.count += 1;
    current.sum += simulation.estimatedPrice?.toNumber() ?? 0;
    grouped.set(route, current);
  }
  return [...grouped.entries()].map(([route, value]) => ({ average: value.sum / value.count, count: value.count, route }));
}

function aggregate<T>(items: T[], key: (item: T) => string, value: (item: T) => number, label: (item: T) => string): Array<{ average: number; count: number; key: string; label: string }> {
  const grouped = new Map<string, { count: number; label: string; sum: number }>();
  for (const item of items) {
    const mapKey = key(item);
    const current = grouped.get(mapKey) ?? { count: 0, label: label(item), sum: 0 };
    current.count += 1;
    current.sum += value(item);
    grouped.set(mapKey, current);
  }
  return [...grouped.entries()].map(([mapKey, group]) => ({ average: group.sum / group.count, count: group.count, key: mapKey, label: group.label }));
}

function percentageChange(current: number, previous: number): number {
  return previous === 0 ? 0 : ((current - previous) / previous) * 100;
}

function topKey(input: Map<string, number>): string | null {
  return [...input.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
