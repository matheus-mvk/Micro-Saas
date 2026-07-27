import { UserRole, type CarrierDto, type CarrierTransportServiceDto, type PaginatedResult } from '@logistics/shared';
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import { CarriersService } from './carriers.service';
import { CreateCarrierDto, CreateCarrierServiceDto, ListCarriersDto, UpdateCarrierDto, UpdateCarrierServiceDto, UpdateCarrierStatusDto } from './dto/carrier.dto';
import type { RequestWithContext } from '../../common/types/request-context';

@ApiBearerAuth()
@ApiTags('carriers')
@Controller('carriers')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
export class CarriersController {
  constructor(private readonly carriers: CarriersService) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListCarriersDto): Promise<PaginatedResult<CarrierDto>> {
    return this.carriers.list(tenantId, query);
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id') id: string): Promise<CarrierDto> { return this.carriers.get(tenantId, id); }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@CurrentTenant() tenantId: string, @Body() body: CreateCarrierDto): Promise<CarrierDto> {
    return this.carriers.create(tenantId, body);
  }

  @Post(':carrierId/services')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createService(
    @CurrentTenant() tenantId: string,
    @Param('carrierId') carrierId: string,
    @Body() body: CreateCarrierServiceDto,
  ): Promise<CarrierTransportServiceDto> {
    return this.carriers.createService(tenantId, carrierId, body);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string, @Body() body: UpdateCarrierDto): Promise<CarrierDto> {
    return this.carriers.update(tenantId, requireUserId(request), id, body);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateStatus(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string, @Body() body: UpdateCarrierStatusDto): Promise<CarrierDto> {
    return this.carriers.updateStatus(tenantId, requireUserId(request), id, body.active);
  }

  @Patch(':carrierId/services/:serviceId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateService(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('carrierId') carrierId: string, @Param('serviceId') serviceId: string, @Body() body: UpdateCarrierServiceDto): Promise<CarrierTransportServiceDto> {
    return this.carriers.updateService(tenantId, requireUserId(request), carrierId, serviceId, body);
  }
}

function requireUserId(request: RequestWithContext): string {
  if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.');
  return request.context.userId;
}
