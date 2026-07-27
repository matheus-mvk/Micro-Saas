import type { CustomerAddressDto, CustomerDto, PaginatedResult } from '@logistics/shared';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AddressType, AuditAction, Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

import { presentCustomer } from './customers.presenter';
import type { CreateCustomerAddressDto, CreateCustomerDto, ListCustomersDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async list(tenantId: string, query: ListCustomersDto): Promise<PaginatedResult<CustomerDto>> {
    const page = query.page;
    const perPage = query.perPage;
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(query.active === undefined ? {} : { active: query.active }),
      ...(query.search?.trim()
        ? {
            OR: [
              { name: { contains: query.search.trim() } },
              { document: { contains: onlyDigits(query.search) } },
            ],
          }
        : {}),
    };

    const [customers, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map(presentCustomer),
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async get(tenantId: string, customerId: string): Promise<CustomerDto> {
    return presentCustomer(await this.getCustomerOrThrow(tenantId, customerId));
  }

  async create(tenantId: string, actorId: string, input: CreateCustomerDto): Promise<CustomerDto> {
    const document = input.document === undefined ? undefined : normalizeDocument(input.document);
    validateDocument(document);
    const data: Prisma.CustomerUncheckedCreateInput = {
      active: true,
      name: input.name.trim(),
      tenantId,
    };
    if (document !== undefined) data.document = document;
    if (input.email !== undefined) data.email = normalizeOptional(input.email);
    if (input.phone !== undefined) data.phone = normalizeOptional(input.phone);

    try {
      const customer = await this.prisma.customer.create({
        data,
      });

      await this.audit.record({
        action: AuditAction.CUSTOMER_CHANGED,
        actorId,
        entityId: customer.id,
        entityType: 'Customer',
        metadata: { operation: 'create' },
        tenantId,
      });

      return presentCustomer(customer);
    } catch (error) {
      handleCustomerPersistenceError(error);
    }
  }

  async update(tenantId: string, actorId: string, customerId: string, input: UpdateCustomerDto): Promise<CustomerDto> {
    const current = await this.getCustomerOrThrow(tenantId, customerId);
    const document = input.document === undefined ? undefined : normalizeDocument(input.document);
    validateDocument(document);
    const data: Prisma.CustomerUncheckedUpdateInput = {};
    if (document !== undefined) data.document = document;
    if (input.email !== undefined) data.email = normalizeOptional(input.email);
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.phone !== undefined) data.phone = normalizeOptional(input.phone);

    try {
      const customer = await this.prisma.customer.update({
        where: { id: current.id },
        data,
      });

      await this.audit.record({
        action: AuditAction.CUSTOMER_CHANGED,
        actorId,
        entityId: customer.id,
        entityType: 'Customer',
        metadata: { operation: 'update' },
        tenantId,
      });

      return presentCustomer(customer);
    } catch (error) {
      handleCustomerPersistenceError(error);
    }
  }

  async updateStatus(tenantId: string, actorId: string, customerId: string, active: boolean): Promise<CustomerDto> {
    const current = await this.getCustomerOrThrow(tenantId, customerId);
    const customer = await this.prisma.customer.update({
      where: { id: current.id },
      data: { active },
    });

    await this.audit.record({
      action: AuditAction.CUSTOMER_CHANGED,
      actorId,
      entityId: customer.id,
      entityType: 'Customer',
      metadata: { operation: active ? 'activate' : 'deactivate' },
      tenantId,
    });

    return presentCustomer(customer);
  }

  async listAddresses(tenantId: string, customerId: string): Promise<CustomerAddressDto[]> {
    await this.getCustomerOrThrow(tenantId, customerId);
    const addresses = await this.prisma.customerAddress.findMany({
      where: { customerId, tenantId },
      orderBy: [{ main: 'desc' }, { pickup: 'desc' }, { delivery: 'desc' }, { createdAt: 'asc' }],
    });
    return addresses.map(presentAddress);
  }

  async createAddress(
    tenantId: string,
    actorId: string,
    customerId: string,
    input: CreateCustomerAddressDto,
  ): Promise<CustomerAddressDto> {
    await this.getCustomerOrThrow(tenantId, customerId);

    if (input.main) {
      await this.prisma.customerAddress.updateMany({ where: { tenantId, customerId, main: true }, data: { main: false } });
    }

    const address = await this.prisma.customerAddress.create({
      data: {
        active: true,
        city: input.city.trim(),
        complement: normalizeOptional(input.complement ?? ''),
        country: 'BR',
        customerId,
        delivery: input.delivery ?? false,
        district: normalizeOptional(input.district ?? ''),
        label: normalizeOptional(input.label ?? ''),
        main: input.main ?? false,
        number: normalizeOptional(input.number ?? ''),
        pickup: input.pickup ?? false,
        postalCode: onlyDigits(input.postalCode),
        state: input.state.trim().toUpperCase(),
        street: input.street.trim(),
        tenantId,
        type: toAddressType(input.type),
      },
    });

    await this.audit.record({
      action: AuditAction.CUSTOMER_CHANGED,
      actorId,
      entityId: customerId,
      entityType: 'CustomerAddress',
      metadata: { operation: 'create_address', addressId: address.id },
      tenantId,
    });

    return presentAddress(address);
  }

  private async getCustomerOrThrow(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer was not found.');
    }

    return customer;
  }
}

