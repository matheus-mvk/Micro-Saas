import type {
  AddressDto,
  FreightSimulationDto,
  FreightSimulationListItemDto,
  FreightSimulationOptionDto,
  PaginatedResult,
  ShipmentDto,
} from '@logistics/shared';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AddressType,
  AuditAction,
  CarrierServiceStatus,
  CoverageStatus,
  FreightRateTableStatus,
  FreightSimulationStatus,
  Prisma,
  ShipmentStatus,
} from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { NotificationsGateway } from '../../infrastructure/realtime/notifications.gateway';
import { AuditService } from '../audit/audit.service';

import type { CreateFreightSimulationDto, ListFreightSimulationsDto } from './dto/freight-simulation.dto';
import {
  calculatePackageMetrics,
  FreightPricingEngine,
  type FreightCalculationResult,
  money,
  scale,
  type PackageInput,
} from './pricing/freight-pricing.engine';

interface UnavailableService {
  carrier: string;
  reason: string;
  service: string;
}

type EligibleCarrierService = Prisma.CarrierServiceGetPayload<{
  include: {
    carrier: true;
    coverages: true;
    freightRateTables: {
      include: {
        charges: true;
        ranges: true;
      };
    };
  };
}>;

type EligibleRateTable = EligibleCarrierService['freightRateTables'][number];
type EligibleRateRange = EligibleRateTable['ranges'][number];

interface CandidateOption {
  calculated: FreightCalculationResult;
  rateRange: EligibleRateRange;
  rateTable: EligibleRateTable;
  service: EligibleCarrierService;
}

@Injectable()
export class FreightSimulationsService {
  constructor(
    private readonly audit: AuditService,
    private readonly notifications: NotificationsGateway,
    private readonly pricing: FreightPricingEngine,
    private readonly prisma: PrismaService,
  ) {}

  async lookupAddress(postalCode: string): Promise<AddressDto> {
    const normalized = normalizePostalCode(postalCode);
    const fallback = fallbackAddress(normalized);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 10000);
      const response = await fetch(`https://viacep.com.br/ws/${normalized}/json/`, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) return fallback;
      const payload = (await response.json()) as Partial<Record<string, string | boolean>>;
      if (payload.erro === true) return fallback;

