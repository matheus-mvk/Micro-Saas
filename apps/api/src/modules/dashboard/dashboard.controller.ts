import { UserRole, type DashboardSummaryDto } from '@logistics/shared';
import { Controller, Get, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestWithContext } from '../../common/types/request-context';

import { DashboardQueryDto } from './dto/dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiBearerAuth()
@ApiTags('dashboard')
@Controller('dashboard')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Returns tenant-scoped operational dashboard counters.' })
  @ApiOkResponse({ description: 'Dashboard summary calculated from persisted tenant data.' })
  getSummary(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary(tenantId, requireRole(request), query);
  }
}

function requireRole(request: RequestWithContext): UserRole {
  const role = request.context.role;
  if (!role) throw new UnauthorizedException('Authentication context is required.');
  return role;
}
