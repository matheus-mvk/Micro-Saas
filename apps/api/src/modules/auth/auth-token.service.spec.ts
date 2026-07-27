import { UserRole } from '@logistics/shared';
import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { AppConfigService } from '../../config/app-config.service';

import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  it('creates and verifies short-lived access tokens', () => {
    const service = new AuthTokenService(config());

    const { token } = service.createAccessToken({
      email: 'admin@example.com',
      id: 'user-1',
      name: 'Demo Admin',
      role: UserRole.ADMIN,
      tenant: { id: 'tenant-1', name: 'Demo Logistics', slug: 'demo-logistics' },
    });

    expect(service.verifyAccessToken(token)).toMatchObject({
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      sub: 'user-1',
      tenantId: 'tenant-1',
      type: 'access',
    });
  });

  it('rejects malformed tokens as unauthorized', () => {
    const service = new AuthTokenService(config());

    expect(() => service.verifyAccessToken('not-a-token')).toThrow(UnauthorizedException);
  });

  it('hashes refresh tokens deterministically without exposing token value', () => {
    const service = new AuthTokenService(config());

    const hash = service.hashRefreshToken('refresh-token');

    expect(hash).toBe(service.hashRefreshToken('refresh-token'));
    expect(hash).not.toContain('refresh-token');
  });
});

function config(): AppConfigService {
  return {
    jwtAccessExpiresIn: '15m',
    jwtAccessSecret: 'a'.repeat(32),
    jwtRefreshExpiresIn: '30d',
    jwtRefreshSecret: 'b'.repeat(32),
  } as AppConfigService;
}
