import {
  InsightCategory,
  InsightSeverity,
  ShipmentStatus as SharedShipmentStatus,
  UserRole,
  type DashboardActivityDto,
  type DashboardFiltersDto,
  type DashboardSummaryDto,
  type DashboardTrendDto,
} from '@logistics/shared';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditAction, CarrierServiceStatus, FreightSimulationStatus, ImportStatus, InsightStatus, ShipmentStatus, UserStatus, type Prisma } from '@prisma/client';

import { RedisService } from '../../infrastructure/cache/redis.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { buildPeriod } from '../insights/insights.service';

import type { DashboardQueryDto } from './dto/dashboard.dto';

const ACTIVE_SHIPMENT_STATUSES = [
  ShipmentStatus.CREATED,
  ShipmentStatus.PICKUP_SCHEDULED,
  ShipmentStatus.PICKED_UP,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.ARRIVED_AT_HUB,
  ShipmentStatus.OUT_FOR_DELIVERY,
];
const TERMINAL_SHIPMENT_STATUSES: ShipmentStatus[] = [ShipmentStatus.DELIVERED, ShipmentStatus.CANCELED, ShipmentStatus.RETURNED];
const CACHE_TTL_SECONDS = 20;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getSummary(tenantId: string, role: UserRole, query: DashboardQueryDto): Promise<DashboardSummaryDto> {
    const filters = normalizeFilters(query);
    const cacheKey = this.redis.tenantKey(tenantId, `dashboard:${role}:${JSON.stringify(filters)}`);
    const cached = await this.readCache(cacheKey);
    if (cached) return cached;

    const summary = await this.calculateSummary(tenantId, role, filters);
    await this.writeCache(cacheKey, summary);
    return summary;
  }

  private async calculateSummary(tenantId: string, role: UserRole, filters: DashboardFiltersDto): Promise<DashboardSummaryDto> {
    const period = periodFromFilters(filters);
    const fullAccess = role !== UserRole.OPERATOR;
    const currentRange = { gte: period.currentStart, lt: period.currentEnd };
    const previousRange = { gte: period.previousStart, lt: period.previousEnd };
    const simulationWhere = simulationWhereFor(tenantId, filters, currentRange);
    const previousSimulationWhere = simulationWhereFor(tenantId, filters, previousRange);
    const optionWhere = optionWhereFor(tenantId, filters, currentRange);
    const shipmentWhere = shipmentWhereFor(tenantId, filters, currentRange);
    const previousShipmentWhere = shipmentWhereFor(tenantId, filters, previousRange);
    const importWhere = { createdAt: currentRange, tenantId };
    const previousImportWhere = { createdAt: previousRange, tenantId };
    const now = new Date();

    const [
      activeCustomers,
      activeCarriers,
      activeUsers,
      freightSimulations,
      previousFreightSimulations,
      calculatedSimulations,
      freightAggregate,
      previousFreightAggregate,
      lowestOptionAggregate,
      selectedOptionAggregate,
      selectedOptions,
      shipmentsInPeriod,
      previousShipments,
      inTransitShipments,
      delayedShipments,
      previousDelayedShipments,
      deliveredShipments,
      failedShipments,
      importJobs,
      importsCompleted,
      importsFailed,
      importsProcessing,
      importRowsAggregate,
      previousImportRowsAggregate,
      stalledImports,
      auditEvents,
      chartSimulations,
      chartOptions,
      chartShipments,
      recentImports,
      highlights,
      recentActivity,
    ] = await this.prisma.$transaction([
      this.prisma.customer.count({ where: { active: true, tenantId } }),
      this.prisma.carrier.count({ where: { active: true, tenantId } }),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE, tenantId } }),
      this.prisma.freightSimulation.count({ where: simulationWhere }),
      this.prisma.freightSimulation.count({ where: previousSimulationWhere }),
      this.prisma.freightSimulation.count({ where: { ...simulationWhere, status: FreightSimulationStatus.CALCULATED } }),
      this.prisma.freightSimulation.aggregate({ _avg: { estimatedPrice: true }, where: { ...simulationWhere, estimatedPrice: { not: null } } }),
      this.prisma.freightSimulation.aggregate({ _avg: { estimatedPrice: true }, where: { ...previousSimulationWhere, estimatedPrice: { not: null } } }),
      this.prisma.freightSimulationOption.aggregate({ _avg: { totalPrice: true }, where: { ...optionWhere, cheapest: true } }),
      this.prisma.freightSimulationOption.aggregate({ _avg: { totalPrice: true }, where: { ...optionWhere, selected: true } }),
      this.prisma.freightSimulationOption.count({ where: { ...optionWhere, selected: true } }),
      this.prisma.shipment.count({ where: shipmentWhere }),
      this.prisma.shipment.count({ where: previousShipmentWhere }),
      this.prisma.shipment.count({ where: statusMetricWhere(shipmentWhere, filters.status, ACTIVE_SHIPMENT_STATUSES) }),
      this.prisma.shipment.count({ where: delayedMetricWhere(shipmentWhere, filters.status, now) }),
      this.prisma.shipment.count({ where: delayedMetricWhere(previousShipmentWhere, filters.status, period.currentStart) }),
      this.prisma.shipment.count({ where: statusMetricWhere(shipmentWhere, filters.status, [ShipmentStatus.DELIVERED]) }),
      this.prisma.shipment.count({ where: statusMetricWhere(shipmentWhere, filters.status, [ShipmentStatus.DELIVERY_FAILED]) }),
      this.prisma.importJob.count({ where: importWhere }),
      this.prisma.importJob.count({ where: { ...importWhere, status: ImportStatus.COMPLETED } }),
      this.prisma.importJob.count({ where: { ...importWhere, status: ImportStatus.FAILED } }),
      this.prisma.importJob.count({ where: { status: ImportStatus.PROCESSING, tenantId } }),
      this.prisma.importJob.aggregate({ _sum: { errorRows: true, totalRows: true }, where: importWhere }),
      this.prisma.importJob.aggregate({ _sum: { errorRows: true, totalRows: true }, where: previousImportWhere }),
      this.prisma.importJob.count({ where: { status: ImportStatus.PROCESSING, tenantId, updatedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) } } }),
      this.prisma.auditLog.count({ where: { tenantId } }),
      this.prisma.freightSimulation.findMany({
        where: simulationWhere,
        include: { options: { select: { id: true, selected: true, totalPrice: true } } },
        orderBy: { createdAt: 'asc' },
        take: 1000,
      }),
      this.prisma.freightSimulationOption.findMany({
        where: optionWhere,
        orderBy: { createdAt: 'desc' },
        select: { carrierId: true, carrierName: true, createdAt: true, deadlineDays: true, selected: true, totalPrice: true },
        take: 1000,
      }),
      this.prisma.shipment.findMany({
        where: shipmentWhere,
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true, status: true },
        take: 1000,
      }),
      this.prisma.importJob.findMany({
        where: importWhere,
        orderBy: { createdAt: 'desc' },
        select: { errorRows: true, filename: true, id: true, successRows: true, totalRows: true },
        take: 8,
      }),
      this.prisma.insight.findMany({
        where: { generatedAt: currentRange, status: { not: InsightStatus.DISMISSED }, tenantId },
        orderBy: [{ severity: 'desc' }, { generatedAt: 'desc' }],
        take: 4,
      }),
      this.prisma.auditLog.findMany({
        where: {
          action: { in: [AuditAction.FREIGHT_SIMULATION_CREATED, AuditAction.FREIGHT_OPTION_SELECTED, AuditAction.SHIPMENT_CREATED, AuditAction.IMPORT_COMPLETED, AuditAction.IMPORT_FAILED] },
          createdAt: currentRange,
          tenantId,
        },
        orderBy: { createdAt: 'desc' },
        select: { action: true, createdAt: true, entityId: true, entityType: true, id: true },
        take: 8,
      }),
    ]);
    const filterOptions = await this.loadFilterOptions(tenantId);

    const averageEstimatedPrice = freightAggregate._avg.estimatedPrice?.toNumber() ?? null;
    const previousAverageEstimatedPrice = previousFreightAggregate._avg.estimatedPrice?.toNumber() ?? null;
    const importErrorRate = percent(importRowsAggregate._sum.errorRows ?? 0, importRowsAggregate._sum.totalRows ?? 0);
    const previousImportErrorRate = percent(previousImportRowsAggregate._sum.errorRows ?? 0, previousImportRowsAggregate._sum.totalRows ?? 0);
    const estimatedSavings = fullAccess ? round(estimateSavings(chartSimulations)) : 0;
    const conversionRate = percent(shipmentsInPeriod, freightSimulations);
    const successRate = percent(deliveredShipments, shipmentsInPeriod);

    return {
      accessScope: fullAccess ? 'FULL' : 'OPERATIONAL',
      comparisons: {
        costAverage: trend(averageEstimatedPrice, previousAverageEstimatedPrice, false),
        delayedShipments: trend(delayedShipments, previousDelayedShipments, false),
        freightSimulations: trend(freightSimulations, previousFreightSimulations, true),
        importErrorRate: trend(importErrorRate, previousImportErrorRate, false),
        shipments: trend(shipmentsInPeriod, previousShipments, true),
      },
      filterOptions,
      filters,
      generatedAt: new Date().toISOString(),
      period: {
        end: period.currentEnd.toISOString(),
        previousEnd: period.previousEnd.toISOString(),
        previousStart: period.previousStart.toISOString(),
        start: period.currentStart.toISOString(),
      },
      tenantId,
      totals: {
        activeCarriers,
        activeCustomers,
        activeUsers,
        auditEvents,
        freightSimulations,
        importJobs,
      },
      freight: {
        averageEstimatedPrice: fullAccess ? averageEstimatedPrice : null,
        averageLowestOption: fullAccess ? lowestOptionAggregate._avg.totalPrice?.toNumber() ?? null : null,
        calculatedSimulations,
        conversionRate,
        estimatedSavings,
        selectedAveragePrice: fullAccess ? selectedOptionAggregate._avg.totalPrice?.toNumber() ?? null : null,
        selectedOptions,
        shipmentsFromSimulations: shipmentsInPeriod,
        simulationsChangePercent: percentageChange(freightSimulations, previousFreightSimulations),
      },
      imports: {
        completed: importsCompleted,
        errorRate: importErrorRate,
        failed: importsFailed,
        processing: importsProcessing,
        stalled: stalledImports,
      },
      operations: {
        delayedShipments,
        deliveredShipments,
        failedShipments,
        inTransitShipments,
        successRate,
        totalShipments: shipmentsInPeriod,
      },
      charts: {
        carrierPerformance: carrierPerformance(chartOptions, fullAccess),
        conversionByPeriod: conversionByPeriod(chartSimulations, chartShipments),
        costByPeriod: fullAccess ? costByPeriod(chartSimulations) : [],
        importsQuality: recentImports.map((job) => ({ errorRows: job.errorRows, filename: job.filename, id: job.id, successRows: job.successRows, totalRows: job.totalRows })),
        routePerformance: routePerformance(chartSimulations, fullAccess),
        selectedCarriers: selectedCarriers(chartOptions),
        shipmentStatus: shipmentStatus(chartShipments.map((shipment) => shipment.status)),
        simulationsByPeriod: simulationsByPeriod(chartSimulations),
      },
      decisionHighlights: highlights.map((insight) => ({
        actionUrl: insight.actionUrl,
        category: insight.category as unknown as InsightCategory,
        severity: insight.severity as unknown as InsightSeverity,
        title: insight.title,
        value: insight.metricValue?.toNumber().toString() ?? insight.percentageChange?.toNumber().toString() ?? '',
      })),
      recentActivity: recentActivity.map(presentActivity),
    };
  }

  private async loadFilterOptions(tenantId: string): Promise<DashboardSummaryDto['filterOptions']> {
    return this.prisma.$transaction(async (tx) => {
      const [customers, carriers, services, branches] = await Promise.all([
        tx.customer.findMany({ where: { active: true, tenantId }, orderBy: { name: 'asc' }, select: { id: true, name: true }, take: 100 }),
        tx.carrier.findMany({ where: { active: true, tenantId }, orderBy: { name: 'asc' }, select: { id: true, name: true }, take: 100 }),
        tx.carrierService.findMany({
          where: { carrier: { active: true }, status: CarrierServiceStatus.ACTIVE, tenantId },
          orderBy: { name: 'asc' },
          select: { carrierId: true, id: true, name: true },
          take: 150,
        }),
        tx.branch.findMany({ where: { active: true, tenantId }, orderBy: [{ main: 'desc' }, { name: 'asc' }], select: { id: true, name: true }, take: 50 }),
      ]);
      return {
        branches: branches.map((branch) => ({ id: branch.id, label: branch.name })),
        carrierServices: services.map((service) => ({ carrierId: service.carrierId, id: service.id, label: service.name })),
        carriers: carriers.map((carrier) => ({ id: carrier.id, label: carrier.name })),
        customers: customers.map((customer) => ({ id: customer.id, label: customer.name })),
        shipmentStatuses: Object.values(SharedShipmentStatus).map((status) => ({ id: status, label: status })),
      };
    });
  }

  private async readCache(key: string): Promise<DashboardSummaryDto | null> {
    try {
      const cached = await this.redis.client.get(key);
      return cached ? JSON.parse(cached) as DashboardSummaryDto : null;
    } catch {
      return null;
    }
  }

  private async writeCache(key: string, summary: DashboardSummaryDto): Promise<void> {
    try {
      await this.redis.client.set(key, JSON.stringify(summary), 'EX', CACHE_TTL_SECONDS);
    } catch {
      // Dashboard remains available when Redis is unavailable.
    }
  }
}

