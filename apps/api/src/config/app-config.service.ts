import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Environment } from './environment';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<Environment, true>) {}

  get nodeEnv(): Environment['NODE_ENV'] {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get apiPort(): number {
    return this.configService.get('API_PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  get redisHost(): string {
    return this.configService.get('REDIS_HOST', { infer: true });
  }

  get redisPort(): number {
    return this.configService.get('REDIS_PORT', { infer: true });
  }

  get redisPassword(): string | undefined {
    return this.configService.get('REDIS_PASSWORD', { infer: true }) ?? undefined;
  }

  get corsOrigins(): string[] {
    return this.configService
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get logLevel(): Environment['LOG_LEVEL'] {
    return this.configService.get('LOG_LEVEL', { infer: true });
  }
}
