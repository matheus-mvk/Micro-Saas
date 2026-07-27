import type { AdminUserDto, AuthResponseDto, InviteUserResponseDto, PaginatedResult } from '@logistics/shared';
import { UserRole } from '@logistics/shared';
import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestWithContext } from '../../common/types/request-context';
import { AuthCookieService } from '../auth/auth-cookie.service';
import { AuthTokenService } from '../auth/auth-token.service';
import type { AuthRequestMetadata, AuthResult } from '../auth/auth.types';

import { AcceptInviteDto, ApproveUserDto, CreateAdminUserDto, InviteUserDto, ListUsersDto, UpdateAdminUserDto } from './dto/user-admin.dto';
import { UsersService } from './users.service';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly authCookies: AuthCookieService,
    private readonly authTokens: AuthTokenService,
    private readonly users: UsersService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(@CurrentTenant() tenantId: string, @Query() query: ListUsersDto): Promise<PaginatedResult<AdminUserDto>> {
    return this.users.list(tenantId, query);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Body() dto: CreateAdminUserDto): Promise<AdminUserDto> {
    return this.users.create(tenantId, requireUserId(request), dto);
  }

  @Post('invite')
  @Roles(UserRole.ADMIN)
  invite(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Body() dto: InviteUserDto): Promise<InviteUserResponseDto> {
    return this.users.invite(tenantId, requireUserId(request), dto);
  }

  @Public()
  @Post('accept-invite')
  @HttpCode(200)
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @Req() request: RequestWithContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.users.acceptInvite(dto, this.metadataFrom(request));
    this.setCookies(response, result);
    return { accessToken: result.accessToken, accessTokenExpiresAt: result.accessTokenExpiresAt, user: result.user };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @CurrentTenant() tenantId: string,
    @Req() request: RequestWithContext,
    @Param('id') userId: string,
    @Body() dto: UpdateAdminUserDto,
  ): Promise<AdminUserDto> {
    return this.users.update(tenantId, requireUserId(request), userId, dto);
  }

  @Post(':id/approve')
  @HttpCode(200)
  @Roles(UserRole.ADMIN)
  approve(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') userId: string, @Body() dto: ApproveUserDto): Promise<AdminUserDto> {
    return this.users.approve(tenantId, requireUserId(request), userId, dto.role);
  }

  @Post(':id/revoke-sessions')
  @HttpCode(200)
  @Roles(UserRole.ADMIN)
  revokeSessions(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') userId: string) {
    return this.users.revokeSessions(tenantId, requireUserId(request), userId);
  }

  @Post(':id/reset-mfa')
  @HttpCode(200)
  @Roles(UserRole.ADMIN)
  resetMfa(@CurrentTenant() tenantId: string, @Req() request: RequestWithContext, @Param('id') userId: string) {
    return this.users.resetMfa(tenantId, requireUserId(request), userId);
  }

  private metadataFrom(request: RequestWithContext): AuthRequestMetadata {
    return {
      ip: request.ip,
      requestId: request.context.requestId,
      userAgent: request.header('user-agent'),
    };
  }

  private setCookies(response: Response, result: AuthResult & { refreshToken: string }): void {
    this.authCookies.setAuthCookies(response, {
      accessToken: result.accessToken,
      accessTokenMaxAgeSeconds: this.authTokens.accessTokenTtlSeconds,
      refreshToken: result.refreshToken,
      refreshTokenMaxAgeSeconds: this.authTokens.refreshTokenTtlSeconds,
    });
  }
}

function requireUserId(request: RequestWithContext): string {
  const userId = request.context.userId;
  if (!userId) throw new UnauthorizedException('Authentication context is required.');
  return userId;
}
