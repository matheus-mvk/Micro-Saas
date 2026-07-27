import { randomBytes } from 'node:crypto';

import type { AdminUserDto, InviteUserResponseDto, PaginatedResult } from '@logistics/shared';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, UserInvitationStatus, UserRole, UserStatus, type Prisma, type User } from '@prisma/client';

import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthTokenService } from '../auth/auth-token.service';
import { presentAuthResult, presentUser } from '../auth/auth.presenter';
import type { AuthRequestMetadata, AuthResult } from '../auth/auth.types';
import type { AuthUserRecord } from '../auth/auth.repository';
import { EmailDeliveryService } from '../auth/email-delivery.service';
import { PasswordService } from '../auth/password.service';

import type { AcceptInviteDto, CreateAdminUserDto, InviteUserDto, ListUsersDto, UpdateAdminUserDto } from './dto/user-admin.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly audit: AuditService,
    private readonly emailDelivery: EmailDeliveryService,
    private readonly passwordService: PasswordService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly tokenService: AuthTokenService,
  ) {}

  async list(tenantId: string, query: ListUsersDto): Promise<PaginatedResult<AdminUserDto>> {
    const page = query.page;
    const perPage = query.perPage;
    const where: Prisma.UserWhereInput = {
      tenantId,
      status: query.status ? (query.status as UserStatus) : { not: UserStatus.DELETED },
      ...(query.role ? { role: query.role as UserRole } : {}),
      ...(query.search?.trim()
        ? { OR: [{ name: { contains: query.search.trim() } }, { email: { contains: query.search.trim().toLowerCase() } }] }
        : {}),
    };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { oauthAccounts: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data: users.map(presentAdminUser), meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async create(tenantId: string, actorId: string, dto: CreateAdminUserDto): Promise<AdminUserDto> {
    const email = normalizeEmail(dto.email);
    assertRole(dto.role);
    if (dto.role === UserRole.ADMIN) {
      await this.assertActorIsAdmin(tenantId, actorId);
    }
    const passwordHash = dto.password ? await this.passwordService.hash(dto.password) : null;
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          name: dto.name.trim(),
          passwordChangeRequired: dto.passwordChangeRequired ?? Boolean(dto.password),
          passwordHash,
          role: dto.role as UserRole,
          status: passwordHash ? UserStatus.ACTIVE : UserStatus.INVITED,
          tenantId,
        },
        include: { oauthAccounts: true },
      });
      await this.audit.record({
        action: AuditAction.USER_CREATED,
        actorId,
        entityId: user.id,
        entityType: 'User',
        metadata: { role: user.role, directCreate: true },
        tenantId,
      });
      return presentAdminUser(user);
    } catch (error) {
      if (isUniqueError(error)) throw new ConflictException('User e-mail already exists in this tenant.');
      throw error;
    }
  }

  async invite(tenantId: string, actorId: string, dto: InviteUserDto): Promise<InviteUserResponseDto> {
    const email = normalizeEmail(dto.email);
    assertRole(dto.role);
    const existingUser = await this.prisma.user.findFirst({ where: { tenantId, email, status: { not: UserStatus.DELETED } } });
    if (existingUser) throw new ConflictException('User e-mail already exists in this tenant.');
    const token = randomToken();
    const invitation = await this.prisma.userInvitation.upsert({
      where: { tenantId_email_status: { email, status: UserInvitationStatus.PENDING, tenantId } },
      create: {
        email,
        expiresAt: expiresIn(7 * 24 * 3600),
        invitedById: actorId,
        role: dto.role as UserRole,
        status: UserInvitationStatus.PENDING,
        tenantId,
        tokenHash: this.tokenService.hashOpaqueToken(token),
      },
      update: {
        expiresAt: expiresIn(7 * 24 * 3600),
        invitedById: actorId,
        role: dto.role as UserRole,
        tokenHash: this.tokenService.hashOpaqueToken(token),
      },
    });
    await this.audit.record({
      action: AuditAction.USER_INVITED,
      actorId,
      entityId: invitation.id,
      entityType: 'UserInvitation',
      metadata: { email, role: dto.role },
      tenantId,
    });
    const delivery = await this.emailDelivery.sendInvitation({
      email,
      inviteUrl: `${this.config.webPublicUrl}/accept-invite?token=${encodeURIComponent(token)}`,
    });
    return { invitationId: invitation.id, ok: true, ...(delivery.devUrl ? { devInviteUrl: delivery.devUrl } : {}) };
  }

  async acceptInvite(dto: AcceptInviteDto, metadata: AuthRequestMetadata): Promise<AuthResult & { refreshToken: string }> {
    assertPassword(dto.password, dto.passwordConfirmation);
    const invitation = await this.prisma.userInvitation.findFirst({
      where: {
        expiresAt: { gt: new Date() },
        status: UserInvitationStatus.PENDING,
        tokenHash: this.tokenService.hashOpaqueToken(dto.token),
      },
      include: { tenant: true },
    });
    if (!invitation) throw new BadRequestException('Invitation is invalid or expired.');
    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: invitation.email,
          name: dto.name.trim(),
          passwordHash,
          role: invitation.role,
          status: UserStatus.ACTIVE,
          tenantId: invitation.tenantId,
        },
        include: { tenant: true },
      });
      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date(), acceptedById: createdUser.id, status: UserInvitationStatus.ACCEPTED },
      });
      await tx.auditLog.create({
        data: {
          action: AuditAction.USER_CREATED,
          actorId: createdUser.id,
          entityId: createdUser.id,
          entityType: 'User',
          metadata: { invited: true },
          requestId: metadata.requestId,
          tenantId: invitation.tenantId,
        },
      });
      return createdUser;
    });
    return this.issueSession(user, metadata);
  }

  async update(tenantId: string, actorId: string, targetUserId: string, dto: UpdateAdminUserDto): Promise<AdminUserDto> {
    const current = await this.prisma.user.findFirst({ where: { id: targetUserId, tenantId }, include: { oauthAccounts: true } });
    if (!current) throw new NotFoundException('User was not found.');
    if (dto.role === UserRole.ADMIN) await this.assertActorIsAdmin(tenantId, actorId);
    if ((dto.role && dto.role !== current.role) || (dto.status && dto.status !== current.status)) {
      await this.assertLastAdminSafe(tenantId, current, dto);
    }
    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.role !== undefined ? { role: dto.role as UserRole } : {}),
        ...(dto.status !== undefined ? { deletedAt: dto.status === UserStatus.DELETED ? new Date() : null, status: dto.status as UserStatus } : {}),
      },
      include: { oauthAccounts: true },
    });
    if (dto.status && dto.status !== UserStatus.ACTIVE) {
      await this.prisma.refreshToken.updateMany({ where: { tenantId, userId: targetUserId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await this.audit.record({
      action: dto.role && dto.role !== current.role ? AuditAction.ROLE_CHANGED : AuditAction.USER_UPDATED,
      actorId,
      entityId: targetUserId,
      entityType: 'User',
      metadata: { after: { role: user.role, status: user.status }, before: { role: current.role, status: current.status } },
      tenantId,
    });
    return presentAdminUser(user);
  }

  async revokeSessions(tenantId: string, actorId: string, targetUserId: string): Promise<{ ok: true }> {
    await this.prisma.refreshToken.updateMany({ where: { tenantId, userId: targetUserId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.record({ action: AuditAction.SESSION_REVOKED, actorId, entityId: targetUserId, entityType: 'User', tenantId });
    return { ok: true };
  }

  async resetMfa(tenantId: string, actorId: string, targetUserId: string): Promise<{ ok: true }> {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: targetUserId }, data: { mfaEnabled: false, mfaSecret: null } }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { tenantId, userId: targetUserId } }),
      this.prisma.mfaChallenge.updateMany({ where: { tenantId, userId: targetUserId, usedAt: null }, data: { usedAt: new Date() } }),
    ]);
    await this.audit.record({ action: AuditAction.MFA_CHANGED, actorId, entityId: targetUserId, entityType: 'User', metadata: { resetByAdmin: true }, tenantId });
    return { ok: true };
  }

  private async issueSession(user: AuthUserRecord, metadata: AuthRequestMetadata): Promise<AuthResult & { refreshToken: string }> {
    const authUser = presentUser(user);
    const { token: accessToken, expiresAt: accessTokenExpiresAt } = this.tokenService.createAccessToken(authUser);
    const refresh = this.tokenService.createRefreshToken();
    const refreshTokenData: Prisma.RefreshTokenUncheckedCreateInput = {
      expiresAt: expiresIn(this.tokenService.refreshTokenTtlSeconds),
      familyId: refresh.familyId,
      tenantId: authUser.tenant.id,
      tokenHash: this.tokenService.hashRefreshToken(refresh.token),
      userId: authUser.id,
    };
    if (metadata.userAgent) refreshTokenData.userAgent = metadata.userAgent;
    await this.prisma.refreshToken.create({ data: refreshTokenData });
    return { ...presentAuthResult({ accessToken, accessTokenExpiresAt, user: authUser }), refreshToken: refresh.token };
  }

  private async assertActorIsAdmin(tenantId: string, actorId: string): Promise<void> {
    const actor = await this.prisma.user.findFirst({ where: { id: actorId, tenantId, role: UserRole.ADMIN, status: UserStatus.ACTIVE } });
    if (!actor) throw new ForbiddenException('Only administrators can perform this action.');
  }

  private async assertLastAdminSafe(tenantId: string, current: User, dto: UpdateAdminUserDto): Promise<void> {
    if (current.role !== UserRole.ADMIN || current.status !== UserStatus.ACTIVE) return;
    const demotesAdmin = dto.role !== undefined && dto.role !== UserRole.ADMIN;
    const disablesAdmin = dto.status !== undefined && dto.status !== UserStatus.ACTIVE;
    if (!demotesAdmin && !disablesAdmin) return;
    const activeAdmins = await this.prisma.user.count({ where: { tenantId, role: UserRole.ADMIN, status: UserStatus.ACTIVE } });
    if (activeAdmins <= 1) throw new ForbiddenException('The last active administrator cannot be removed.');
  }
}

function presentAdminUser(user: User & { oauthAccounts: Array<{ email: string; provider: 'GOOGLE' | 'GITHUB' }> }): AdminUserDto {
  return {
    createdAt: user.createdAt.toISOString(),
    email: user.email,
    id: user.id,
    invited: user.status === UserStatus.INVITED,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    mfaEnabled: user.mfaEnabled,
    name: user.name,
    providers: user.oauthAccounts.map((account) => ({ email: account.email, provider: account.provider })),
    role: user.role as AdminUserDto['role'],
    status: user.status as AdminUserDto['status'],
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function randomToken(): string {
  return cryptoRandomToken();
}

function cryptoRandomToken(): string {
  return randomBytes(48).toString('base64url');
}

function expiresIn(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}

function assertRole(role: UserRole | string): void {
  if (![UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR].includes(role as UserRole)) throw new BadRequestException('Invalid role.');
}

function assertPassword(password: string, confirmation: string): void {
  if (password !== confirmation) throw new BadRequestException('Password confirmation does not match.');
  if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new BadRequestException('Password must have uppercase, lowercase, number and special character.');
  }
}

function isUniqueError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
}
