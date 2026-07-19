import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(config: AppConfigService) {
    this.client = new Redis({
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async ping(): Promise<string> {
    if (this.client.status === 'end' || this.client.status === 'close') {
      await this.client.connect();
    }

    return this.client.ping();
  }

  tenantKey(tenantId: string, key: string): string {
    return `tenant:${tenantId}:${key}`;
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }
}
