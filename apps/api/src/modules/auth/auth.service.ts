import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import type {
  ChangePasswordDto as SharedChangePasswordDto,
  ConfirmMfaResponseDto,
  ForgotPasswordResponseDto,
  LoginResponseDto,
  MfaSetupDto,
  ProfileDto,
  TenantOnboardingDto,
} from '@logistics/shared';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuditAction, OAuthProvider, UserRole, UserStatus, type Prisma, type RefreshToken } from '@prisma/client';

import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

import { AuthLoginAttemptService, tooManyLoginAttempts } from './auth-login-attempt.service';
import { AuthTokenService } from './auth-token.service';
import { presentAuthResult, presentUser } from './auth.presenter';
import { AuthRepository, type AuthUserRecord, type RefreshTokenRecord } from './auth.repository';
import { EmailDeliveryService } from './email-delivery.service';
import type { AuthRequestMetadata, AuthResult, AuthenticatedUser } from './auth.types';
import type { ConfirmMfaDto, VerifyMfaLoginDto } from './dto/mfa.dto';
import type { StartOAuthDto } from './dto/oauth.dto';
import type { UpdateOnboardingDto } from './dto/onboarding.dto';
import type { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import type { ChangePasswordDto, UpdateProfileDto } from './dto/profile.dto';
import type { RegisterTenantDto } from './dto/register.dto';
import { MfaService } from './mfa.service';
import { OAuthService } from './oauth.service';
import { PasswordService } from './password.service';

const GENERIC_LOGIN_ERROR = 'Invalid email or password.';
const PASSWORD_RESET_MESSAGE = { ok: true } as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
    private readonly emailDelivery: EmailDeliveryService,
    private readonly loginAttempts: AuthLoginAttemptService,
    private readonly authRepository: AuthRepository,
    private readonly mfa: MfaService,
    private readonly oauth: OAuthService,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
    private readonly tokenService: AuthTokenService,
  ) {}

  async registerTenant(dto: RegisterTenantDto, metadata: AuthRequestMetadata): Promise<AuthResult & { refreshToken: string }> {
    const email = normalizeEmail(dto.email);
    assertStrongPassword(dto.password, dto.passwordConfirmation);
    if (!dto.acceptedTerms || !dto.acceptedPrivacy) {
      throw new BadRequestException('Terms and privacy policy must be accepted.');
    }

    const existingUser = await this.prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      throw new ConflictException('This e-mail is already registered.');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const tenantSlug = await this.uniqueTenantSlug(dto.companyName);
    const authUser = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          active: true,
          name: dto.companyName.trim(),
          slug: tenantSlug,
          settings: { create: { country: 'BR', currency: 'BRL', timezone: 'America/Sao_Paulo' } },
          onboarding: { create: { companyDone: true, currentStep: 'branch' } },
        },
      });
      const branch = await tx.branch.create({
        data: {
          active: true,
          code: 'MATRIZ',
          country: 'BR',
          main: true,
          name: 'Matriz',
          tenantId: tenant.id,
        },
      });
      const user = await tx.user.create({
        data: {
          branchId: branch.id,
          email,
          name: dto.name.trim(),
          passwordHash,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          tenantId: tenant.id,
        },
        include: { tenant: true },
      });
      await tx.auditLog.create({
        data: {
          action: AuditAction.TENANT_REGISTERED,
          actorId: user.id,
          entityId: tenant.id,
          entityType: 'Tenant',
          metadata: { source: 'public_register' },
          requestId: metadata.requestId,
          tenantId: tenant.id,
        },
      });
      return user;
    });

    return this.issueSession(authUser, metadata, 'register');
  }

  async login(dto: { email: string; password: string; tenantSlug?: string }, metadata: AuthRequestMetadata): Promise<LoginResponseDto & { refreshToken?: string }> {
    const email = normalizeEmail(dto.email);
    const tenantSlug = dto.tenantSlug?.trim() ?? undefined;
    const attemptIdentifier = this.loginAttempts.buildIdentifier({ email, ip: metadata.ip, tenantSlug });

    try {
      await this.loginAttempts.assertCanAttempt(attemptIdentifier);
    } catch (error) {
      await this.recordAuthFailure(metadata, undefined, undefined, 'rate_limited');
      throw error;
    }

    const candidates = await this.authRepository.findActiveLoginCandidates(email, tenantSlug);
    const user = candidates.length === 1 ? candidates[0] : undefined;
    const isPasswordValid =
      user?.passwordHash !== null && user?.passwordHash !== undefined
        ? await this.passwordService.verify(dto.password, user.passwordHash)
        : false;

    if (!user || !isPasswordValid) {
      const isLocked = await this.loginAttempts.recordFailedAttempt(attemptIdentifier);
      await this.recordAuthFailure(metadata, user?.tenantId, user?.id, isLocked ? 'rate_limited' : 'invalid_credentials');

      if (isLocked) {
        throw tooManyLoginAttempts();
      }

      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    await this.loginAttempts.clear(attemptIdentifier);

    if (user.mfaEnabled && user.mfaSecret) {
      const challengeToken = randomToken();
      await this.prisma.mfaChallenge.create({
        data: {
          challengeTokenHash: this.tokenService.hashOpaqueToken(challengeToken),
          expiresAt: expiresIn(300),
          tenantId: user.tenantId,
          userId: user.id,
        },
      });
      return {
        challengeToken,
        expiresAt: expiresIn(300).toISOString(),
        mfaRequired: true,
        userHint: maskEmail(user.email),
      };
    }

    return this.issueSession(presentableUser(user), metadata, 'login');
  }

  async verifyMfaLogin(dto: VerifyMfaLoginDto, metadata: AuthRequestMetadata): Promise<AuthResult & { refreshToken: string }> {
    const challenge = await this.prisma.mfaChallenge.findFirst({
      where: {
        challengeTokenHash: this.tokenService.hashOpaqueToken(dto.challengeToken),
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { user: { include: { tenant: true } } },
    });

    if (!challenge || !challenge.user.mfaSecret || !challenge.user.mfaEnabled || challenge.user.status !== UserStatus.ACTIVE || !challenge.user.tenant.active) {
      await this.recordAuthFailure(metadata, challenge?.tenantId, challenge?.userId, 'invalid_mfa_challenge');
      throw new UnauthorizedException('MFA challenge is invalid.');
    }

    const verified = await this.verifyMfaOrRecovery(challenge.tenantId, challenge.userId, challenge.user.mfaSecret, dto.code);
    if (!verified) {
      await this.recordAuthFailure(metadata, challenge.tenantId, challenge.userId, 'invalid_mfa_code');
      throw new UnauthorizedException('MFA code is invalid.');
    }

    await this.prisma.mfaChallenge.update({ where: { id: challenge.id }, data: { usedAt: new Date() } });
    return this.issueSession(challenge.user, metadata, 'login_mfa');
  }

  async refresh(refreshToken: string | undefined, metadata: AuthRequestMetadata): Promise<AuthResult & { refreshToken: string }> {
    const session = await this.getValidRefreshSession(refreshToken, metadata);
    return this.issueSession(presentableUser(session.user), metadata, 'refresh', session);
  }

  async logout(refreshToken: string | undefined, metadata: AuthRequestMetadata): Promise<void> {
    if (!refreshToken) return;

    const session = await this.authRepository.findRefreshTokenByHash(this.tokenService.hashRefreshToken(refreshToken));
    if (!session || session.revokedAt) return;

    await this.authRepository.revokeRefreshToken(session.id);
    await this.audit.record({
      action: AuditAction.LOGOUT,
      actorId: session.userId,
      entityId: session.userId,
      entityType: 'User',
      ipHash: this.tokenService.hashMetadata(metadata.ip),
      metadata: { result: 'success' },
      requestId: metadata.requestId,
      tenantId: session.tenantId,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto, metadata: AuthRequestMetadata): Promise<ForgotPasswordResponseDto> {
    const email = normalizeEmail(dto.email);
    const emailHash = this.tokenService.hashOpaqueToken(email);
    const user = await this.prisma.user.findFirst({
      where: { email, status: UserStatus.ACTIVE, tenant: { active: true } },
      include: { tenant: true },
    });

    if (!user) {
      await this.audit.record({
        action: AuditAction.PASSWORD_RESET_REQUESTED,
        ipHash: this.tokenService.hashMetadata(metadata.ip),
        metadata: { result: 'accepted' },
        requestId: metadata.requestId,
      });
      return PASSWORD_RESET_MESSAGE;
    }

    const token = randomToken();
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, tenantId: user.tenantId, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          emailHash,
          expiresAt: expiresIn(3600),
          tenantId: user.tenantId,
          tokenHash: this.tokenService.hashOpaqueToken(token),
          userId: user.id,
        },
      }),
    ]);
    await this.audit.record({
      action: AuditAction.PASSWORD_RESET_REQUESTED,
      actorId: user.id,
      entityId: user.id,
      entityType: 'User',
      ipHash: this.tokenService.hashMetadata(metadata.ip),
      metadata: { result: 'accepted' },
      requestId: metadata.requestId,
      tenantId: user.tenantId,
    });

    const delivery = await this.emailDelivery.sendPasswordReset({
      email,
      resetUrl: `${this.config.webPublicUrl}/reset-password?token=${encodeURIComponent(token)}`,
    });
    return { ok: true, ...(delivery.devUrl ? { devResetUrl: delivery.devUrl } : {}) };
  }

  async resetPassword(dto: ResetPasswordDto, metadata: AuthRequestMetadata): Promise<{ ok: true }> {
    assertStrongPassword(dto.password, dto.passwordConfirmation);
    const reset = await this.prisma.passwordResetToken.findFirst({
      where: {
        expiresAt: { gt: new Date() },
        tokenHash: this.tokenService.hashOpaqueToken(dto.token),
        usedAt: null,
      },
    });

    if (!reset?.userId || !reset.tenantId) {
      throw new BadRequestException('Password reset token is invalid or expired.');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: reset.userId }, data: { passwordChangeRequired: false, passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      this.prisma.refreshToken.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.audit.record({
      action: AuditAction.PASSWORD_RESET_COMPLETED,
      actorId: reset.userId,
      entityId: reset.userId,
      entityType: 'User',
      ipHash: this.tokenService.hashMetadata(metadata.ip),
      requestId: metadata.requestId,
      tenantId: reset.tenantId,
    });
    return { ok: true };
  }

  async getCurrentUser(userId: string, tenantId: string): Promise<AuthenticatedUser> {
    const user = await this.authRepository.findActiveUserById(userId, tenantId);
    if (!user) throw new UnauthorizedException('Authentication context is required.');
    return presentUser(user);
  }

  async getProfile(userId: string, tenantId: string, currentRefreshToken?: string): Promise<ProfileDto> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, status: UserStatus.ACTIVE },
      include: { oauthAccounts: true, refreshTokens: { orderBy: { createdAt: 'desc' }, take: 20 }, tenant: true },
    });
    if (!user) throw new UnauthorizedException('Authentication context is required.');
    const currentHash = currentRefreshToken ? this.tokenService.hashRefreshToken(currentRefreshToken) : undefined;
    return {
      email: user.email,
      id: user.id,
      linkedProviders: user.oauthAccounts.map((account) => ({ email: account.email, provider: account.provider })),
      mfaEnabled: user.mfaEnabled,
      name: user.name,
      role: user.role as ProfileDto['role'],
      sessions: user.refreshTokens.map((session) => presentSession(session, currentHash)),
      tenant: { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug },
    };
  }

  async updateProfile(userId: string, tenantId: string, dto: UpdateProfileDto): Promise<ProfileDto> {
    await this.prisma.user.update({ where: { id: userId }, data: { name: dto.name.trim() } });
    await this.audit.record({ action: AuditAction.USER_UPDATED, actorId: userId, entityId: userId, entityType: 'User', tenantId });
    return this.getProfile(userId, tenantId);
  }

  async changePassword(userId: string, tenantId: string, dto: ChangePasswordDto | SharedChangePasswordDto): Promise<{ ok: true }> {
    assertStrongPassword(dto.newPassword, dto.newPasswordConfirmation);
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user?.passwordHash || !(await this.passwordService.verify(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is invalid.');
    }
    const passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordChangeRequired: false, passwordHash } }),
      this.prisma.refreshToken.updateMany({ where: { userId, tenantId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.audit.record({ action: AuditAction.USER_UPDATED, actorId: userId, entityId: userId, entityType: 'User', metadata: { operation: 'change_password' }, tenantId });
    return { ok: true };
  }

  async beginMfaSetup(userId: string, tenantId: string): Promise<MfaSetupDto> {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId, status: UserStatus.ACTIVE } });
    if (!user) throw new UnauthorizedException('Authentication context is required.');
    const secret = this.mfa.generateSecret();
    const encryptedSecret = this.encrypt(secret);
    await this.prisma.user.update({ where: { id: userId }, data: { mfaSecret: encryptedSecret, mfaEnabled: false } });
    const otpauthUrl = this.mfa.otpauthUrl({ accountName: user.email, secret });
    return {
      manualKey: secret,
      otpauthUrl,
      qrCodeDataUrl: await this.mfa.qrCodeDataUrl(otpauthUrl),
    };
  }

  async confirmMfa(userId: string, tenantId: string, dto: ConfirmMfaDto): Promise<ConfirmMfaResponseDto> {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user?.mfaSecret) throw new BadRequestException('MFA setup was not started.');
    const secret = this.decrypt(user.mfaSecret);
    if (!this.mfa.verifyCode(secret, dto.code)) throw new BadRequestException('MFA code is invalid.');
    const recoveryCodes = this.mfa.generateRecoveryCodes();
    await this.prisma.$transaction([
      this.prisma.mfaRecoveryCode.deleteMany({ where: { userId, tenantId } }),
      this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } }),
      ...recoveryCodes.map((code) =>
        this.prisma.mfaRecoveryCode.create({
          data: { codeHash: this.tokenService.hashOpaqueToken(code), tenantId, userId },
        }),
      ),
    ]);
    await this.audit.record({ action: AuditAction.MFA_CHANGED, actorId: userId, entityId: userId, entityType: 'User', metadata: { enabled: true }, tenantId });
    return { recoveryCodes };
  }

  async disableMfa(userId: string, tenantId: string, dto: ConfirmMfaDto): Promise<{ ok: true }> {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user?.mfaSecret || !this.mfa.verifyCode(this.decrypt(user.mfaSecret), dto.code)) {
      throw new BadRequestException('MFA code is invalid.');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: false, mfaSecret: null } }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { tenantId, userId } }),
    ]);
    await this.audit.record({ action: AuditAction.MFA_CHANGED, actorId: userId, entityId: userId, entityType: 'User', metadata: { enabled: false }, tenantId });
    return { ok: true };
  }

  async revokeSession(userId: string, tenantId: string, sessionId: string): Promise<{ ok: true }> {
    await this.prisma.refreshToken.updateMany({ where: { id: sessionId, tenantId, userId }, data: { revokedAt: new Date() } });
    await this.audit.record({ action: AuditAction.SESSION_REVOKED, actorId: userId, entityId: sessionId, entityType: 'RefreshToken', tenantId });
    return { ok: true };
  }

  async revokeOtherSessions(userId: string, tenantId: string, currentRefreshToken?: string): Promise<{ ok: true }> {
    const currentHash = currentRefreshToken ? this.tokenService.hashRefreshToken(currentRefreshToken) : undefined;
    await this.prisma.refreshToken.updateMany({
      where: { tenantId, userId, revokedAt: null, ...(currentHash ? { tokenHash: { not: currentHash } } : {}) },
      data: { revokedAt: new Date() },
    });
    await this.audit.record({ action: AuditAction.SESSION_REVOKED, actorId: userId, entityType: 'RefreshToken', metadata: { scope: 'others' }, tenantId });
    return { ok: true };
  }

  async getOnboarding(tenantId: string): Promise<TenantOnboardingDto> {
    const onboarding = await this.prisma.tenantOnboarding.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });
    return presentOnboarding(onboarding);
  }

  async updateOnboarding(tenantId: string, actorId: string, dto: UpdateOnboardingDto): Promise<TenantOnboardingDto> {
    const completed = dto.completed === true || (dto.companyDone === true && dto.branchDone === true);
    const onboarding = await this.prisma.tenantOnboarding.upsert({
      where: { tenantId },
      create: {
        branchDone: dto.branchDone ?? false,
        companyDone: dto.companyDone ?? false,
        completed,
        currentStep: dto.currentStep ?? (completed ? 'done' : 'branch'),
        inviteDone: dto.inviteDone ?? false,
        tenantId,
      },
      update: {
        ...(dto.branchDone !== undefined ? { branchDone: dto.branchDone } : {}),
        ...(dto.companyDone !== undefined ? { companyDone: dto.companyDone } : {}),
        ...(dto.inviteDone !== undefined ? { inviteDone: dto.inviteDone } : {}),
        ...(dto.currentStep !== undefined ? { currentStep: dto.currentStep } : {}),
        ...(dto.completed !== undefined || completed ? { completed } : {}),
      },
    });
    if (completed) {
      await this.prisma.tenantSettings.upsert({
        where: { tenantId },
        create: { onboardingCompleted: true, tenantId },
        update: { onboardingCompleted: true },
      });
    }
    await this.audit.record({ action: AuditAction.ONBOARDING_UPDATED, actorId, entityId: tenantId, entityType: 'TenantOnboarding', tenantId });
    return presentOnboarding(onboarding);
  }

  async startOAuth(provider: OAuthProvider, dto: StartOAuthDto, input?: { tenantId?: string; userId?: string }): Promise<{ authorizationUrl: string }> {
    if (dto.mode === 'link' && (!input?.tenantId || !input.userId)) {
      throw new UnauthorizedException('Authentication is required to link providers.');
    }
    if (dto.mode === 'register' && !dto.companyName?.trim()) {
      throw new BadRequestException('Company name is required for OAuth registration.');
    }
    const state = randomToken();
    await this.prisma.oAuthState.create({
      data: {
        expiresAt: expiresIn(600),
        mode: dto.mode,
        provider,
        stateHash: this.tokenService.hashOpaqueToken(state),
        ...(input?.tenantId ? { tenantId: input.tenantId } : {}),
        ...(input?.userId ? { userId: input.userId } : {}),
        ...(dto.companyName ? { metadata: { companyName: dto.companyName.trim() } } : {}),
      },
    });
    return { authorizationUrl: this.oauth.authorizationUrl(provider, state) };
  }

  async handleOAuthCallback(
    provider: OAuthProvider,
    code: string,
    state: string,
    metadata: AuthRequestMetadata,
  ): Promise<{ redirectUrl: string; session?: AuthResult & { refreshToken: string } }> {
    const storedState = await this.prisma.oAuthState.findFirst({
      where: { provider, stateHash: this.tokenService.hashOpaqueToken(state), usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!storedState) throw new BadRequestException('OAuth state is invalid or expired.');
    await this.prisma.oAuthState.update({ where: { id: storedState.id }, data: { usedAt: new Date() } });
    const identity = await this.oauth.exchange(provider, code);

    if (storedState.mode === 'link') {
      if (!storedState.tenantId || !storedState.userId) throw new BadRequestException('OAuth state is invalid.');
      await this.linkProvider(storedState.userId, storedState.tenantId, identity);
      return { redirectUrl: `${this.config.webPublicUrl}/settings/profile?linked=${provider.toLowerCase()}` };
    }

    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId: identity.providerUserId } },
      include: { user: { include: { tenant: true } } },
    });
    if (existingAccount) {
      const result = await this.issueSession(existingAccount.user, metadata, 'oauth_login');
      return { redirectUrl: `${this.config.webPublicUrl}/dashboard`, session: result };
    }

    if (storedState.mode === 'register') {
      const companyName = readCompanyName(storedState.metadata);
      if (!companyName) throw new BadRequestException('Company name is required for OAuth registration.');
      const result = await this.registerOAuthTenant(identity, companyName, metadata);
      return { redirectUrl: `${this.config.webPublicUrl}/onboarding`, session: result };
    }

    throw new NotFoundException('No linked account was found for this provider.');
  }

  async unlinkProvider(userId: string, tenantId: string, provider: OAuthProvider): Promise<{ ok: true }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { oauthAccounts: true },
    });
    if (!user) throw new UnauthorizedException('Authentication context is required.');
    const remainingProviders = user.oauthAccounts.filter((account) => account.provider !== provider);
    if (!user.passwordHash && remainingProviders.length === 0) {
      throw new ForbiddenException('At least one sign-in method must remain active.');
    }
    await this.prisma.oAuthAccount.deleteMany({ where: { tenantId, userId, provider } });
    await this.audit.record({ action: AuditAction.OAUTH_UNLINKED, actorId: userId, entityId: userId, entityType: 'User', metadata: { provider }, tenantId });
    return { ok: true };
  }

  private async registerOAuthTenant(identity: { email: string; name: string; provider: OAuthProvider; providerUserId: string }, companyName: string, metadata: AuthRequestMetadata): Promise<AuthResult & { refreshToken: string }> {
    const existingUser = await this.prisma.user.findFirst({ where: { email: identity.email } });
    if (existingUser) throw new ConflictException('This e-mail is already registered.');
    const tenantSlug = await this.uniqueTenantSlug(companyName);
    const user = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          active: true,
          name: companyName,
          slug: tenantSlug,
          settings: { create: { country: 'BR', currency: 'BRL', timezone: 'America/Sao_Paulo' } },
          onboarding: { create: { companyDone: true, currentStep: 'branch' } },
        },
      });
      const createdUser = await tx.user.create({
        data: {
          email: identity.email,
          name: identity.name,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          tenantId: tenant.id,
        },
        include: { tenant: true },
      });
      await tx.oAuthAccount.create({
        data: {
          email: identity.email,
          provider: identity.provider,
          providerUserId: identity.providerUserId,
          tenantId: tenant.id,
          userId: createdUser.id,
        },
      });
      await tx.auditLog.create({
        data: {
          action: AuditAction.TENANT_REGISTERED,
          actorId: createdUser.id,
          entityId: tenant.id,
          entityType: 'Tenant',
          metadata: { provider: identity.provider, source: 'oauth_register' },
          requestId: metadata.requestId,
          tenantId: tenant.id,
        },
      });
      return createdUser;
    });
    return this.issueSession(user, metadata, 'oauth_register');
  }

  private async linkProvider(userId: string, tenantId: string, identity: { email: string; provider: OAuthProvider; providerUserId: string }): Promise<void> {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId, status: UserStatus.ACTIVE } });
    if (!user) throw new UnauthorizedException('Authentication context is required.');
    if (normalizeEmail(user.email) !== normalizeEmail(identity.email)) {
      throw new ConflictException('Provider e-mail must match the authenticated user e-mail.');
    }
    await this.prisma.oAuthAccount.upsert({
      where: { tenantId_userId_provider: { provider: identity.provider, tenantId, userId } },
      create: {
        email: identity.email,
        provider: identity.provider,
        providerUserId: identity.providerUserId,
        tenantId,
        userId,
      },
      update: { email: identity.email, providerUserId: identity.providerUserId },
    });
    await this.audit.record({ action: AuditAction.OAUTH_LINKED, actorId: userId, entityId: userId, entityType: 'User', metadata: { provider: identity.provider }, tenantId });
  }

  private async issueSession(
    user: AuthUserRecord,
    metadata: AuthRequestMetadata,
    auditResult: string,
    rotatedSession?: RefreshTokenRecord,
  ): Promise<AuthResult & { refreshToken: string }> {
    const authUser = presentUser(user);
    const { token: accessToken, expiresAt: accessTokenExpiresAt } = this.tokenService.createAccessToken(authUser);
    const refresh = this.tokenService.createRefreshToken();
    const refreshExpiresAt = expiresIn(this.tokenService.refreshTokenTtlSeconds);
    const refreshTokenData: Prisma.RefreshTokenUncheckedCreateInput = {
      expiresAt: refreshExpiresAt,
      familyId: rotatedSession?.familyId ?? refresh.familyId,
      tenantId: authUser.tenant.id,
      tokenHash: this.tokenService.hashRefreshToken(refresh.token),
      userId: authUser.id,
    };
    const ipHash = this.tokenService.hashMetadata(metadata.ip);
    if (ipHash) refreshTokenData.ipHash = ipHash;
    if (metadata.userAgent) refreshTokenData.userAgent = metadata.userAgent;

    if (rotatedSession) {
      await this.authRepository.rotateRefreshToken({
        currentTokenId: rotatedSession.id,
        expiresAt: refreshExpiresAt,
        familyId: refreshTokenData.familyId,
        ...(refreshTokenData.ipHash ? { ipHash: refreshTokenData.ipHash } : {}),
        tenantId: refreshTokenData.tenantId,
        tokenHash: refreshTokenData.tokenHash,
        ...(refreshTokenData.userAgent ? { userAgent: refreshTokenData.userAgent } : {}),
        userId: refreshTokenData.userId,
      });
    } else {
      await this.authRepository.createRefreshToken(refreshTokenData);
    }
    await this.authRepository.updateLastLogin(authUser.id);
    if (auditResult !== 'refresh') {
      await this.audit.record({
        action: AuditAction.LOGIN,
        actorId: authUser.id,
        entityId: authUser.id,
        entityType: 'User',
        ipHash,
        metadata: { result: auditResult },
        requestId: metadata.requestId,
        tenantId: authUser.tenant.id,
      });
    }

    return { ...presentAuthResult({ accessToken, accessTokenExpiresAt, user: authUser }), refreshToken: refresh.token };
  }

  private async getValidRefreshSession(refreshToken: string | undefined, metadata: AuthRequestMetadata): Promise<RefreshTokenRecord> {
    if (!refreshToken) {
      await this.recordAuthFailure(metadata);
      throw new UnauthorizedException('Refresh session is invalid.');
    }
    const session = await this.authRepository.findRefreshTokenByHash(this.tokenService.hashRefreshToken(refreshToken));
    if (!session) {
      await this.recordAuthFailure(metadata);
      throw new UnauthorizedException('Refresh session is invalid.');
    }
    if (session.revokedAt) {
      await this.authRepository.revokeRefreshTokenFamily(session.familyId);
      await this.recordAuthFailure(metadata, session.tenantId, session.userId);
      throw new UnauthorizedException('Refresh session is invalid.');
    }
    if (session.expiresAt.getTime() <= Date.now() || session.user.status !== UserStatus.ACTIVE || !session.user.tenant.active) {
      await this.recordAuthFailure(metadata, session.tenantId, session.userId);
      throw new UnauthorizedException('Refresh session is invalid.');
    }
    return session;
  }

  private async recordAuthFailure(metadata: AuthRequestMetadata, tenantId?: string, actorId?: string, reason = 'invalid_credentials'): Promise<void> {
    await this.audit.record({
      action: AuditAction.AUTH_FAILURE,
      actorId,
      entityId: actorId,
      entityType: actorId ? 'User' : undefined,
      ipHash: this.tokenService.hashMetadata(metadata.ip),
      metadata: { reason, result: 'failure' },
      requestId: metadata.requestId,
      tenantId,
    });
  }

  private async uniqueTenantSlug(companyName: string): Promise<string> {
    const base = slugify(companyName);
    for (let index = 0; index < 20; index += 1) {
      const candidate = index === 0 ? base : `${base}-${index + 1}`;
      const exists = await this.prisma.tenant.findUnique({ where: { slug: candidate } });
      if (!exists) return candidate;
    }
    return `${base}-${randomBytes(3).toString('hex')}`;
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', encryptionKey(this.config.jwtRefreshSecret), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  private decrypt(value: string): string {
    const [iv, tag, encrypted] = value.split('.');
    if (!iv || !tag || !encrypted) throw new BadRequestException('MFA secret is invalid.');
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(this.config.jwtRefreshSecret), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
  }

  private async verifyMfaOrRecovery(tenantId: string, userId: string, encryptedSecret: string, code: string): Promise<boolean> {
    const normalized = code.replace(/\s+/g, '').toUpperCase();
    if (/^\d{6}$/.test(normalized) && this.mfa.verifyCode(this.decrypt(encryptedSecret), normalized)) return true;
    const codeHash = this.tokenService.hashOpaqueToken(normalized);
    const recovery = await this.prisma.mfaRecoveryCode.findFirst({ where: { codeHash, tenantId, userId, usedAt: null } });
    if (!recovery) return false;
    await this.prisma.mfaRecoveryCode.update({ where: { id: recovery.id }, data: { usedAt: new Date() } });
    return true;
  }
}

