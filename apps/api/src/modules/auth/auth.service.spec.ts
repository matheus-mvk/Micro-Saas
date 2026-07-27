import { UnauthorizedException } from '@nestjs/common';
import { AuditAction, UserRole, UserStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuditService } from '../audit/audit.service';

import type { AuthLoginAttemptService } from './auth-login-attempt.service';
import type { AuthTokenService } from './auth-token.service';
import type { AuthRepository, RefreshTokenRecord } from './auth.repository';
import { AuthService } from './auth.service';
import type { PasswordService } from './password.service';

describe('AuthService refresh security', () => {
  let audit: Pick<AuditService, 'record'>;
  let authRepository: Pick<AuthRepository, 'findRefreshTokenByHash' | 'revokeRefreshTokenFamily' | 'rotateRefreshToken'>;
  let tokenService: Pick<
    AuthTokenService,
    'createAccessToken' | 'createRefreshToken' | 'hashMetadata' | 'hashRefreshToken' | 'refreshTokenTtlSeconds'
  >;
  let service: AuthService;

  beforeEach(() => {
    audit = { record: vi.fn().mockResolvedValue(undefined) };
    authRepository = {
      findRefreshTokenByHash: vi.fn(),
      revokeRefreshTokenFamily: vi.fn().mockResolvedValue(undefined),
      rotateRefreshToken: vi.fn().mockResolvedValue(undefined),
    };
    tokenService = {
      createAccessToken: vi.fn().mockReturnValue({
        expiresAt: new Date('2026-07-25T22:00:00.000Z'),
        token: 'access-token',
      }),
      createRefreshToken: vi.fn().mockReturnValue({ familyId: 'family-1', token: 'new-refresh-token' }),
      hashMetadata: vi.fn().mockReturnValue('ip-hash'),
      hashRefreshToken: vi.fn().mockReturnValue('refresh-hash'),
      refreshTokenTtlSeconds: 60,
    };
    service = new AuthService(
      audit as AuditService,
      {} as AuthLoginAttemptService,
      authRepository as AuthRepository,
      {} as PasswordService,
      tokenService as AuthTokenService,
    );
  });

  it('rejects refresh for disabled users and records an auth failure', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(refreshSession(UserStatus.DISABLED));

    await expect(
      service.refresh('refresh-token', {
        ip: '127.0.0.1',
        requestId: 'request-1',
        userAgent: 'Vitest',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(authRepository.rotateRefreshToken).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.AUTH_FAILURE,
        actorId: 'user-1',
        tenantId: 'tenant-1',
      }),
    );
  });

  it('rejects refresh for invited users before rotating tokens', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(refreshSession(UserStatus.INVITED));

    await expect(service.refresh('refresh-token', { requestId: 'request-1' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(authRepository.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('rotates refresh tokens for active users in active tenants', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(refreshSession(UserStatus.ACTIVE));

    await expect(service.refresh('refresh-token', { requestId: 'request-1' })).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'new-refresh-token',
      user: {
        email: 'admin@example.com',
        id: 'user-1',
        tenant: { id: 'tenant-1' },
      },
    });

    expect(authRepository.rotateRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTokenId: 'refresh-token-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    );
  });
});

function refreshSession(status: UserStatus): RefreshTokenRecord {
  return {
    createdAt: new Date('2026-07-25T20:00:00.000Z'),
    expiresAt: new Date(Date.now() + 60_000),
    familyId: 'family-1',
    id: 'refresh-token-1',
    ipHash: null,
    revokedAt: null,
    rotatedAt: null,
    tenantId: 'tenant-1',
    tokenHash: 'refresh-hash',
    userAgent: null,
    userId: 'user-1',
    user: {
      branchId: null,
      createdAt: new Date('2026-07-25T20:00:00.000Z'),
      email: 'admin@example.com',
      id: 'user-1',
      lastLoginAt: null,
      name: 'Demo Admin',
      passwordHash: 'hash',
      role: UserRole.ADMIN,
      status,
      tenantId: 'tenant-1',
      updatedAt: new Date('2026-07-25T20:00:00.000Z'),
      tenant: {
        active: true,
        createdAt: new Date('2026-07-25T20:00:00.000Z'),
        document: null,
        id: 'tenant-1',
        name: 'Demo Logistics',
        slug: 'demo-logistics',
        updatedAt: new Date('2026-07-25T20:00:00.000Z'),
      },
    },
  };
}