      return {
        city: String(payload.localidade ?? fallback.city),
        complement: optionalText(payload.complemento),
        country: 'BR',
        district: optionalText(payload.bairro),
        number: null,
        postalCode: normalized,
        state: String(payload.uf ?? fallback.state).slice(0, 2).toUpperCase(),
        street: String(payload.logradouro ?? fallback.street),
      };
    } catch {
      return fallback;
    }
  }

  async list(tenantId: string, query: ListFreightSimulationsDto): Promise<PaginatedResult<FreightSimulationListItemDto>> {
    const page = query.page;
    const perPage = query.perPage;
    const where: Prisma.FreightSimulationWhereInput = {
      tenantId,
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.originPostalCode ? { originPostalCode: normalizePostalCode(query.originPostalCode) } : {}),
      ...(query.destinationPostalCode ? { destinationPostalCode: normalizePostalCode(query.destinationPostalCode) } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(`${query.startDate}T00:00:00.000Z`) } : {}),
              ...(query.endDate ? { lte: new Date(`${query.endDate}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    };
    const [simulations, total] = await this.prisma.$transaction([
      this.prisma.freightSimulation.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          options: { orderBy: [{ totalPrice: 'asc' }, { deadlineDays: 'asc' }] },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.freightSimulation.count({ where }),
    ]);

    return {
      data: simulations.map((simulation) => ({
        cargoValue: simulation.cargoValue?.toNumber() ?? null,
        createdAt: simulation.createdAt.toISOString(),
        customerName: simulation.customer?.name ?? null,
        destinationPostalCode: simulation.destinationPostalCode,
        id: simulation.id,
        lowestPrice: simulation.options[0]?.totalPrice.toNumber() ?? null,
        optionCount: simulation.options.length,
        originPostalCode: simulation.originPostalCode,
        selectedOption: simulation.options.find((option) => option.selected)?.id ?? null,
        status: simulation.status as FreightSimulationListItemDto['status'],
      })),
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  async get(tenantId: string, simulationId: string): Promise<FreightSimulationDto> {
    const simulation = await this.loadSimulation(tenantId, simulationId);
    return presentSimulation(simulation);
  }

  async create(tenantId: string, actorId: string, input: CreateFreightSimulationDto): Promise<FreightSimulationDto> {
    const desiredShipDate = input.desiredShipDate ? new Date(input.desiredShipDate) : new Date();
    if (Number.isNaN(desiredShipDate.getTime())) {
      throw new BadRequestException('Desired ship date is invalid.');
    }

    const customer = input.customerId
      ? await this.prisma.customer.findFirst({ where: { active: true, id: input.customerId, tenantId } })
      : null;
    if (input.customerId && !customer) {
      throw new NotFoundException('Customer was not found.');
    }

    const origin = toAddressDto(input.origin);
    const destination = toAddressDto(input.destination);
    const packages = input.packages.map(toPackageInput);
    const distanceKm = this.calculateDistanceKm(origin, destination);
    const unavailable: UnavailableService[] = [];
    const services = await this.prisma.carrierService.findMany({
      where: {
        status: CarrierServiceStatus.ACTIVE,
        tenantId,
        ...(input.carrierServiceId ? { id: input.carrierServiceId } : {}),
        carrier: { active: true, ...(input.carrierId ? { id: input.carrierId } : {}) },
      },
      include: {
        carrier: true,
        coverages: { where: { status: CoverageStatus.ACTIVE } },
        freightRateTables: {
          where: {
            status: FreightRateTableStatus.ACTIVE,
            validFrom: { lte: desiredShipDate },
            OR: [{ validTo: null }, { validTo: { gte: desiredShipDate } }],
          },
          include: {
            charges: { where: { active: true } },
            ranges: { orderBy: [{ priority: 'asc' }, { minWeightKg: 'asc' }] },
          },
          orderBy: [{ version: 'desc' }],
        },
      },
      orderBy: [{ carrier: { name: 'asc' } }, { name: 'asc' }],
    });

    const candidateOptions: CandidateOption[] = [];

    for (const service of services) {
      if (!matchesCoverage(service.coverages, origin, destination)) {
        unavailable.push({ carrier: service.carrier.name, reason: 'Fora da cobertura cadastrada', service: service.name });
        continue;
      }

      const metrics = calculatePackageMetrics(packages, service.cubicFactor);
      const chargeableWeightKg = decimalMax(metrics.realWeightKg, metrics.cubicWeightKg);
      if (service.minWeightKg && chargeableWeightKg.lt(service.minWeightKg)) {
        unavailable.push({ carrier: service.carrier.name, reason: 'Peso abaixo do minimo do servico', service: service.name });
        continue;
      }
      if (service.maxWeightKg && chargeableWeightKg.gt(service.maxWeightKg)) {
        unavailable.push({ carrier: service.carrier.name, reason: 'Peso acima do maximo do servico', service: service.name });
        continue;
      }

      const rateTable = service.freightRateTables[0];
      if (!rateTable) {
        unavailable.push({ carrier: service.carrier.name, reason: 'Sem tabela vigente', service: service.name });
        continue;
      }

      const rateRange = rateTable.ranges.find((range) => chargeableWeightKg.gte(range.minWeightKg) && chargeableWeightKg.lte(range.maxWeightKg));
      if (!rateRange) {
        unavailable.push({ carrier: service.carrier.name, reason: 'Sem faixa de peso compativel', service: service.name });
        continue;
      }

      const calculated = this.pricing.calculate({
        cargoValue: input.cargoValue,
        charges: rateTable.charges,
        cubicFactor: service.cubicFactor,
        desiredShipDate,
        distanceKm,
        minimumValue: service.minimumValue,
        packages,
        rate: rateRange,
      });

      candidateOptions.push({ calculated, rateRange, rateTable, service });
    }

    if (candidateOptions.length === 0) {
      throw new BadRequestException('No eligible carrier service was found for this simulation.');
    }

    const firstCandidate = candidateOptions.at(0);
    if (!firstCandidate) {
      throw new BadRequestException('No eligible carrier service was found for this simulation.');
    }

    const cheapestPrice = candidateOptions.reduce(
      (current, item) => Prisma.Decimal.min(current, item.calculated.totalPrice),
      firstCandidate.calculated.totalPrice,
    );
    const fastestDeadline = Math.min(...candidateOptions.map((item) => item.calculated.deadlineDays));
    const cheapest = candidateOptions.find((item) => item.calculated.totalPrice.equals(cheapestPrice));
    if (!cheapest) {
      throw new BadRequestException('No eligible carrier service was found for this simulation.');
    }

    const metadata: Prisma.InputJsonObject = {
      unavailable: unavailable.map((item) => ({
        carrier: item.carrier,
        reason: item.reason,
        service: item.service,
      })),
    };

    const simulation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.freightSimulation.create({
        data: {
          branchId: await this.resolveBranchId(tx, tenantId),
          cargoValue: money(input.cargoValue),
          chargeableWeightKg: cheapest.calculated.chargeableWeightKg,
          createdById: actorId,
          cubicWeightKg: cheapest.calculated.cubicWeightKg,
          desiredShipDate,
          destinationPostalCode: normalizePostalCode(input.destination.postalCode),
          distanceKm,
          estimatedDeadlineDays: cheapest.calculated.deadlineDays,
          estimatedPrice: cheapest.calculated.totalPrice,
          metadata,
          originPostalCode: normalizePostalCode(input.origin.postalCode),
          realWeightKg: cheapest.calculated.realWeightKg,
          status: FreightSimulationStatus.CALCULATED,
          tenantId,
          totalVolumeM3: cheapest.calculated.totalVolumeM3,
          ...(customer ? { customerId: customer.id } : {}),
          ...(cheapest.service.carrierId ? { carrierId: cheapest.service.carrierId } : {}),
        },
      });

      await tx.freightSimulationAddress.createMany({
        data: [
          toSimulationAddress(tenantId, created.id, AddressType.PICKUP, origin),
          toSimulationAddress(tenantId, created.id, AddressType.DELIVERY, destination),
        ],
      });

      await tx.freightSimulationPackage.createMany({
        data: input.packages.map((item) => {
          const metrics = calculatePackageMetrics([toPackageInput(item)], 1);
          return {
            description: optionalText(item.description),
            heightCm: item.heightCm,
            lengthCm: item.lengthCm,
            quantity: item.quantity,
            simulationId: created.id,
            tenantId,
            volumeM3: metrics.totalVolumeM3,
            weightKg: item.weightKg,
            widthCm: item.widthCm,
          };
        }),
      });

      for (const item of candidateOptions) {
        await tx.freightSimulationOption.create({
          data: {
            carrierId: item.service.carrierId,
            carrierName: item.service.carrier.name,
            carrierServiceId: item.service.id,
            chargeableWeightKg: item.calculated.chargeableWeightKg,
            cheapest: item.calculated.totalPrice.equals(cheapestPrice),
            priceComponents: {
              create: item.calculated.components.map((part) => ({
                amount: part.amount,
                label: part.label,
                sortOrder: part.sortOrder,
                tenantId,
                type: part.type,
              })),
            },
            cubicWeightKg: item.calculated.cubicWeightKg,
            currency: item.rateTable.currency,
            deadlineDays: item.calculated.deadlineDays,
            distanceKm,
            estimatedDeliveryAt: item.calculated.estimatedDeliveryAt,
            fastest: item.calculated.deadlineDays === fastestDeadline,
            rateRangeId: item.rateRange.id,
            rateTableId: item.rateTable.id,
            rateTableVersion: item.rateTable.version,
            realWeightKg: item.calculated.realWeightKg,
            selected: false,
            serviceCode: item.service.code,
            serviceName: item.service.name,
            simulationId: created.id,
            tenantId,
            totalPrice: item.calculated.totalPrice,
          },
        });
      }

      return created;
    });

    await this.audit.record({
      action: AuditAction.FREIGHT_SIMULATION_CREATED,
      actorId,
      entityId: simulation.id,
      entityType: 'FreightSimulation',
      metadata: { optionCount: candidateOptions.length, unavailableCount: unavailable.length },
      tenantId,
    });
    this.notifications.emitDashboardRefresh(tenantId, 'freight-simulation');

    return this.get(tenantId, simulation.id);
  }

  async selectOption(tenantId: string, actorId: string, simulationId: string, optionId: string): Promise<FreightSimulationDto> {
    const option = await this.prisma.freightSimulationOption.findFirst({ where: { id: optionId, simulationId, tenantId } });
    if (!option) {
      throw new NotFoundException('Simulation option was not found.');
    }

    await this.prisma.$transaction([
      this.prisma.freightSimulationOption.updateMany({ where: { simulationId, tenantId }, data: { selected: false, selectedAt: null } }),
      this.prisma.freightSimulationOption.update({ where: { id: option.id }, data: { selected: true, selectedAt: new Date() } }),
    ]);

    await this.audit.record({
      action: AuditAction.FREIGHT_OPTION_SELECTED,
      actorId,
      entityId: option.id,
      entityType: 'FreightSimulationOption',
      metadata: { simulationId },
      tenantId,
    });
    this.notifications.emitDashboardRefresh(tenantId, 'freight-option-selected');

    return this.get(tenantId, simulationId);
  }

  async createShipment(tenantId: string, actorId: string, simulationId: string): Promise<ShipmentDto> {
    const simulation = await this.loadSimulation(tenantId, simulationId);
    const selected = simulation.options.find((option) => option.selected);
    if (!selected) {
      throw new BadRequestException('Select a simulation option before creating a shipment.');
    }

    const existing = await this.prisma.shipment.findUnique({ where: { simulationId } });
    if (existing) {
      return this.presentShipment(existing.id, tenantId);
    }

    try {
      const shipment = await this.prisma.$transaction(async (tx) => {
        const created = await tx.shipment.create({
          data: {
            branchId: simulation.branchId,
            cargoValue: simulation.cargoValue,
            carrierId: selected.carrierId,
            carrierServiceId: selected.carrierServiceId,
            chargeableWeightKg: selected.chargeableWeightKg,
            createdById: actorId,
            customerId: simulation.customerId,
            estimatedDeliveryAt: selected.estimatedDeliveryAt,
            freightValue: selected.totalPrice,
            realWeightKg: selected.realWeightKg,
            selectedOptionId: selected.id,
            simulationId: simulation.id,
            status: ShipmentStatus.CREATED,
            tenantId,
            trackingCode: `NF-${String(simulation.createdAt.getUTCFullYear())}-${simulation.id.slice(0, 8).toUpperCase()}`,
          },
        });

        await tx.shipmentAddress.createMany({
          data: simulation.addresses.map((address) => ({
            city: address.city,
            complement: address.complement,
            country: address.country,
            district: address.district,
            number: address.number,
            postalCode: address.postalCode,
            shipmentId: created.id,
            state: address.state,
            street: address.street,
            tenantId,
            type: address.type,
          })),
        });

        await tx.shipmentPackage.createMany({
          data: simulation.packages.map((item) => ({
            description: item.description,
            heightCm: item.heightCm,
            lengthCm: item.lengthCm,
            quantity: item.quantity,
            shipmentId: created.id,
            simulationPackageId: item.id,
            tenantId,
            volumeM3: item.volumeM3,
            weightKg: item.weightKg,
            widthCm: item.widthCm,
          })),
        });

        return created;
      });

      await this.audit.record({
        action: AuditAction.SHIPMENT_CREATED,
        actorId,
        entityId: shipment.id,
        entityType: 'Shipment',
        metadata: { simulationId, selectedOptionId: selected.id },
        tenantId,
      });
      this.notifications.emitDashboardRefresh(tenantId, 'shipment-created');

      return await this.presentShipment(shipment.id, tenantId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Shipment already exists for this simulation.');
      }
      throw error;
    }
  }

  private async presentShipment(shipmentId: string, tenantId: string): Promise<ShipmentDto> {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, tenantId },
    });
    if (!shipment) throw new NotFoundException('Shipment was not found.');

    const [carrier, carrierService] = await this.prisma.$transaction([
      this.prisma.carrier.findFirst({ where: { id: shipment.carrierId, tenantId }, select: { name: true } }),
      this.prisma.carrierService.findFirst({ where: { id: shipment.carrierServiceId, tenantId }, select: { name: true } }),
    ]);

    return {
      carrierName: carrier?.name ?? 'Transportadora historica',
      carrierServiceName: carrierService?.name ?? 'Servico historico',
      createdAt: shipment.createdAt.toISOString(),
      estimatedDeliveryAt: shipment.estimatedDeliveryAt.toISOString(),
      freightValue: shipment.freightValue.toNumber(),
      id: shipment.id,
      simulationId: shipment.simulationId,
      status: shipment.status as ShipmentDto['status'],
      trackingCode: shipment.trackingCode,
    };
  }

  private async loadSimulation(tenantId: string, simulationId: string) {
    const simulation = await this.prisma.freightSimulation.findFirst({
      where: { id: simulationId, tenantId },
      include: {
        addresses: true,
        customer: { select: { id: true, name: true } },
        options: {
          include: { priceComponents: { orderBy: { sortOrder: 'asc' } } },
          orderBy: [{ totalPrice: 'asc' }, { deadlineDays: 'asc' }],
        },
        packages: true,
      },
    });
    if (!simulation) {
      throw new NotFoundException('Freight simulation was not found.');
    }
    return simulation;
  }

  private async resolveBranchId(tx: Prisma.TransactionClient, tenantId: string): Promise<string | undefined> {
    const branch = await tx.branch.findFirst({ where: { active: true, tenantId }, orderBy: [{ main: 'desc' }, { name: 'asc' }] });
    return branch?.id;
  }

  private calculateDistanceKm(origin: AddressDto, destination: AddressDto): Prisma.Decimal {
    if (origin.latitude && origin.longitude && destination.latitude && destination.longitude) {
      return scale(haversineKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude), 2);
    }

    const originPrefix = Number(normalizePostalCode(origin.postalCode).slice(0, 3));
    const destinationPrefix = Number(normalizePostalCode(destination.postalCode).slice(0, 3));
    const distance = Math.max(25, Math.abs(destinationPrefix - originPrefix) * 7.5);
    return scale(distance, 2);
  }
}

function presentSimulation(simulation: Awaited<ReturnType<FreightSimulationsService['loadSimulation']>>): FreightSimulationDto {
  return {
    cargoValue: simulation.cargoValue?.toNumber() ?? null,
    chargeableWeightKg: simulation.chargeableWeightKg?.toNumber() ?? null,
    createdAt: simulation.createdAt.toISOString(),
    customer: simulation.customer,
    destinationPostalCode: simulation.destinationPostalCode,
    distanceKm: simulation.distanceKm?.toNumber() ?? null,
    estimatedDeadlineDays: simulation.estimatedDeadlineDays,
    estimatedPrice: simulation.estimatedPrice?.toNumber() ?? null,
    id: simulation.id,
    options: simulation.options.map(presentOption),
    originPostalCode: simulation.originPostalCode,
    realWeightKg: simulation.realWeightKg.toNumber(),
    status: simulation.status as FreightSimulationDto['status'],
    totalVolumeM3: simulation.totalVolumeM3?.toNumber() ?? null,
  };
}

function presentOption(option: Awaited<ReturnType<FreightSimulationsService['loadSimulation']>>['options'][number]): FreightSimulationOptionDto {
  return {
    carrierId: option.carrierId,
    carrierName: option.carrierName,
    carrierServiceId: option.carrierServiceId,
    chargeableWeightKg: option.chargeableWeightKg.toNumber(),
    cheapest: option.cheapest,
    components: option.priceComponents.map((part) => ({
      amount: part.amount.toNumber(),
      label: part.label,
      sortOrder: part.sortOrder,
      type: part.type,
    })),
    cubicWeightKg: option.cubicWeightKg.toNumber(),
    currency: option.currency,
    deadlineDays: option.deadlineDays,
    distanceKm: option.distanceKm?.toNumber() ?? null,
    estimatedDeliveryAt: option.estimatedDeliveryAt.toISOString(),
    fastest: option.fastest,
    id: option.id,
    realWeightKg: option.realWeightKg.toNumber(),
    selected: option.selected,
    serviceCode: option.serviceCode,
    serviceName: option.serviceName,
    totalPrice: option.totalPrice.toNumber(),
  };
}

function toAddressDto(input: {
  city: string;
  complement?: string | null;
  country?: string;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  number?: string | null;
  postalCode: string;
  state: string;
  street: string;
}): AddressDto {
  return {
    city: input.city,
    complement: input.complement ?? null,
    country: input.country ?? 'BR',
    district: input.district ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    number: input.number ?? null,
    postalCode: input.postalCode,
    state: input.state,
    street: input.street,
  };
}

function toSimulationAddress(tenantId: string, simulationId: string, type: AddressType, input: AddressDto) {
  return {
    city: input.city.trim(),
    complement: optionalText(input.complement),
    country: input.country.trim().toUpperCase(),
    district: optionalText(input.district),
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    number: optionalText(input.number),
    postalCode: normalizePostalCode(input.postalCode),
    simulationId,
    state: input.state.trim().toUpperCase(),
    street: input.street.trim(),
    tenantId,
    type,
  };
}

function optionalText(value: boolean | string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toPackageInput(input: PackageInput | { heightCm: number; lengthCm: number; quantity: number; weightKg: number; widthCm: number }): PackageInput {
  return {
    heightCm: input.heightCm,
    lengthCm: input.lengthCm,
    quantity: input.quantity,
    weightKg: input.weightKg,
    widthCm: input.widthCm,
  };
}

function matchesCoverage(coverages: { destinationPostalCodeEnd: string | null; destinationPostalCodeStart: string | null; destinationState: string | null; originPostalCodeEnd: string | null; originPostalCodeStart: string | null; originState: string | null }[], origin: AddressDto, destination: AddressDto): boolean {
  return coverages.some((coverage) => {
    const originStateMatches = !coverage.originState || coverage.originState === origin.state.toUpperCase();
    const destinationStateMatches = !coverage.destinationState || coverage.destinationState === destination.state.toUpperCase();
    const originPostalMatches = inPostalRange(normalizePostalCode(origin.postalCode), coverage.originPostalCodeStart, coverage.originPostalCodeEnd);
    const destinationPostalMatches = inPostalRange(normalizePostalCode(destination.postalCode), coverage.destinationPostalCodeStart, coverage.destinationPostalCodeEnd);
    return originStateMatches && destinationStateMatches && originPostalMatches && destinationPostalMatches;
  });
}

function inPostalRange(postalCode: string, start: string | null, end: string | null): boolean {
  const normalizedStart = start ? normalizePostalCode(start) : undefined;
  const normalizedEnd = end ? normalizePostalCode(end) : undefined;
  return (!normalizedStart || postalCode >= normalizedStart) && (!normalizedEnd || postalCode <= normalizedEnd);
}

function normalizePostalCode(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) throw new BadRequestException('Postal code must have 8 digits.');
  return digits;
}

function fallbackAddress(postalCode: string): AddressDto {
  if (postalCode.startsWith('2')) {
    return { city: 'Rio de Janeiro', complement: null, country: 'BR', district: 'Centro', number: null, postalCode, state: 'RJ', street: 'Endereco informado manualmente' };
  }
  if (postalCode.startsWith('3')) {
    return { city: 'Belo Horizonte', complement: null, country: 'BR', district: 'Centro', number: null, postalCode, state: 'MG', street: 'Endereco informado manualmente' };
  }
  return { city: 'Sao Paulo', complement: null, country: 'BR', district: 'Centro', number: null, postalCode, state: 'SP', street: 'Endereco informado manualmente' };
}

function haversineKm(originLat: number, originLng: number, destinationLat: number, destinationLng: number): number {
  const radius = 6371;
  const dLat = degreesToRadians(destinationLat - originLat);
  const dLng = degreesToRadians(destinationLng - originLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degreesToRadians(originLat)) * Math.cos(degreesToRadians(destinationLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function decimalMax(left: Prisma.Decimal, right: Prisma.Decimal): Prisma.Decimal {
  return left.gte(right) ? left : right;
}
