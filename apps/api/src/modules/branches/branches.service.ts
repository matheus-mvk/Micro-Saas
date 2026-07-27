import type { BranchDto, PaginatedResult } from '@logistics/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

import type { CreateBranchDto, ListBranchesDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(tenantId: string, query: ListBranchesDto): Promise<PaginatedResult<BranchDto>> {
    const page = query.page;
    const perPage = query.perPage;
    const where: Prisma.BranchWhereInput = {
      tenantId,
      ...(query.active === undefined ? {} : { active: query.active }),
      ...(query.state ? { state: query.state.toUpperCase() } : {}),
      ...(query.search?.trim() ? { OR: [{ name: { contains: query.search.trim() } }, { code: { contains: query.search.trim() } }] } : {}),
    };

    const [branches, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({
        where,
        orderBy: [{ main: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      data: branches.map(presentBranch),
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  async get(tenantId: string, id: string): Promise<BranchDto> {
    const branch = await this.prisma.branch.findFirst({ where: { id, tenantId } });
    if (!branch) throw new NotFoundException('Branch was not found.');
    return presentBranch(branch);
  }

  async create(tenantId: string, input: CreateBranchDto): Promise<BranchDto> {
    if (input.main) {
      await this.prisma.branch.updateMany({ where: { tenantId, main: true }, data: { main: false } });
    }

    const branch = await this.prisma.branch.create({
      data: {
        active: input.active ?? true,
        city: normalizeOptional(input.city),
        code: input.code.trim(),
        district: normalizeOptional(input.district),
        email: normalizeOptional(input.email),
        main: input.main ?? false,
        name: input.name.trim(),
        number: normalizeOptional(input.number),
        complement: normalizeOptional(input.complement),
        postalCode: normalizePostalCode(input.postalCode),
        state: normalizeState(input.state),
        street: normalizeOptional(input.street),
        phone: normalizeOptional(input.phone),
        country: normalizeState(input.country) ?? 'BR',
        tenantId,
      },
    });

    return {
      ...presentBranch(branch),
    };
  }

  async update(tenantId: string, actorId: string, id: string, input: CreateBranchDto): Promise<BranchDto> {
    const current = await this.prisma.branch.findFirst({ where: { id, tenantId } });
    if (!current) throw new NotFoundException('Branch was not found.');
    if (input.main) await this.prisma.branch.updateMany({ where: { tenantId, main: true, id: { not: id } }, data: { main: false } });
    const branch = await this.prisma.branch.update({ where: { id }, data: { name: input.name.trim(), code: input.code.trim(), main: input.main ?? false, active: input.active ?? current.active, city: normalizeOptional(input.city), district: normalizeOptional(input.district), email: normalizeOptional(input.email), number: normalizeOptional(input.number), complement: normalizeOptional(input.complement), postalCode: normalizePostalCode(input.postalCode), state: normalizeState(input.state), street: normalizeOptional(input.street), phone: normalizeOptional(input.phone), country: normalizeState(input.country) ?? 'BR' } });
    await this.audit.record({ action: AuditAction.ADMIN_OPERATION, actorId, entityId: id, entityType: 'Branch', metadata: { operation: 'update' }, tenantId });
    return presentBranch(branch);
  }

  async updateStatus(tenantId: string, actorId: string, id: string, active: boolean): Promise<BranchDto> {
    const branch = await this.prisma.branch.findFirst({ where: { id, tenantId } });
    if (!branch) throw new NotFoundException('Branch was not found.');
    if (!active && branch.main) throw new NotFoundException('Defina outra filial principal antes de desativar esta filial.');
    const updated = await this.prisma.branch.update({ where: { id }, data: { active } });
    await this.audit.record({ action: AuditAction.ADMIN_OPERATION, actorId, entityId: id, entityType: 'Branch', metadata: { operation: active ? 'activate' : 'deactivate' }, tenantId });
    return presentBranch(updated);
  }
}

function presentBranch(branch: { active: boolean; city: string | null; code: string; id: string; main: boolean; name: string; postalCode: string | null; state: string | null; street: string | null; number?: string | null; district?: string | null; email?: string | null; phone?: string | null; complement?: string | null; country?: string; createdAt?: Date; updatedAt?: Date }): BranchDto {
  return { active: branch.active, city: branch.city, code: branch.code, id: branch.id, main: branch.main, name: branch.name, postalCode: branch.postalCode, state: branch.state, street: branch.street, number: branch.number, district: branch.district, email: branch.email, phone: branch.phone, complement: branch.complement, country: branch.country, createdAt: branch.createdAt?.toISOString(), updatedAt: branch.updatedAt?.toISOString() };
}

function normalizePostalCode(value: string | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits.length > 0 ? digits : null;
}

function normalizeOptional(value: string | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function normalizeState(value: string | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? '';
  return normalized.length > 0 ? normalized : null;
}
