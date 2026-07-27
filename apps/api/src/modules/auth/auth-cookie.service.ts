import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

import { AppConfigService } from '../../config/app-config.service';

export const ACCESS_TOKEN_COOKIE = 'nf_access_token';
export const REFRESH_TOKEN_COOKIE = 'nf_refresh_token';

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: AppConfigService) {}

  readAccessToken(request: Request): string | undefined {
    return readCookie(request, ACCESS_TOKEN_COOKIE);
  }

  readRefreshToken(request: Request): string | undefined {
    return readCookie(request, REFRESH_TOKEN_COOKIE);
  }

  setAuthCookies(response: Response, input: { accessToken: string; accessTokenMaxAgeSeconds: number; refreshToken: string; refreshTokenMaxAgeSeconds: number }): void {
    response.cookie(ACCESS_TOKEN_COOKIE, input.accessToken, this.cookieOptions(input.accessTokenMaxAgeSeconds));
    response.cookie(REFRESH_TOKEN_COOKIE, input.refreshToken, this.cookieOptions(input.refreshTokenMaxAgeSeconds));
  }

  clearAuthCookies(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions(0));
    response.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions(0));
  }

  private cookieOptions(maxAgeSeconds: number) {
    return {
      domain: this.config.cookieDomain === 'localhost' ? undefined : this.config.cookieDomain,
      httpOnly: true,
      maxAge: maxAgeSeconds * 1000,
      path: '/',
      sameSite: this.config.nodeEnv === 'production' ? ('none' as const) : ('lax' as const),
      secure: this.config.nodeEnv === 'production',
    };
  }
}

function readCookie(request: Request, name: string): string | undefined {
  const rawCookie = request.headers.cookie;
  if (!rawCookie) return undefined;

  const cookies = rawCookie.split(';').map((cookie) => cookie.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined;
}