function normalizeFilters(query: DashboardQueryDto): DashboardFiltersDto {
  const filters: DashboardFiltersDto = {};
  if (query.startDate) filters.startDate = query.startDate;
  if (query.endDate) filters.endDate = query.endDate;
  if (query.customerId) filters.customerId = query.customerId;
  if (query.carrierId) filters.carrierId = query.carrierId;
  if (query.carrierServiceId) filters.carrierServiceId = query.carrierServiceId;
  if (query.branchId) filters.branchId = query.branchId;
  if (query.status) filters.status = query.status;
  return filters;
}

function periodFromFilters(filters: DashboardFiltersDto) {
  if (!filters.startDate && !filters.endDate) return buildPeriod();

  const currentStart = filters.startDate ? parseDateBoundary(filters.startDate, 'start') : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const currentEnd = filters.endDate ? parseDateBoundary(filters.endDate, 'end') : new Date();
  if (Number.isNaN(currentStart.getTime()) || Number.isNaN(currentEnd.getTime()) || currentStart >= currentEnd) {
    throw new BadRequestException('Periodo do dashboard invalido.');
  }
  const durationMs = currentEnd.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart);
  const previousStart = new Date(currentStart.getTime() - durationMs);
  return { currentEnd, currentStart, previousEnd, previousStart };
}