function presentSession(session: RefreshToken, currentHash?: string): ProfileDto['sessions'][number] {
  return {
    createdAt: session.createdAt.toISOString(),
    current: currentHash !== undefined && safeEqual(session.tokenHash, currentHash),
    expiresAt: session.expiresAt.toISOString(),
    id: session.id,
    lastUsedAt: session.rotatedAt?.toISOString() ?? null,
    userAgent: session.userAgent,
  };
}

function presentOnboarding(input: { branchDone: boolean; companyDone: boolean; completed: boolean; currentStep: string; inviteDone: boolean }): TenantOnboardingDto {
  return {
    branchDone: input.branchDone,
    companyDone: input.companyDone,
    completed: input.completed,
    currentStep: input.currentStep,
    inviteDone: input.inviteDone,
  };
}

function readCompanyName(metadata: Prisma.JsonValue | null): string | null {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const value = (metadata as Record<string, unknown>).companyName;
    if (typeof value === 'string') return value.trim();
  }
  return null;
}

function presentableUser(user: AuthUserRecord): AuthUserRecord {
  return user;
}

function randomToken(): string {
  return randomBytes(48).toString('base64url');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function expiresIn(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}

function assertStrongPassword(password: string, confirmation: string): void {
  if (password !== confirmation) throw new BadRequestException('Password confirmation does not match.');
  if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new BadRequestException('Password must have uppercase, lowercase, number and special character.');
  }
}

function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return slug || `tenant-${randomBytes(3).toString('hex')}`;
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'usuario autenticado';
  return `${name.slice(0, 2)}***@${domain}`;
}

function encryptionKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
