import type { PaginatedResult } from '@logistics/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma, ShipmentStatus, TrackingEventType } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { NotificationsGateway } from '../../infrastructure/realtime/notifications.gateway';
import { AuditService } from '../audit/audit.service';
import type { CoverageDto, CoverageTestDto, CreateTrackingEventDto, ListAdminLogisticsDto, RateTableInputDto } from './logistics-admin.dto';

@Injectable()
export class LogisticsAdminService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly notifications: NotificationsGateway) {}

  async listRateTables(tenantId: string, query: ListAdminLogisticsDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.FreightRateTableWhereInput = { tenantId, ...(query.search?.trim() ? { name: { contains: query.search.trim() } } : {}) };
    const [tables, total] = await this.prisma.$transaction([
      this.prisma.freightRateTable.findMany({ where, include: { carrierService: { select: { name: true, carrierId: true } }, ranges: { orderBy: [{ minWeightKg: 'asc' }, { priority: 'desc' }] }, charges: { where: { active: true }, orderBy: { createdAt: 'asc' } } }, orderBy: [{ status: 'asc' }, { validFrom: 'desc' }], skip: (query.page - 1) * query.perPage, take: query.perPage }),
      this.prisma.freightRateTable.count({ where }),
    ]);
    const carrierIds = [...new Set(tables.map((table) => table.carrierService.carrierId))];
    const carriers = await this.prisma.carrier.findMany({ where: { tenantId, id: { in: carrierIds } }, select: { id: true, name: true } });
    const names = new Map(carriers.map((carrier) => [carrier.id, carrier.name]));
    return { data: tables.map((table) => ({ id: table.id, carrierServiceId: table.carrierServiceId, carrierName: names.get(table.carrierService.carrierId) ?? 'Transportadora', serviceName: table.carrierService.name, name: table.name, version: table.version, currency: table.currency, validFrom: table.validFrom.toISOString(), validTo: table.validTo?.toISOString() ?? null, status: table.status, ranges: table.ranges.map((range) => ({ id: range.id, minWeightKg: range.minWeightKg.toNumber(), maxWeightKg: range.maxWeightKg.toNumber(), basePrice: range.basePrice.toNumber(), pricePerKg: range.pricePerKg.toNumber(), excessPricePerKg: range.excessPricePerKg?.toNumber() ?? null, deadlineDays: range.deadlineDays, priority: range.priority })), charges: table.charges.map((charge) => ({ id: charge.id, type: charge.type, name: charge.name, fixedAmount: charge.fixedAmount?.toNumber() ?? null, percentage: charge.percentage?.toNumber() ?? null, active: charge.active })) })), meta: { page: query.page, perPage: query.perPage, total, totalPages: Math.ceil(total / query.perPage) } };
  }

  async getRateTable(tenantId: string, id: string): Promise<unknown> {
    const table = await this.prisma.freightRateTable.findFirst({ where: { id, tenantId }, include: { carrierService: { include: { carrier: { select: { id: true, name: true } } } }, ranges: { orderBy: [{ minWeightKg: 'asc' }, { priority: 'desc' }] }, charges: { orderBy: [{ active: 'desc' }, { createdAt: 'asc' }] }, coverages: { include: { coverage: true } }, previousVersion: { select: { id: true, version: true } }, nextVersions: { select: { id: true, version: true, status: true, validFrom: true } } } });
    if (!table) throw new NotFoundException('Freight rate table was not found.');
    const usedInSimulations = await this.prisma.freightSimulationOption.count({ where: { tenantId, rateTableId: id } });
    return presentRateTable(table, usedInSimulations);
  }

  async createRateTable(tenantId: string, actorId: string, input: RateTableInputDto, previousVersionId?: string): Promise<unknown> {
    validateRanges(input.ranges);
    if (input.validTo && new Date(input.validTo) <= new Date(input.validFrom)) throw new BadRequestException('Vigência da tabela inválida.');
    const service = await this.prisma.carrierService.findFirst({ where: { id: input.carrierServiceId, tenantId }, include: { carrier: true } });
    if (!service || !service.carrier.active) throw new NotFoundException('Servico ou transportadora nao encontrado.');
    const coverageIds = input.coverageIds ?? [];
    const coverages = await this.prisma.carrierCoverage.findMany({ where: { tenantId, id: { in: coverageIds }, carrierServiceId: input.carrierServiceId } });
    if (coverages.length !== coverageIds.length) throw new BadRequestException('Uma ou mais coberturas não pertencem ao serviço.');
    const version = previousVersionId ? ((await this.prisma.freightRateTable.aggregate({ where: { tenantId, carrierServiceId: input.carrierServiceId }, _max: { version: true } }))._max.version ?? 0) + 1 : 1;
    const table = await this.prisma.$transaction(async (tx) => {
      const created = await tx.freightRateTable.create({ data: { tenantId, carrierServiceId: input.carrierServiceId, name: input.name.trim(), currency: input.currency.toUpperCase(), validFrom: new Date(input.validFrom), validTo: input.validTo ? new Date(input.validTo) : undefined, notes: input.notes?.trim(), status: input.status ?? 'INACTIVE', version, previousVersionId, ranges: { create: input.ranges.map((range) => ({ tenantId, minWeightKg: range.minWeightKg, maxWeightKg: range.maxWeightKg, basePrice: range.basePrice, pricePerKg: range.pricePerKg, excessPricePerKg: range.excessPricePerKg, deadlineDays: range.deadlineDays, priority: range.priority ?? 0 })) }, charges: { create: input.charges.map((charge) => ({ tenantId, type: charge.type, name: charge.name.trim(), fixedAmount: charge.fixedAmount, percentage: charge.percentage, active: charge.active ?? true })) }, coverages: { create: coverageIds.map((coverageId) => ({ tenantId, coverageId })) } }, include: { ranges: true, charges: true, coverages: true } });
      return created;
    });
    await this.audit.record({ action: AuditAction.FREIGHT_PRICING_CHANGED, actorId, entityId: table.id, entityType: 'FreightRateTable', metadata: { operation: previousVersionId ? 'new_version' : 'create', version: table.version }, tenantId });
    return this.getRateTable(tenantId, table.id);
  }

  async updateRateTable(tenantId: string, actorId: string, id: string, input: RateTableInputDto): Promise<unknown> {
    const current = await this.prisma.freightRateTable.findFirst({ where: { id, tenantId } });
    if (!current) throw new NotFoundException('Freight rate table was not found.');
    const used = await this.prisma.freightSimulationOption.count({ where: { tenantId, rateTableId: id } });
    if (used > 0) throw new BadRequestException('Tabela já utilizada. Crie uma nova versão para preservar o histórico.');
    validateRanges(input.ranges);
    if (input.validTo && new Date(input.validTo) <= new Date(input.validFrom)) throw new BadRequestException('Vigência da tabela inválida.');
    const service = await this.prisma.carrierService.findFirst({ where: { id: input.carrierServiceId, tenantId }, include: { carrier: true } });
    if (!service || !service.carrier.active) throw new NotFoundException('Servico ou transportadora nao encontrado.');
    const coverageIds = input.coverageIds ?? [];
    const coverages = await this.prisma.carrierCoverage.findMany({ where: { tenantId, id: { in: coverageIds }, carrierServiceId: input.carrierServiceId } });
    if (coverages.length !== coverageIds.length) throw new BadRequestException('Uma ou mais coberturas não pertencem ao serviço.');
    await this.prisma.$transaction(async (tx) => {
      await tx.freightRateRange.deleteMany({ where: { tenantId, rateTableId: id } });
      await tx.freightAdditionalCharge.deleteMany({ where: { tenantId, rateTableId: id } });
      await tx.freightRateTableCoverage.deleteMany({ where: { tenantId, rateTableId: id } });
      await tx.freightRateTable.update({ where: { id }, data: { name: input.name.trim(), carrierServiceId: input.carrierServiceId, currency: input.currency.toUpperCase(), validFrom: new Date(input.validFrom), validTo: input.validTo ? new Date(input.validTo) : null, notes: input.notes?.trim(), status: input.status ?? current.status, ranges: { create: input.ranges.map((range) => ({ tenantId, minWeightKg: range.minWeightKg, maxWeightKg: range.maxWeightKg, basePrice: range.basePrice, pricePerKg: range.pricePerKg, excessPricePerKg: range.excessPricePerKg, deadlineDays: range.deadlineDays, priority: range.priority ?? 0 })) }, charges: { create: input.charges.map((charge) => ({ tenantId, type: charge.type, name: charge.name.trim(), fixedAmount: charge.fixedAmount, percentage: charge.percentage, active: charge.active ?? true })) }, coverages: { create: (input.coverageIds ?? []).map((coverageId) => ({ tenantId, coverageId })) } } });
    });
    await this.audit.record({ action: AuditAction.FREIGHT_PRICING_CHANGED, actorId, entityId: id, entityType: 'FreightRateTable', metadata: { operation: 'update' }, tenantId });
    return this.getRateTable(tenantId, id);
  }

  async createRateTableVersion(tenantId: string, actorId: string, id: string): Promise<unknown> {
    const current = await this.prisma.freightRateTable.findFirst({ where: { id, tenantId }, include: { ranges: true, charges: true, coverages: true } });
    if (!current) throw new NotFoundException('Freight rate table was not found.');
    return this.createRateTable(tenantId, actorId, { name: current.name, carrierServiceId: current.carrierServiceId, currency: current.currency, validFrom: current.validFrom.toISOString(), validTo: current.validTo?.toISOString(), notes: current.notes ?? undefined, status: 'INACTIVE', coverageIds: current.coverages.map((item) => item.coverageId), ranges: current.ranges.map((range) => ({ minWeightKg: range.minWeightKg.toNumber(), maxWeightKg: range.maxWeightKg.toNumber(), basePrice: range.basePrice.toNumber(), pricePerKg: range.pricePerKg.toNumber(), excessPricePerKg: range.excessPricePerKg?.toNumber(), deadlineDays: range.deadlineDays, priority: range.priority })), charges: current.charges.map((charge) => ({ type: charge.type, name: charge.name, fixedAmount: charge.fixedAmount?.toNumber(), percentage: charge.percentage?.toNumber(), active: charge.active })) }, id);
  }

  async updateRateTableStatus(tenantId: string, actorId: string, id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<unknown> {
    const table = await this.prisma.freightRateTable.findFirst({ where: { id, tenantId }, include: { ranges: true } });
    if (!table) throw new NotFoundException('Freight rate table was not found.');
    if (status === 'ACTIVE' && table.ranges.length === 0) throw new BadRequestException('Tabela ativa precisa de ao menos uma faixa.');
    const updated = await this.prisma.freightRateTable.update({ where: { id }, data: { status } });
    await this.audit.record({ action: AuditAction.FREIGHT_PRICING_CHANGED, actorId, entityId: id, entityType: 'FreightRateTable', metadata: { operation: status === 'ACTIVE' ? 'activate' : 'deactivate' }, tenantId });
    return { id: updated.id, status: updated.status };
  }

  async listShipments(tenantId: string, query: ListAdminLogisticsDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ShipmentWhereInput = { tenantId, ...(query.status ? { status: query.status } : {}), ...(query.search?.trim() ? { OR: [{ trackingCode: { contains: query.search.trim() } }, { externalReference: { contains: query.search.trim() } }] } : {}), ...(query.startDate || query.endDate ? { createdAt: { ...(query.startDate ? { gte: new Date(query.startDate) } : {}), ...(query.endDate ? { lt: new Date(`${query.endDate}T23:59:59.999Z`) } : {}) } } : {}) };
    const [shipments, total] = await this.prisma.$transaction([
      this.prisma.shipment.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (query.page - 1) * query.perPage, take: query.perPage }),
      this.prisma.shipment.count({ where }),
    ]);
    const carrierIds = [...new Set(shipments.map((shipment) => shipment.carrierId))];
    const serviceIds = [...new Set(shipments.map((shipment) => shipment.carrierServiceId))];
    const [carriers, services] = await Promise.all([this.prisma.carrier.findMany({ where: { tenantId, id: { in: carrierIds } }, select: { id: true, name: true } }), this.prisma.carrierService.findMany({ where: { tenantId, id: { in: serviceIds } }, select: { id: true, name: true } })]);
    const carrierNames = new Map(carriers.map((carrier) => [carrier.id, carrier.name]));
    const serviceNames = new Map(services.map((service) => [service.id, service.name]));
    return { data: shipments.map((shipment) => ({ id: shipment.id, trackingCode: shipment.trackingCode, externalReference: shipment.externalReference, carrierName: carrierNames.get(shipment.carrierId) ?? 'Transportadora', carrierServiceName: serviceNames.get(shipment.carrierServiceId) ?? 'Servico', status: shipment.status, freightValue: shipment.freightValue.toNumber(), estimatedDeliveryAt: shipment.estimatedDeliveryAt.toISOString(), createdAt: shipment.createdAt.toISOString() })), meta: { page: query.page, perPage: query.perPage, total, totalPages: Math.ceil(total / query.perPage) } };
  }

  async updateShipmentStatus(tenantId: string, actorId: string, id: string, status: ShipmentStatus): Promise<unknown> {
    const current = await this.prisma.shipment.findFirst({ where: { id, tenantId } });
    if (!current) throw new NotFoundException('Shipment was not found.');
    return this.createTrackingEvent(tenantId, actorId, id, { eventType: TrackingEventType.STATUS_CHANGED, status, occurredAt: new Date().toISOString(), description: 'Atualizacao operacional registrada.' });
  }

  async getShipment(tenantId: string, id: string): Promise<unknown> {
    const shipment = await this.prisma.shipment.findFirst({ where: { id, tenantId }, include: { addresses: true, packages: true, trackingEvents: { include: { createdBy: { select: { name: true, email: true } } }, orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }] } } });
    if (!shipment) throw new NotFoundException('Shipment was not found.');
    const [carrier, service, customer, branch] = await Promise.all([
      this.prisma.carrier.findFirst({ where: { id: shipment.carrierId, tenantId }, select: { id: true, name: true } }),
      this.prisma.carrierService.findFirst({ where: { id: shipment.carrierServiceId, tenantId }, select: { id: true, name: true } }),
      shipment.customerId ? this.prisma.customer.findFirst({ where: { id: shipment.customerId, tenantId }, select: { id: true, name: true } }) : null,
      shipment.branchId ? this.prisma.branch.findFirst({ where: { id: shipment.branchId, tenantId }, select: { id: true, name: true } }) : null,
    ]);
    return { id: shipment.id, trackingCode: shipment.trackingCode, externalReference: shipment.externalReference, status: shipment.status, freightValue: shipment.freightValue.toNumber(), cargoValue: shipment.cargoValue?.toNumber() ?? null, realWeightKg: shipment.realWeightKg.toNumber(), chargeableWeightKg: shipment.chargeableWeightKg.toNumber(), estimatedDeliveryAt: shipment.estimatedDeliveryAt.toISOString(), deliveredAt: shipment.deliveredAt?.toISOString() ?? null, createdAt: shipment.createdAt.toISOString(), carrier, service, customer, branch, addresses: shipment.addresses.map((address) => ({ ...address, createdAt: address.createdAt.toISOString() })), packages: shipment.packages.map((pack) => ({ ...pack, weightKg: pack.weightKg.toNumber(), lengthCm: pack.lengthCm.toNumber(), widthCm: pack.widthCm.toNumber(), heightCm: pack.heightCm.toNumber(), volumeM3: pack.volumeM3.toNumber(), createdAt: pack.createdAt.toISOString() })), tracking: shipment.trackingEvents.map((event) => ({ id: event.id, eventType: event.eventType, status: event.status, description: event.description, occurredAt: event.occurredAt.toISOString(), receivedAt: event.receivedAt.toISOString(), location: event.location, externalCode: event.externalCode, source: event.createdBy?.name ?? 'Sistema' })) };
  }

  async createTrackingEvent(tenantId: string, actorId: string, shipmentId: string, input: CreateTrackingEventDto): Promise<unknown> {
    const current = await this.prisma.shipment.findFirst({ where: { id: shipmentId, tenantId } });
    if (!current) throw new NotFoundException('Shipment was not found.');
    if (input.status && !isValidTransition(current.status, input.status)) throw new BadRequestException('Transição de tracking não permitida.');
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const event = await tx.trackingEvent.create({ data: { tenantId, shipmentId, createdById: actorId, eventType: input.eventType, status: input.status, description: input.description?.trim(), occurredAt: new Date(input.occurredAt), location: input.location?.trim(), externalCode: input.externalCode?.trim(), idempotencyKey: input.idempotencyKey?.trim() } });
        const shipment = input.status ? await tx.shipment.update({ where: { id: shipmentId }, data: { status: input.status, deliveredAt: input.status === ShipmentStatus.DELIVERED ? new Date() : current.deliveredAt } }) : current;
        return { event, shipment };
      });
      await this.audit.record({ action: AuditAction.ADMIN_OPERATION, actorId, entityId: shipmentId, entityType: 'TrackingEvent', metadata: { operation: 'create', eventId: result.event.id, status: input.status ?? null }, tenantId });
      this.notifications.emitTrackingUpdate(tenantId, shipmentId, { eventId: result.event.id, status: result.shipment.status, eventType: result.event.eventType });
      return { id: result.event.id, shipmentId, status: result.shipment.status, eventType: result.event.eventType, occurredAt: result.event.occurredAt.toISOString() };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new BadRequestException('Evento duplicado para esta operação.');
      throw error;
    }
  }

  async listAudit(tenantId: string, query: ListAdminLogisticsDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.AuditLogWhereInput = { tenantId, ...(query.startDate || query.endDate ? { createdAt: { ...(query.startDate ? { gte: new Date(query.startDate) } : {}), ...(query.endDate ? { lt: new Date(`${query.endDate}T23:59:59.999Z`) } : {}) } } : {}) };
    const [logs, total] = await this.prisma.$transaction([this.prisma.auditLog.findMany({ where, include: { actor: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.perPage, take: query.perPage }), this.prisma.auditLog.count({ where })]);
    return { data: logs.map((log) => ({ id: log.id, action: log.action, entityType: log.entityType, entityId: log.entityId, actor: log.actor?.name ?? 'Sistema', actorEmail: log.actor?.email ?? null, requestId: log.requestId, createdAt: log.createdAt.toISOString(), metadata: log.metadata })), meta: { page: query.page, perPage: query.perPage, total, totalPages: Math.ceil(total / query.perPage) } };
  }

  async listCoverages(tenantId: string, query: ListAdminLogisticsDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.CarrierCoverageWhereInput = { tenantId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.carrierCoverage.findMany({ where, include: { carrierService: { include: { carrier: { select: { name: true } } } } }, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], skip: (query.page - 1) * query.perPage, take: query.perPage }),
      this.prisma.carrierCoverage.count({ where }),
    ]);
    return { data: items.map((item) => ({ id: item.id, carrierServiceId: item.carrierServiceId, carrierName: item.carrierService.carrier.name, serviceName: item.carrierService.name, status: item.status, originState: item.originState, destinationState: item.destinationState, originPostalCodeStart: item.originPostalCodeStart, originPostalCodeEnd: item.originPostalCodeEnd, destinationPostalCodeStart: item.destinationPostalCodeStart, destinationPostalCodeEnd: item.destinationPostalCodeEnd })), meta: { page: query.page, perPage: query.perPage, total, totalPages: Math.ceil(total / query.perPage) } };
  }

  async createCoverage(tenantId: string, actorId: string, input: CoverageDto): Promise<unknown> {
    const service = await this.prisma.carrierService.findFirst({ where: { id: input.carrierServiceId, tenantId } });
    if (!service) throw new NotFoundException('Carrier service was not found.');
    const item = await this.prisma.carrierCoverage.create({ data: { tenantId, carrierServiceId: input.carrierServiceId, originState: input.originState?.toUpperCase(), destinationState: input.destinationState?.toUpperCase(), originPostalCodeStart: digits(input.originPostalCodeStart), originPostalCodeEnd: digits(input.originPostalCodeEnd), destinationPostalCodeStart: digits(input.destinationPostalCodeStart), destinationPostalCodeEnd: digits(input.destinationPostalCodeEnd) } });
    await this.audit.record({ action: AuditAction.ADMIN_OPERATION, actorId, entityId: item.id, entityType: 'CarrierCoverage', metadata: { operation: 'create' }, tenantId });
    return item;
  }

  async updateCoverage(tenantId: string, actorId: string, id: string, input: CoverageDto): Promise<unknown> {
    const current = await this.prisma.carrierCoverage.findFirst({ where: { id, tenantId } });
    if (!current) throw new NotFoundException('Coverage was not found.');
    const service = await this.prisma.carrierService.findFirst({ where: { id: input.carrierServiceId, tenantId } });
    if (!service) throw new NotFoundException('Carrier service was not found.');
    const item = await this.prisma.carrierCoverage.update({ where: { id }, data: { carrierServiceId: input.carrierServiceId, originState: input.originState?.toUpperCase(), destinationState: input.destinationState?.toUpperCase(), originPostalCodeStart: digits(input.originPostalCodeStart), originPostalCodeEnd: digits(input.originPostalCodeEnd), destinationPostalCodeStart: digits(input.destinationPostalCodeStart), destinationPostalCodeEnd: digits(input.destinationPostalCodeEnd) } });
    await this.audit.record({ action: AuditAction.ADMIN_OPERATION, actorId, entityId: id, entityType: 'CarrierCoverage', metadata: { operation: 'update' }, tenantId });
    return item;
  }

  async testCoverage(tenantId: string, input: CoverageTestDto): Promise<unknown> {
    const origin = digits(input.originPostalCode);
    const destination = digits(input.destinationPostalCode);
    const items = await this.prisma.carrierCoverage.findMany({ where: { tenantId, status: 'ACTIVE', ...(input.carrierServiceId ? { carrierServiceId: input.carrierServiceId } : {}) }, include: { carrierService: { include: { carrier: { select: { name: true, active: true } } } } } });
    const matched = items.filter((item) => inRange(origin, item.originPostalCodeStart, item.originPostalCodeEnd) && inRange(destination, item.destinationPostalCodeStart, item.destinationPostalCodeEnd));
    return { covered: matched.length > 0, matches: matched.filter((item) => item.carrierService.carrier.active).map((item) => ({ carrierServiceId: item.carrierServiceId, carrierName: item.carrierService.carrier.name, serviceName: item.carrierService.name, ruleId: item.id })) };
  }
}