function simulationWhereFor(tenantId: string, filters: DashboardFiltersDto, createdAt: Prisma.DateTimeFilter): Prisma.FreightSimulationWhereInput {
  const optionFilter = optionRelationFilter(tenantId, filters);
  return {
    createdAt,
    tenantId,
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(optionFilter ? { options: { some: optionFilter } } : {}),
  };
}

function optionWhereFor(tenantId: string, filters: DashboardFiltersDto, createdAt: Prisma.DateTimeFilter): Prisma.FreightSimulationOptionWhereInput {
  return {
    createdAt,
    tenantId,
    ...(filters.carrierId ? { carrierId: filters.carrierId } : {}),
    ...(filters.carrierServiceId ? { carrierServiceId: filters.carrierServiceId } : {}),
    ...(filters.branchId || filters.customerId
      ? { simulation: { ...(filters.branchId ? { branchId: filters.branchId } : {}), ...(filters.customerId ? { customerId: filters.customerId } : {}), tenantId } }
      : {}),
  };
}

function optionRelationFilter(tenantId: string, filters: DashboardFiltersDto): Prisma.FreightSimulationOptionWhereInput | null {
  if (!filters.carrierId && !filters.carrierServiceId) return null;
  return {
    tenantId,
    ...(filters.carrierId ? { carrierId: filters.carrierId } : {}),
    ...(filters.carrierServiceId ? { carrierServiceId: filters.carrierServiceId } : {}),
  };
}