function presentAddress(address: {
  active: boolean;
  city: string;
  complement: string | null;
  country: string;
  customerId: string;
  delivery: boolean;
  district: string | null;
  id: string;
  label: string | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  main: boolean;
  number: string | null;
  pickup: boolean;
  postalCode: string;
  state: string;
  street: string;
  type: AddressType;
}): CustomerAddressDto {
  return {
    active: address.active,
    city: address.city,
    complement: address.complement,
    country: address.country,
    customerId: address.customerId,
    delivery: address.delivery,
    district: address.district,
    id: address.id,
    label: address.label,
    latitude: address.latitude?.toNumber() ?? null,
    longitude: address.longitude?.toNumber() ?? null,
    main: address.main,
    number: address.number,
    pickup: address.pickup,
    postalCode: address.postalCode,
    state: address.state,
    street: address.street,
    type: address.type as CustomerAddressDto['type'],
  };
}

function toAddressType(value: string | undefined): AddressType {
  return value && Object.values(AddressType).includes(value as AddressType) ? (value as AddressType) : AddressType.OTHER;
}

function normalizeOptional(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeDocument(value: string): string | null {
  const digits = onlyDigits(value);
  return digits.length > 0 ? digits : null;
}

function onlyDigits(value: string | undefined): string {
  return value?.replace(/\D/g, '') ?? '';
}

function validateDocument(document: string | null | undefined): void {
  if (document === undefined || document === null) return;

  if (document.length === 11 && isValidCpf(document)) return;
  if (document.length === 14 && isValidCnpj(document)) return;

  throw new BadRequestException('Customer document must be a valid CPF or CNPJ.');
}

function isValidCpf(document: string): boolean {
  if (/^(\d)\1+$/.test(document)) return false;

  const firstDigit = calculateCpfDigit(document.slice(0, 9));
  const secondDigit = calculateCpfDigit(`${document.slice(0, 9)}${String(firstDigit)}`);
  return document === `${document.slice(0, 9)}${String(firstDigit)}${String(secondDigit)}`;
}

function calculateCpfDigit(input: string): number {
  const sum = input
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (input.length + 1 - index), 0);
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

function isValidCnpj(document: string): boolean {
  if (/^(\d)\1+$/.test(document)) return false;

  const firstDigit = calculateCnpjDigit(document.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateCnpjDigit(`${document.slice(0, 12)}${String(firstDigit)}`, [
    6,
    5,
    4,
    3,
    2,
    9,
    8,
    7,
    6,
    5,
    4,
    3,
    2,
  ]);
  return document === `${document.slice(0, 12)}${String(firstDigit)}${String(secondDigit)}`;
}

function calculateCnpjDigit(input: string, weights: number[]): number {
  const sum = input.split('').reduce((total, digit, index) => total + Number(digit) * (weights[index] ?? 0), 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function handleCustomerPersistenceError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ConflictException('Customer document already exists in this tenant.');
  }

  throw error;
}
