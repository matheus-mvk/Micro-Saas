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
    return this.configService.get('PORT', { infer: true }) ?? this.configService.get('API_PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  get redisUrl(): string | undefined {
    return this.configService.get('REDIS_URL', { infer: true }) ?? undefined;
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

  get jwtAccessSecret(): string {
    return this.configService.get('JWT_ACCESS_SECRET', { infer: true });
  }

  get jwtRefreshSecret(): string {
    return this.configService.get('JWT_REFRESH_SECRET', { infer: true });
  }

  get jwtAccessExpiresIn(): string {
    return this.configService.get('JWT_ACCESS_EXPIRES_IN', { infer: true });
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
  }

  get authLoginMaxAttempts(): number {
    return this.configService.get('AUTH_LOGIN_MAX_ATTEMPTS', { infer: true });
  }

  get authLoginWindowSeconds(): number {
    return this.configService.get('AUTH_LOGIN_WINDOW_SECONDS', { infer: true });
  }

  get cookieDomain(): string {
    return this.configService.get('COOKIE_DOMAIN', { infer: true });
  }

  get apiPublicUrl(): string {
    return this.configService.get('API_PUBLIC_URL', { infer: true });
  }

  get webPublicUrl(): string {
    return this.configService.get('WEB_PUBLIC_URL', { infer: true });
  }

  get googleClientId(): string | undefined {
    return this.configService.get('GOOGLE_CLIENT_ID', { infer: true }) || undefined;
  }

  get googleClientSecret(): string | undefined {
    return this.configService.get('GOOGLE_CLIENT_SECRET', { infer: true }) || undefined;
  }

  get githubClientId(): string | undefined {
    return this.configService.get('GITHUB_CLIENT_ID', { infer: true }) || undefined;
  }

  get githubClientSecret(): string | undefined {
    return this.configService.get('GITHUB_CLIENT_SECRET', { infer: true }) || undefined;
  }

  get totpIssuer(): string {
    return this.configService.get('TOTP_ISSUER', { infer: true });
  }

  get importStorageDir(): string {
    return this.configService.get('IMPORT_STORAGE_DIR', { infer: true });
  }

  get importMaxFileSizeBytes(): number {
    return this.configService.get('IMPORT_MAX_FILE_SIZE_BYTES', { infer: true });
  }

  get importMaxRows(): number {
    return this.configService.get('IMPORT_MAX_ROWS', { infer: true });
  }
}
