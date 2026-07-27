import type { CarrierDto, CarrierTransportServiceDto, PaginatedResult } from '@logistics/shared';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, CarrierServiceStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

import type { CreateCarrierDto, CreateCarrierServiceDto, ListCarriersDto } from './dto/carrier.dto';

@Injectable()
export class CarriersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(tenantId: string, query: ListCarriersDto): Promise<PaginatedResult<CarrierDto>> {
    const page = query.page;
    const perPage = query.perPage;
    const where: Prisma.CarrierWhereInput = {
      tenantId,
      ...(query.active === undefined ? {} : { active: query.active }),
      ...(query.hasActiveService ? { services: { some: { status: CarrierServiceStatus.ACTIVE } } } : {}),
      ...(query.search?.trim()
        ? { OR: [{ name: { contains: query.search.trim() } }, { code: { contains: query.search.trim() } }] }
        : {}),
    };
    const [carriers, total] = await this.prisma.$transaction([
      this.prisma.carrier.findMany({
        where,
        include: { services: { where: { status: CarrierServiceStatus.ACTIVE }, orderBy: { name: 'asc' } } },
        orderBy: [{ active: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.carrier.count({ where }),
    ]);

    return {
      data: carriers.map((carrier) => ({
        active: carrier.active,
        code: carrier.code,
        document: carrier.document,
        id: carrier.id,
        name: carrier.name,
        services: carrier.services.map(presentService),
      })),
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  async get(tenantId: string, id: string): Promise<CarrierDto> {
    const carrier = await this.prisma.carrier.findFirst({ where: { id, tenantId }, include: { services: { orderBy: { name: 'asc' } } } });
    if (!carrier) throw new NotFoundException('Carrier was not found.');
    return presentCarrier(carrier);
  }

  async create(tenantId: string, input: CreateCarrierDto): Promise<CarrierDto> {
    try {
      const carrier = await this.prisma.carrier.create({
        data: {
          active: true,
          code: normalizeOptional(input.code),
          document: normalizeDocument(input.document),
          stateRegistration: normalizeOptional(input.stateRegistration),
          contactName: normalizeOptional(input.contactName),
          email: normalizeOptional(input.email),
          legalName: normalizeOptional(input.legalName),
          name: input.name.trim(),
          notes: normalizeOptional(input.notes),
          phone: normalizeOptional(input.phone),
          site: normalizeOptional(input.site),
          tenantId,
        },
      });

      return {
        active: carrier.active,
        code: carrier.code,
        document: carrier.document,
        id: carrier.id,
        name: carrier.name,
        services: [],
        contactName: carrier.contactName,
        email: carrier.email,
        legalName: carrier.legalName,
        notes: carrier.notes,
        phone: carrier.phone,
        site: carrier.site,
        stateRegistration: carrier.stateRegistration,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Carrier code or document already exists in this tenant.');
      }
      throw error;
    }
  }

  async update(tenantId: string, actorId: string, id: string, input: CreateCarrierDto): Promise<CarrierDto> {
    const current = await this.prisma.carrier.findFirst({ where: { id, tenantId } });
    if (!current) throw new NotFoundException('Carrier was not found.');
    const carrier = await this.prisma.carrier.update({ where: { id }, data: { code: normalizeOptional(input.code), document: normalizeDocument(input.document), stateRegistration: normalizeOptional(input.stateRegistration), contactName: normalizeOptional(input.contactName), email: normalizeOptional(input.email), legalName: normalizeOptional(input.legalName), name: input.name.trim(), notes: normalizeOptional(input.notes), phone: normalizeOptional(input.phone), site: normalizeOptional(input.site) }, include: { services: { orderBy: { name: 'asc' } } } });
    await this.audit.record({ action: AuditAction.CARRIER_CHANGED, actorId, entityId: id, entityType: 'Carrier', metadata: { operation: 'update' }, tenantId });
    return presentCarrier(carrier);
  }

  async updateStatus(tenantId: string, actorId: string, id: string, active: boolean): Promise<CarrierDto> {
    const current = await this.prisma.carrier.findFirst({ where: { id, tenantId } });
    if (!current) throw new NotFoundException('Carrier was not found.');
    const carrier = await this.prisma.carrier.update({ where: { id }, data: { active }, include: { services: { orderBy: { name: 'asc' } } } });
    await this.audit.record({ action: AuditAction.CARRIER_CHANGED, actorId, entityId: id, entityType: 'Carrier', metadata: { operation: active ? 'activate' : 'deactivate' }, tenantId });
    return presentCarrier(carrier);
  }

  async createService(tenantId: string, carrierId: string, input: CreateCarrierServiceDto): Promise<CarrierTransportServiceDto> {
    const carrier = await this.prisma.carrier.findFirst({ where: { id: carrierId, tenantId } });
    if (!carrier) {
      throw new NotFoundException('Carrier was not found.');
    }
    if (input.maxWeightKg !== undefined && input.minWeightKg !== undefined && input.maxWeightKg <= input.minWeightKg) throw new ConflictException('Maximum weight must be greater than minimum weight.');
    const service = await this.prisma.carrierService.create({
      data: {
        carrierId,
        code: input.code.trim(),
        cubicFactor: input.cubicFactor,
        defaultDeadlineDays: input.defaultDeadlineDays,
        maxWeightKg: input.maxWeightKg,
        maxLengthCm: input.maxLengthCm,
        maxWidthCm: input.maxWidthCm,
        maxHeightCm: input.maxHeightCm,
        minWeightKg: input.minWeightKg,
        minimumValue: input.minimumValue,
        modality: input.modality.trim(),
        name: input.name.trim(),
        description: normalizeOptional(input.description),
        status: CarrierServiceStatus.ACTIVE,
        tenantId,
      },
    });
    return presentService(service);
  }

  async updateService(tenantId: string, actorId: string, carrierId: string, serviceId: string, input: CreateCarrierServiceDto & { status?: CarrierServiceStatus }): Promise<CarrierTransportServiceDto> {
    const service = await this.prisma.carrierService.findFirst({ where: { id: serviceId, carrierId, tenantId } });
    if (!service) throw new NotFoundException('Carrier service was not found.');
    if (input.maxWeightKg !== undefined && input.minWeightKg !== undefined && input.maxWeightKg <= input.minWeightKg) throw new ConflictException('Maximum weight must be greater than minimum weight.');
    const updated = await this.prisma.carrierService.update({ where: { id: serviceId }, data: { code: input.code.trim(), cubicFactor: input.cubicFactor, defaultDeadlineDays: input.defaultDeadlineDays, maxWeightKg: input.maxWeightKg, maxLengthCm: input.maxLengthCm, maxWidthCm: input.maxWidthCm, maxHeightCm: input.maxHeightCm, minWeightKg: input.minWeightKg, minimumValue: input.minimumValue, modality: input.modality.trim(), name: input.name.trim(), description: normalizeOptional(input.description), status: input.status ?? service.status } });
    await this.audit.record({ action: AuditAction.CARRIER_CHANGED, actorId, entityId: serviceId, entityType: 'CarrierService', metadata: { operation: 'update', carrierId }, tenantId });
    return presentService(updated);
  }
}

function presentCarrier(carrier: { active: boolean; code: string | null; contactName: string | null; document: string | null; email: string | null; id: string; legalName: string | null; name: string; notes: string | null; phone: string | null; site: string | null; stateRegistration?: string | null; services: Array<Parameters<typeof presentService>[0]> }): CarrierDto {
  return { active: carrier.active, code: carrier.code, contactName: carrier.contactName, document: carrier.document, email: carrier.email, id: carrier.id, legalName: carrier.legalName, name: carrier.name, notes: carrier.notes, phone: carrier.phone, site: carrier.site, stateRegistration: carrier.stateRegistration, services: carrier.services.map(presentService) };
}

function presentService(service: {
  carrierId: string;
  code: string;
  cubicFactor: Prisma.Decimal;
  defaultDeadlineDays: number;
  id: string;
  maxWeightKg: Prisma.Decimal | null;
  minWeightKg: Prisma.Decimal | null;
  minimumValue: Prisma.Decimal;
  modality: string;
  name: string;
  description: string | null;
  maxLengthCm?: Prisma.Decimal | null;
  maxWidthCm?: Prisma.Decimal | null;
  maxHeightCm?: Prisma.Decimal | null;
  status: CarrierServiceStatus;
}): CarrierTransportServiceDto {
  return {
    carrierId: service.carrierId,
    code: service.code,
    cubicFactor: service.cubicFactor.toNumber(),
    defaultDeadlineDays: service.defaultDeadlineDays,
    id: service.id,
    maxWeightKg: service.maxWeightKg?.toNumber() ?? null,
    minWeightKg: service.minWeightKg?.toNumber() ?? null,
    minimumValue: service.minimumValue.toNumber(),
    modality: service.modality,
    name: service.name,
    status: service.status,
    description: service.description,
    maxLengthCm: service.maxLengthCm?.toNumber() ?? null,
    maxWidthCm: service.maxWidthCm?.toNumber() ?? null,
    maxHeightCm: service.maxHeightCm?.toNumber() ?? null,
  };
}

function normalizeDocument(value: string | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits.length > 0 ? digits : null;
}

function normalizeOptional(value: string | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}