function digits(value: string | undefined): string { return value?.replace(/\D/g, '') ?? ''; }
function inRange(value: string, start: string | null, end: string | null): boolean { const numeric = Number(value); return (!start || numeric >= Number(start)) && (!end || numeric <= Number(end)); }

function validateRanges(ranges: Array<{ minWeightKg: number; maxWeightKg: number; basePrice: number; pricePerKg: number; deadlineDays: number }>): void {
  const ordered = [...ranges].sort((a, b) => a.minWeightKg - b.minWeightKg);
  for (const range of ordered) {
    if (range.maxWeightKg <= range.minWeightKg || range.basePrice < 0 || range.pricePerKg < 0 || range.deadlineDays < 1) throw new BadRequestException('Faixa de peso inválida.');
  }
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (previous && current && previous.maxWeightKg >= current.minWeightKg) throw new BadRequestException('Faixas de peso sobrepostas.');
  }
}

function presentRateTable(table: any, usedInSimulations: number): unknown {
  return { id: table.id, tenantId: table.tenantId, carrierServiceId: table.carrierServiceId, carrierName: table.carrierService.carrier.name, serviceName: table.carrierService.name, name: table.name, version: table.version, currency: table.currency, validFrom: table.validFrom.toISOString(), validTo: table.validTo?.toISOString() ?? null, notes: table.notes, status: table.status, usedInSimulations, previousVersion: table.previousVersion, versions: table.nextVersions, coverages: table.coverages?.map((item: any) => item.coverage), ranges: table.ranges.map((range: any) => ({ id: range.id, minWeightKg: range.minWeightKg.toNumber(), maxWeightKg: range.maxWeightKg.toNumber(), basePrice: range.basePrice.toNumber(), pricePerKg: range.pricePerKg.toNumber(), excessPricePerKg: range.excessPricePerKg?.toNumber() ?? null, deadlineDays: range.deadlineDays, priority: range.priority })), charges: table.charges.map((charge: any) => ({ id: charge.id, type: charge.type, name: charge.name, fixedAmount: charge.fixedAmount?.toNumber() ?? null, percentage: charge.percentage?.toNumber() ?? null, active: charge.active })) };
}

const transitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  CREATED: [ShipmentStatus.PICKUP_SCHEDULED, ShipmentStatus.CANCELED],
  PICKUP_SCHEDULED: [ShipmentStatus.PICKED_UP, ShipmentStatus.CANCELED],
  PICKED_UP: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELED],
  IN_TRANSIT: [ShipmentStatus.ARRIVED_AT_HUB, ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.RETURNING, ShipmentStatus.CANCELED],
  ARRIVED_AT_HUB: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.IN_TRANSIT, ShipmentStatus.RETURNING],
  OUT_FOR_DELIVERY: [ShipmentStatus.DELIVERED, ShipmentStatus.DELIVERY_FAILED, ShipmentStatus.RETURNING],
  DELIVERY_FAILED: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.RETURNING],
  RETURNING: [ShipmentStatus.RETURNED],
  DELIVERED: [],
  RETURNED: [],
  CANCELED: [],
};

function isValidTransition(current: ShipmentStatus, next: ShipmentStatus): boolean {
  return current === next || transitions[current].includes(next);
}
