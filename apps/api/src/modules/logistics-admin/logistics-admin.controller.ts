import { UserRole } from '@logistics/shared';
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestWithContext } from '../../common/types/request-context';
import { LogisticsAdminService } from './logistics-admin.service';
import { CoverageDto, CoverageTestDto, CreateTrackingEventDto, ListAdminLogisticsDto, RateTableInputDto, UpdateShipmentStatusDto } from './logistics-admin.dto';

@ApiBearerAuth()
@ApiTags('logistics-admin')
@Controller()
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
export class LogisticsAdminController {
  constructor(private readonly service: LogisticsAdminService) {}
  @Get('freight-rate-tables') listRateTables(@CurrentTenant() tenantId: string, @Query() query: ListAdminLogisticsDto): Promise<unknown> { return this.service.listRateTables(tenantId, query); }
  @Get('freight-rate-tables/:id') getRateTable(@CurrentTenant() tenantId: string, @Param('id') id: string): Promise<unknown> { return this.service.getRateTable(tenantId, id); }
  @Post('freight-rate-tables') @Roles(UserRole.ADMIN, UserRole.MANAGER) createRateTable(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Body() body: RateTableInputDto): Promise<unknown> { if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.'); return this.service.createRateTable(tenantId, request.context.userId, body); }
  @Patch('freight-rate-tables/:id') @Roles(UserRole.ADMIN, UserRole.MANAGER) updateRateTable(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string, @Body() body: RateTableInputDto): Promise<unknown> { if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.'); return this.service.updateRateTable(tenantId, request.context.userId, id, body); }
  @Post('freight-rate-tables/:id/duplicate') @Roles(UserRole.ADMIN, UserRole.MANAGER) duplicateRateTable(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string): Promise<unknown> { if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.'); return this.service.createRateTableVersion(tenantId, request.context.userId, id); }
  @Post('freight-rate-tables/:id/new-version') @Roles(UserRole.ADMIN, UserRole.MANAGER) newRateTableVersion(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string): Promise<unknown> { if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.'); return this.service.createRateTableVersion(tenantId, request.context.userId, id); }
  @Patch('freight-rate-tables/:id/status') @Roles(UserRole.ADMIN, UserRole.MANAGER) updateRateTableStatus(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string, @Body() body: { status: 'ACTIVE' | 'INACTIVE' }): Promise<unknown> { if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.'); return this.service.updateRateTableStatus(tenantId, request.context.userId, id, body.status); }
  @Get('shipments') listShipments(@CurrentTenant() tenantId: string, @Query() query: ListAdminLogisticsDto): Promise<unknown> { return this.service.listShipments(tenantId, query); }
  @Get('shipments/:id') getShipment(@CurrentTenant() tenantId: string, @Param('id') id: string): Promise<unknown> { return this.service.getShipment(tenantId, id); }
  @Post('shipments/:id/tracking-events') @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR) createTracking(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string, @Body() body: CreateTrackingEventDto): Promise<unknown> { if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.'); return this.service.createTrackingEvent(tenantId, request.context.userId, id, body); }
  @Patch('shipments/:id/status') @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR) updateShipmentStatus(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string, @Body() body: UpdateShipmentStatusDto): Promise<unknown> { if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.'); return this.service.updateShipmentStatus(tenantId, request.context.userId, id, body.status); }
  @Get('audit-logs') @Roles(UserRole.ADMIN, UserRole.MANAGER) listAudit(@CurrentTenant() tenantId: string, @Query() query: ListAdminLogisticsDto): Promise<unknown> { return this.service.listAudit(tenantId, query); }
  @Get('coverages') listCoverages(@CurrentTenant() tenantId: string, @Query() query: ListAdminLogisticsDto): Promise<unknown> { return this.service.listCoverages(tenantId, query); }
  @Post('coverages') @Roles(UserRole.ADMIN, UserRole.MANAGER) createCoverage(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Body() body: CoverageDto): Promise<unknown> { if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.'); return this.service.createCoverage(tenantId, request.context.userId, body); }
  @Patch('coverages/:id') @Roles(UserRole.ADMIN, UserRole.MANAGER) updateCoverage(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string, @Body() body: CoverageDto): Promise<unknown> { if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.'); return this.service.updateCoverage(tenantId, request.context.userId, id, body); }
  @Post('coverages/test') testCoverage(@CurrentTenant() tenantId: string, @Body() body: CoverageTestDto): Promise<unknown> { return this.service.testCoverage(tenantId, body); }
}