function shipmentWhereFor(tenantId: string, filters: DashboardFiltersDto, createdAt: Prisma.DateTimeFilter): Prisma.ShipmentWhereInput {
  return {
    createdAt,
    tenantId,
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.carrierId ? { carrierId: filters.carrierId } : {}),
    ...(filters.carrierServiceId ? { carrierServiceId: filters.carrierServiceId } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.status ? { status: filters.status as unknown as ShipmentStatus } : {}),
  };
}

function statusMetricWhere(base: Prisma.ShipmentWhereInput, requested: SharedShipmentStatus | undefined, allowed: ShipmentStatus[]): Prisma.ShipmentWhereInput {
  if (requested) {
    return allowed.includes(requested as unknown as ShipmentStatus) ? base : { ...base, id: '__no_match__' };
  }
  return { ...base, status: allowed.length === 1 ? allowed[0] : { in: allowed } };
}

function delayedMetricWhere(base: Prisma.ShipmentWhereInput, requested: SharedShipmentStatus | undefined, cutoff: Date): Prisma.ShipmentWhereInput {
  if (requested && isShipmentStatusIn(requested, TERMINAL_SHIPMENT_STATUSES)) {
    return { ...base, id: '__no_match__' };
  }
  return {
    ...base,
    estimatedDeliveryAt: { lt: cutoff },
    ...(requested ? {} : { status: { notIn: TERMINAL_SHIPMENT_STATUSES } }),
  };
}

