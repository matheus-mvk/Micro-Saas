import type { InsightDto, InsightSummaryDto, PaginatedResult, RefreshInsightsResultDto } from '@logistics/shared';
import { UserRole } from '@logistics/shared';
import { Controller, Get, Param, Patch, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestWithContext } from '../../common/types/request-context';

import { ListInsightsDto } from './dto/insight.dto';
import { InsightsService } from './insights.service';

@ApiBearerAuth()
@ApiTags('insights')
@Controller('insights')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListInsightsDto): Promise<PaginatedResult<InsightDto>> {
    return this.insights.list(tenantId, query);
  }

  @Get('summary')
  summary(@CurrentTenant() tenantId: string): Promise<InsightSummaryDto> {
    return this.insights.summary(tenantId);
  }

  @Post('refresh')
  refresh(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext): Promise<RefreshInsightsResultDto> {
    return this.insights.refresh(tenantId, requireUserId(request));
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id') insightId: string): Promise<InsightDto> {
    return this.insights.get(tenantId, insightId);
  }

  @Patch(':id/read')
  read(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') insightId: string): Promise<InsightDto> {
    return this.insights.markRead(tenantId, requireUserId(request), insightId);
  }

  @Patch(':id/dismiss')
  dismiss(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') insightId: string): Promise<InsightDto> {
    return this.insights.dismiss(tenantId, requireUserId(request), insightId);
  }
}

function requireUserId(request: RequestWithContext): string {
  const userId = request.context.userId;
  if (!userId) throw new UnauthorizedException('Authentication context is required.');
  return userId;
}
