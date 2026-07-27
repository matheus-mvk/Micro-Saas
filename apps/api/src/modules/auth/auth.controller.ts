import { Body, Controller, Get, HttpCode, InternalServerErrorException, Param, Patch, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OAuthProvider } from '@prisma/client';
import type { Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import type { RequestWithContext } from '../../common/types/request-context';

import { AuthCookieService } from './auth-cookie.service';
import { AuthTokenService } from './auth-token.service';
import { AuthService } from './auth.service';
import type { AuthRequestMetadata, AuthResult } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { ConfirmMfaDto, VerifyMfaLoginDto } from './dto/mfa.dto';
import { CompleteOAuthRegistrationDto, OAuthCallbackDto, StartOAuthDto } from './dto/oauth.dto';
import { UpdateOnboardingDto } from './dto/onboarding.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { ChangePasswordDto, UpdateProfileDto } from './dto/profile.dto';
import { RegisterTenantDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authCookies: AuthCookieService,
    private readonly authService: AuthService,
    private readonly authTokens: AuthTokenService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() request: RequestWithContext,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto, this.metadataFrom(request));
    if ('mfaRequired' in result || 'pendingApproval' in result || 'incompleteRegistration' in result) {
      return result;
    }
    if (!result.refreshToken) {
      throw new InternalServerErrorException('Authenticated session could not be created.');
    }
    this.authCookies.setAuthCookies(response, {
      accessToken: result.accessToken,
      accessTokenMaxAgeSeconds: this.authTokens.accessTokenTtlSeconds,
      refreshToken: result.refreshToken,
      refreshTokenMaxAgeSeconds: this.authTokens.refreshTokenTtlSeconds,
    });
    return {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      user: result.user,
    };
  }

  @Public()
  @Post('register')
  @HttpCode(201)
  async register(
    @Body() dto: RegisterTenantDto,
    @Req() request: RequestWithContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResult> {
    const result = await this.authService.registerTenant(dto, this.metadataFrom(request));
    this.setCookies(response, result);
    return stripRefresh(result);
  }

  @Public()
  @Post('mfa/verify-login')
  @HttpCode(200)
  async verifyMfaLogin(
    @Body() dto: VerifyMfaLoginDto,
    @Req() request: RequestWithContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResult> {
    const result = await this.authService.verifyMfaLogin(dto, this.metadataFrom(request));
    this.setCookies(response, result);
    return stripRefresh(result);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: RequestWithContext) {
    return this.authService.forgotPassword(dto, this.metadataFrom(request));
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() request: RequestWithContext) {
    return this.authService.resetPassword(dto, this.metadataFrom(request));
  }

  @Public()
  @Get('tenants')
  tenants(@Query('search') search?: string) {
    return this.authService.listTenantOptions(search);
  }

  @Public()
  @Post('oauth/complete-registration')
  @HttpCode(200)
  completeOAuthRegistration(@Body() dto: CompleteOAuthRegistrationDto) {
    return this.authService.completeOAuthRegistration(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() request: RequestWithContext, @Res({ passthrough: true }) response: Response): Promise<AuthResult> {
    const result = await this.authService.refresh(this.authCookies.readRefreshToken(request), this.metadataFrom(request));
    this.authCookies.setAuthCookies(response, {
      accessToken: result.accessToken,
      accessTokenMaxAgeSeconds: this.authTokens.accessTokenTtlSeconds,
      refreshToken: result.refreshToken,
      refreshTokenMaxAgeSeconds: this.authTokens.refreshTokenTtlSeconds,
    });
    return {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      user: result.user,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: RequestWithContext, @Res({ passthrough: true }) response: Response): Promise<{ ok: true }> {
    await this.authService.logout(this.authCookies.readRefreshToken(request), this.metadataFrom(request));
    this.authCookies.clearAuthCookies(response);
    return { ok: true };
  }

  @ApiBearerAuth()
  @Get('me')
  async me(@Req() request: RequestWithContext): Promise<{ user: AuthResult['user'] }> {
    const { tenantId, userId } = request.context;

    if (!tenantId || !userId) {
      throw new UnauthorizedException('Authentication context is required.');
    }

    return {
      user: await this.authService.getCurrentUser(userId, tenantId),
    };
  }

  @ApiBearerAuth()
  @Get('profile')
  profile(@Req() request: RequestWithContext) {
    const { tenantId, userId } = requireContext(request);
    return this.authService.getProfile(userId, tenantId, this.authCookies.readRefreshToken(request));
  }

  @ApiBearerAuth()
  @Patch('profile')
  updateProfile(@Req() request: RequestWithContext, @Body() dto: UpdateProfileDto) {
    const { tenantId, userId } = requireContext(request);
    return this.authService.updateProfile(userId, tenantId, dto);
  }

  @ApiBearerAuth()
  @Post('profile/change-password')
  @HttpCode(200)
  changePassword(@Req() request: RequestWithContext, @Body() dto: ChangePasswordDto) {
    const { tenantId, userId } = requireContext(request);
    return this.authService.changePassword(userId, tenantId, dto);
  }

  @ApiBearerAuth()
  @Post('mfa/setup')
  @HttpCode(200)
  setupMfa(@Req() request: RequestWithContext) {
    const { tenantId, userId } = requireContext(request);
    return this.authService.beginMfaSetup(userId, tenantId);
  }

  @ApiBearerAuth()
  @Post('mfa/confirm')
  @HttpCode(200)
  confirmMfa(@Req() request: RequestWithContext, @Body() dto: ConfirmMfaDto) {
    const { tenantId, userId } = requireContext(request);
    return this.authService.confirmMfa(userId, tenantId, dto);
  }

  @ApiBearerAuth()
  @Post('mfa/disable')
  @HttpCode(200)
  disableMfa(@Req() request: RequestWithContext, @Body() dto: ConfirmMfaDto) {
    const { tenantId, userId } = requireContext(request);
    return this.authService.disableMfa(userId, tenantId, dto);
  }

  @ApiBearerAuth()
  @Post('sessions/revoke-others')
  @HttpCode(200)
  revokeOtherSessions(@Req() request: RequestWithContext) {
    const { tenantId, userId } = requireContext(request);
    return this.authService.revokeOtherSessions(userId, tenantId, this.authCookies.readRefreshToken(request));
  }

  @ApiBearerAuth()
  @Post('sessions/:sessionId/revoke')
  @HttpCode(200)
  revokeSession(@Req() request: RequestWithContext, @Param('sessionId') sessionId: string) {
    const { tenantId, userId } = requireContext(request);
    return this.authService.revokeSession(userId, tenantId, sessionId);
  }

  @ApiBearerAuth()
  @Get('onboarding')
  onboarding(@Req() request: RequestWithContext) {
    const { tenantId } = requireContext(request);
    return this.authService.getOnboarding(tenantId);
  }

  @ApiBearerAuth()
  @Patch('onboarding')
  updateOnboarding(@Req() request: RequestWithContext, @Body() dto: UpdateOnboardingDto) {
    const { tenantId, userId } = requireContext(request);
    return this.authService.updateOnboarding(tenantId, userId, dto);
  }

  @Public()
  @Get('oauth/status')
  oauthStatus() {
    return this.authService.getOAuthStatus();
  }

  @Public()
  @Get('oauth/:provider/start')
  startOAuth(@Param('provider') provider: string, @Query() query: StartOAuthDto) {
    return this.authService.startOAuth(toProvider(provider), query);
  }

  @ApiBearerAuth()
  @Get('profile/oauth/:provider/start')
  startOAuthLink(@Param('provider') provider: string, @Query() query: StartOAuthDto, @Req() request: RequestWithContext) {
    const { tenantId, userId } = requireContext(request);
    return this.authService.startOAuth(toProvider(provider), { ...query, mode: 'link' }, { tenantId, userId });
  }

  @ApiBearerAuth()
  @Post('profile/oauth/:provider/unlink')
  @HttpCode(200)
  unlinkOAuth(@Param('provider') provider: string, @Req() request: RequestWithContext) {
    const { tenantId, userId } = requireContext(request);
    return this.authService.unlinkProvider(userId, tenantId, toProvider(provider));
  }

  @Public()
  @Get('oauth/:provider/callback')
  async oauthCallback(
    @Param('provider') provider: string,
    @Query() query: OAuthCallbackDto,
    @Req() request: RequestWithContext,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.authService.handleOAuthCallback(toProvider(provider), query.code, query.state, this.metadataFrom(request));
    if (result.session) {
      this.setCookies(response, result.session);
    }
    response.redirect(result.redirectUrl);
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

function stripRefresh(result: AuthResult & { refreshToken: string }): AuthResult {
  return {
    accessToken: result.accessToken,
    accessTokenExpiresAt: result.accessTokenExpiresAt,
    user: result.user,
  };
}

function requireContext(request: RequestWithContext): { tenantId: string; userId: string } {
  const { tenantId, userId } = request.context;
  if (!tenantId || !userId) {
    throw new UnauthorizedException('Authentication context is required.');
  }
  return { tenantId, userId };
}

function toProvider(provider: string): OAuthProvider {
  const normalized = provider.toLowerCase();
  if (normalized === 'google') return OAuthProvider.GOOGLE;
  if (normalized === 'github') return OAuthProvider.GITHUB;
  throw new UnauthorizedException('OAuth provider is invalid.');
}
