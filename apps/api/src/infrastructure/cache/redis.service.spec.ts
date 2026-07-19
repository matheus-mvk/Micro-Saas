import { describe, expect, it, vi } from 'vitest';

import type { AppConfigService } from '../../config/app-config.service';

import { RedisService } from './redis.service';

describe('RedisService', () => {
  it('builds tenant scoped keys', () => {
    const service = new RedisService(config());

    expect(service.tenantKey('tenant-1', 'imports:1')).toBe('tenant:tenant-1:imports:1');
    service.client.disconnect();
  });

  it('checks Redis health through ping', async () => {
    const service = new RedisService(config());
    Object.defineProperty(service.client, 'status', { value: 'ready' });
    vi.spyOn(service.client, 'ping').mockResolvedValue('PONG');

    await expect(service.ping()).resolves.toBe('PONG');
    service.client.disconnect();
  });
});

function config(): AppConfigService {
  return {
    redisHost: 'localhost',
    redisPort: 6379,
    redisPassword: undefined,
  } as AppConfigService;
}