function isShipmentStatusIn(status: SharedShipmentStatus, statuses: readonly ShipmentStatus[]): boolean {
  return statuses.includes(status as ShipmentStatus);
}

function parseDateBoundary(value: string, boundary: 'end' | 'start'): Date {
  const date = new Date(value);
  if (boundary === 'end' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date;
}

function simulationsByPeriod(simulations: Array<{ createdAt: Date }>) {
  const map = new Map<string, number>();
  for (const simulation of simulations) {
    const label = simulation.createdAt.toISOString().slice(5, 10);
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).slice(-14);
}

function costByPeriod(simulations: Array<{ createdAt: Date; estimatedPrice: { toNumber(): number } | null }>) {
  const map = new Map<string, { count: number; sum: number }>();
  for (const simulation of simulations) {
    if (!simulation.estimatedPrice) continue;
    const label = simulation.createdAt.toISOString().slice(5, 10);
    const current = map.get(label) ?? { count: 0, sum: 0 };
    current.count += 1;
    current.sum += simulation.estimatedPrice.toNumber();
    map.set(label, current);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value: round(value.sum / value.count) })).slice(-14);
}

function carrierPerformance(
  options: Array<{ carrierId: string; carrierName: string; deadlineDays: number; selected: boolean; totalPrice: { toNumber(): number } }>,
  fullAccess: boolean,
) {
  const map = new Map<string, { deadline: number; name: string; options: number; selected: number; total: number }>();
  for (const option of options) {
    const current = map.get(option.carrierId) ?? { deadline: 0, name: option.carrierName, options: 0, selected: 0, total: 0 };
    current.deadline += option.deadlineDays;
    current.options += 1;
    current.selected += option.selected ? 1 : 0;
    current.total += option.totalPrice.toNumber();
    map.set(option.carrierId, current);
  }
  return [...map.entries()]
    .map(([carrierId, value]) => ({
      averageDeadlineDays: round(value.deadline / value.options),
      averagePrice: fullAccess ? round(value.total / value.options) : null,
      carrierId,
      carrierName: value.name,
      optionCount: value.options,
      selectedCount: value.selected,
    }))
    .sort((a, b) => (b.selectedCount - a.selectedCount) || ((a.averagePrice ?? Number.MAX_SAFE_INTEGER) - (b.averagePrice ?? Number.MAX_SAFE_INTEGER)))
    .slice(0, 8);
}

