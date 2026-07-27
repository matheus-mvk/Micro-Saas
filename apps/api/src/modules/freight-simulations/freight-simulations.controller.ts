import {
  UserRole,
  type AddressDto,
  type FreightSimulationDto,
  type FreightSimulationListItemDto,
  type PaginatedResult,
  type ShipmentDto,
} from '@logistics/shared';
import { Body, Controller, Get, Param, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestWithContext } from '../../common/types/request-context';

import { CreateFreightSimulationDto, ListFreightSimulationsDto } from './dto/freight-simulation.dto';
import { FreightSimulationsService } from './freight-simulations.service';

@ApiBearerAuth()
@ApiTags('freight-simulations')
@Controller('freight-simulations')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
export class FreightSimulationsController {
  constructor(private readonly freightSimulations: FreightSimulationsService) {}

  @Get('address-lookup/:postalCode')
  lookupAddress(@Param('postalCode') postalCode: string): Promise<AddressDto> {
    return this.freightSimulations.lookupAddress(postalCode);
  }

  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @Query() query: ListFreightSimulationsDto,
  ): Promise<PaginatedResult<FreightSimulationListItemDto>> {
    return this.freightSimulations.list(tenantId, query);
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id') simulationId: string): Promise<FreightSimulationDto> {
    return this.freightSimulations.get(tenantId, simulationId);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Body() body: CreateFreightSimulationDto,
  ): Promise<FreightSimulationDto> {
    return this.freightSimulations.create(tenantId, requireUserId(request), body);
  }

  @Post(':id/options/:optionId/select')
  selectOption(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Param('id') simulationId: string,
    @Param('optionId') optionId: string,
  ): Promise<FreightSimulationDto> {
    return this.freightSimulations.selectOption(tenantId, requireUserId(request), simulationId, optionId);
  }

  @Post(':id/shipments')
  createShipment(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Param('id') simulationId: string,
  ): Promise<ShipmentDto> {
    return this.freightSimulations.createShipment(tenantId, requireUserId(request), simulationId);
  }
}

function requireUserId(request: RequestWithContext): string {
  const userId = request.context.userId;
  if (!userId) {
    throw new UnauthorizedException('Authentication context is required.');
  }
  return userId;
}
