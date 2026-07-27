import type { RedisOptions } from 'ioredis';

import type { AppConfigService } from '../../config/app-config.service';

export function buildRedisOptions(config: AppConfigService): RedisOptions {
  if (!config.redisUrl) {
    return {
      host: config.redisHost,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      password: config.redisPassword,
      port: config.redisPort,
    };
  }

  const url = new URL(config.redisUrl);
  return {
    host: url.hostname,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    password: url.password ? decodeURIComponent(url.password) : config.redisPassword,
    port: url.port ? Number(url.port) : 6379,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    username: url.username ? decodeURIComponent(url.username) : undefined,
  };
}
