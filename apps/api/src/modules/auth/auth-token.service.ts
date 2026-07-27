import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

import { UserRole } from '@logistics/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { AppConfigService } from '../../config/app-config.service';

import type { AuthenticatedUser, VerifiedAccessToken } from './auth.types';

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

type JwtPayload = VerifiedAccessToken;

@Injectable()
export class AuthTokenService {
  constructor(private readonly config: AppConfigService) {}

  get accessTokenTtlSeconds(): number {
    return parseDurationToSeconds(this.config.jwtAccessExpiresIn);
  }

  get refreshTokenTtlSeconds(): number {
    return parseDurationToSeconds(this.config.jwtRefreshExpiresIn);
  }

  createAccessToken(user: AuthenticatedUser): { expiresAt: Date; token: string } {
    const now = Math.floor(Date.now() / 1000);
    const expiresAtSeconds = now + this.accessTokenTtlSeconds;
    const payload: JwtPayload = {
      email: user.email,
      exp: expiresAtSeconds,
      iat: now,
      role: user.role,
      sub: user.id,
      tenantId: user.tenant.id,
      type: 'access',
    };

    return {
      expiresAt: new Date(expiresAtSeconds * 1000),
      token: this.signJwt(payload),
    };
  }

  createRefreshToken(): { familyId: string; token: string } {
    return {
      familyId: randomUUID(),
      token: randomBytes(48).toString('base64url'),
    };
  }

  hashRefreshToken(token: string): string {
    return createHmac('sha256', this.config.jwtRefreshSecret).update(token).digest('hex');
  }

  hashOpaqueToken(token: string): string {
    return createHmac('sha256', this.config.jwtRefreshSecret).update(token).digest('hex');
  }

  hashMetadata(value: string | undefined): string | undefined {
    if (!value) return undefined;
    return createHmac('sha256', this.config.jwtRefreshSecret).update(value).digest('hex');
  }

  verifyAccessToken(token: string): VerifiedAccessToken {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('Authentication token is invalid.');
    }

    const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Authentication token is invalid.');
    }

    let payload: Partial<JwtPayload>;

    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<JwtPayload>;
    } catch {
      throw new UnauthorizedException('Authentication token is invalid.');
    }

    if (!isAccessPayload(payload)) {
      throw new UnauthorizedException('Authentication token is invalid.');
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Authentication token expired.');
    }

    return payload;
  }

  private signJwt(payload: JwtPayload): string {
    const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private sign(value: string): string {
    return createHmac('sha256', this.config.jwtAccessSecret).update(value).digest('base64url');
  }
}

function isAccessPayload(payload: Partial<JwtPayload>): payload is JwtPayload {
  return (
    payload.type === 'access' &&
    typeof payload.sub === 'string' &&
    typeof payload.tenantId === 'string' &&
    typeof payload.email === 'string' &&
    typeof payload.iat === 'number' &&
    typeof payload.exp === 'number' &&
    (payload.role === UserRole.ADMIN || payload.role === UserRole.MANAGER || payload.role === UserRole.OPERATOR)
  );
}

function parseDurationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    throw new Error(`Invalid duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === 's') return amount;
  if (unit === 'm') return amount * 60;
  if (unit === 'h') return amount * 60 * 60;
  return amount * 24 * 60 * 60;
}
