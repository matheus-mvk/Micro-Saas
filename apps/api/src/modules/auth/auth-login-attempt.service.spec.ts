import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { AppConfigService } from '../../config/app-config.service';
import type { RedisService } from '../../infrastructure/cache/redis.service';

import { AuthLoginAttemptService } from './auth-login-attempt.service';

describe('AuthLoginAttemptService', () => {
  it('blocks repeated login attempts and clears the lock after success', async () => {
    const service = new AuthLoginAttemptService(config(), unavailableRedis());
    const identifier = service.buildIdentifier({ email: 'ADMINISTRADOR@DEV.COM', ip: '127.0.0.1' });

    await expect(service.assertCanAttempt(identifier)).resolves.toBeUndefined();
    await expect(service.recordFailedAttempt(identifier)).resolves.toBe(false);
    await expect(service.recordFailedAttempt(identifier)).resolves.toBe(false);
    await expect(service.recordFailedAttempt(identifier)).resolves.toBe(true);
    try {
      await service.assertCanAttempt(identifier);
      throw new Error('Expected login attempt lock');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }

    await service.clear(identifier);

    await expect(service.assertCanAttempt(identifier)).resolves.toBeUndefined();
  });

  it('uses tenant slug in the login attempt identifier', () => {
    const service = new AuthLoginAttemptService(config(), unavailableRedis());

    const tenantAIdentifier = service.buildIdentifier({ email: 'admin@example.com', tenantSlug: 'tenant-a' });
    const tenantBIdentifier = service.buildIdentifier({ email: 'admin@example.com', tenantSlug: 'tenant-b' });

    expect(tenantAIdentifier).not.toBe(tenantBIdentifier);
  });
});

function config(): AppConfigService {
  return {
    authLoginMaxAttempts: 3,
    authLoginWindowSeconds: 60,
    jwtRefreshSecret: 'b'.repeat(32),
  } as AppConfigService;
}

function unavailableRedis(): RedisService {
  return {
    client: {
      del: async () => {
        throw new Error('Redis unavailable');
      },
      expire: async () => {
        throw new Error('Redis unavailable');
      },
      get: async () => {
        throw new Error('Redis unavailable');
      },
      incr: async () => {
        throw new Error('Redis unavailable');
      },
    },
  } as unknown as RedisService;
}