function routePerformance(
  simulations: Array<{ destinationPostalCode: string; options: Array<unknown>; originPostalCode: string; estimatedPrice: { toNumber(): number } | null }>,
  fullAccess: boolean,
) {
  const map = new Map<string, { count: number; options: number; sum: number }>();
  for (const simulation of simulations) {
    const route = `${simulation.originPostalCode}->${simulation.destinationPostalCode}`;
    const current = map.get(route) ?? { count: 0, options: 0, sum: 0 };
    current.count += 1;
    current.options += simulation.options.length;
    current.sum += simulation.estimatedPrice?.toNumber() ?? 0;
    map.set(route, current);
  }
  return [...map.entries()]
    .map(([route, value]) => ({ averagePrice: fullAccess && value.count > 0 ? round(value.sum / value.count) : null, optionCount: value.options, route, simulationCount: value.count }))
    .sort((a, b) => b.simulationCount - a.simulationCount)
    .slice(0, 8);
}

function shipmentStatus(statuses: string[]) {
  const map = new Map<string, number>();
  for (const status of statuses) map.set(status, (map.get(status) ?? 0) + 1);
  return [...map.entries()].map(([label, value]) => ({ label, value }));
}

function selectedCarriers(options: Array<{ carrierName: string; selected: boolean }>) {
  const map = new Map<string, number>();
  for (const option of options) {
    if (option.selected) map.set(option.carrierName, (map.get(option.carrierName) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function conversionByPeriod(simulations: Array<{ createdAt: Date }>, shipments: Array<{ createdAt: Date }>) {
  const simulationMap = new Map<string, number>();
  const shipmentMap = new Map<string, number>();
  for (const simulation of simulations) {
    const label = simulation.createdAt.toISOString().slice(5, 10);
    simulationMap.set(label, (simulationMap.get(label) ?? 0) + 1);
  }
  for (const shipment of shipments) {
    const label = shipment.createdAt.toISOString().slice(5, 10);
    shipmentMap.set(label, (shipmentMap.get(label) ?? 0) + 1);
  }
  return [...simulationMap.entries()].map(([label, total]) => ({ label, value: percent(shipmentMap.get(label) ?? 0, total) })).slice(-14);
}

function estimateSavings(
  simulations: Array<{
    options: Array<{
      selected: boolean;
      totalPrice: {
        greaterThan(value: unknown): boolean;
        lessThan(value: unknown): boolean;
        minus(value: unknown): { toNumber(): number };
      };
    }>;
  }>,
): number {
  return simulations.reduce((sum, simulation) => {
    const options = simulation.options as Array<{ selected?: boolean; totalPrice: { greaterThan(value: unknown): boolean; lessThan(value: unknown): boolean; minus(value: unknown): { toNumber(): number } } }>;
    const selected = options.find((option) => option.selected);
    const cheapest = options.reduce((best, option) => (!best || option.totalPrice.lessThan(best.totalPrice) ? option : best), undefined as typeof options[number] | undefined);
    return selected && cheapest && selected.totalPrice.greaterThan(cheapest.totalPrice) ? sum + selected.totalPrice.minus(cheapest.totalPrice).toNumber() : sum;
  }, 0);
}

function trend(current: number | null, previous: number | null, higherIsGood: boolean): DashboardTrendDto {
  if (current === null || previous === null) return { absoluteChange: null, current, direction: 'NONE', favorable: null, percentageChange: null, previous };
  const absoluteChange = round(current - previous);
  const percentage = percentageChange(current, previous);
  const direction = absoluteChange > 0 ? 'UP' : absoluteChange < 0 ? 'DOWN' : 'FLAT';
  const favorable = direction === 'FLAT' ? true : higherIsGood ? direction === 'UP' : direction === 'DOWN';
  return { absoluteChange, current, direction, favorable, percentageChange: percentage, previous };
}

function presentActivity(log: { action: AuditAction; createdAt: Date; entityId: string | null; entityType: string | null; id: string }): DashboardActivityDto {
  return { action: log.action, createdAt: log.createdAt.toISOString(), entityId: log.entityId, entityType: log.entityType, id: log.id };
}

function percentageChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return round(((current - previous) / previous) * 100);
}

function percent(numerator: number, denominator: number): number {
  return denominator > 0 ? round((numerator / denominator) * 100) : 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
