import { createHmac } from 'node:crypto';

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { AppConfigService } from '../../config/app-config.service';
import { RedisService } from '../../infrastructure/cache/redis.service';

const LOCKED_LOGIN_MESSAGE = 'Too many login attempts. Try again later.';

interface LocalAttemptState {
  attempts: number;
  expiresAt: number;
}

@Injectable()
export class AuthLoginAttemptService {
  private readonly localAttempts = new Map<string, LocalAttemptState>();

  constructor(
    private readonly config: AppConfigService,
    private readonly redis: RedisService,
  ) {}

  buildIdentifier(input: { email: string; ip?: string | undefined; tenantSlug?: string | undefined }): string {
    const source = [
      input.email.trim().toLowerCase(),
      input.tenantSlug?.trim().toLowerCase() ?? 'any',
      input.ip ?? 'unknown',
    ].join('|');

    return createHmac('sha256', this.config.jwtRefreshSecret).update(source).digest('hex');
  }

  async assertCanAttempt(identifier: string): Promise<void> {
    const locked = await this.isLocked(identifier);

    if (locked) {
      throw tooManyLoginAttempts();
    }
  }

  async recordFailedAttempt(identifier: string): Promise<boolean> {
    try {
      const attempts = await this.redis.client.incr(this.redisKey(identifier));

      if (attempts === 1) {
        await this.redis.client.expire(this.redisKey(identifier), this.config.authLoginWindowSeconds);
      }

      return attempts >= this.config.authLoginMaxAttempts;
    } catch {
      return this.recordLocalFailedAttempt(identifier);
    }
  }

  async clear(identifier: string): Promise<void> {
    this.localAttempts.delete(identifier);

    try {
      await this.redis.client.del(this.redisKey(identifier));
    } catch {
      // The local fallback has already been cleared; Redis unavailability must not break a successful login.
    }
  }

  private async isLocked(identifier: string): Promise<boolean> {
    try {
      const attempts = Number((await this.redis.client.get(this.redisKey(identifier))) ?? 0);
      return attempts >= this.config.authLoginMaxAttempts;
    } catch {
      return this.isLocallyLocked(identifier);
    }
  }

  private recordLocalFailedAttempt(identifier: string): boolean {
    const now = Date.now();
    const current = this.localAttempts.get(identifier);
    const next =
      current && current.expiresAt > now
        ? current
        : {
            attempts: 0,
            expiresAt: now + this.config.authLoginWindowSeconds * 1000,
          };

    next.attempts += 1;
    this.localAttempts.set(identifier, next);

    return next.attempts >= this.config.authLoginMaxAttempts;
  }

  private isLocallyLocked(identifier: string): boolean {
    const current = this.localAttempts.get(identifier);

    if (!current) {
      return false;
    }

    if (current.expiresAt <= Date.now()) {
      this.localAttempts.delete(identifier);
      return false;
    }

    return current.attempts >= this.config.authLoginMaxAttempts;
  }

  private redisKey(identifier: string): string {
    return `auth:login-attempts:${identifier}`;
  }
}

export function tooManyLoginAttempts(): HttpException {
  return new HttpException(LOCKED_LOGIN_MESSAGE, HttpStatus.TOO_MANY_REQUESTS);
}
