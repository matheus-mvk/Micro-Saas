import { UserRole, type CustomerAddressDto, type CustomerDto, type PaginatedResult } from '@logistics/shared';
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestWithContext } from '../../common/types/request-context';

import { CustomersService } from './customers.service';
import {
  CreateCustomerAddressDto,
  CreateCustomerDto,
  ListCustomersDto,
  UpdateCustomerDto,
  UpdateCustomerStatusDto,
} from './dto/customer.dto';

@ApiBearerAuth()
@ApiTags('customers')
@Controller('customers')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @Query() query: ListCustomersDto,
  ): Promise<PaginatedResult<CustomerDto>> {
    return this.customers.list(tenantId, query);
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id') customerId: string): Promise<CustomerDto> {
    return this.customers.get(tenantId, customerId);
  }

  @Get(':id/addresses')
  listAddresses(@CurrentTenant() tenantId: string, @Param('id') customerId: string): Promise<CustomerAddressDto[]> {
    return this.customers.listAddresses(tenantId, customerId);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Body() body: CreateCustomerDto,
  ): Promise<CustomerDto> {
    return this.customers.create(tenantId, requireUserId(request), body);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Param('id') customerId: string,
    @Body() body: UpdateCustomerDto,
  ): Promise<CustomerDto> {
    return this.customers.update(tenantId, requireUserId(request), customerId, body);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Param('id') customerId: string,
    @Body() body: UpdateCustomerStatusDto,
  ): Promise<CustomerDto> {
    return this.customers.updateStatus(tenantId, requireUserId(request), customerId, body.active);
  }

  @Post(':id/addresses')
  createAddress(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Param('id') customerId: string,
    @Body() body: CreateCustomerAddressDto,
  ): Promise<CustomerAddressDto> {
    return this.customers.createAddress(tenantId, requireUserId(request), customerId, body);
  }
}

function requireUserId(request: RequestWithContext): string {
  const userId = request.context.userId;
  if (!userId) {
    throw new UnauthorizedException('Authentication context is required.');
  }
  return userId;
}
