import { UserRole, type BranchDto, type PaginatedResult } from '@logistics/shared';
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import { BranchesService } from './branches.service';
import { CreateBranchDto, ListBranchesDto, UpdateBranchDto, UpdateBranchStatusDto } from './dto/branch.dto';
import type { RequestWithContext } from '../../common/types/request-context';

@ApiBearerAuth()
@ApiTags('branches')
@Controller('branches')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListBranchesDto): Promise<PaginatedResult<BranchDto>> {
    return this.branches.list(tenantId, query);
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id') id: string): Promise<BranchDto> { return this.branches.get(tenantId, id); }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@CurrentTenant() tenantId: string, @Body() body: CreateBranchDto): Promise<BranchDto> {
    return this.branches.create(tenantId, body);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string, @Body() body: UpdateBranchDto): Promise<BranchDto> {
    return this.branches.update(tenantId, requireUserId(request), id, body);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateStatus(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') id: string, @Body() body: UpdateBranchStatusDto): Promise<BranchDto> {
    return this.branches.updateStatus(tenantId, requireUserId(request), id, body.active);
  }
}

function requireUserId(request: RequestWithContext): string {
  if (!request.context.userId) throw new UnauthorizedException('Authentication context is required.');
  return request.context.userId;
}
