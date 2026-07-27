import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import type { RequestWithContext } from '../../common/types/request-context';

import { AuthCookieService } from './auth-cookie.service';
import { AuthTokenService } from './auth-token.service';
import { presentUser } from './auth.presenter';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthContextService {
  constructor(
    private readonly authCookies: AuthCookieService,
    private readonly authRepository: AuthRepository,
    private readonly authTokens: AuthTokenService,
  ) {}

  async attachAuthenticatedContext(request: RequestWithContext): Promise<void> {
    const token = readBearerToken(request) ?? this.authCookies.readAccessToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication context is required.');
    }

    const payload = this.authTokens.verifyAccessToken(token);
    const user = await this.authRepository.findActiveUserById(payload.sub, payload.tenantId);

    if (!user) {
      throw new UnauthorizedException('Authentication context is required.');
    }

    const presentedUser = presentUser(user);

    request.context.tenantId = presentedUser.tenant.id;
    request.context.userId = presentedUser.id;
    request.context.role = presentedUser.role;
    request.context.user = presentedUser;
  }
}

function readBearerToken(request: Request): string | undefined {
  const authorization = request.header('authorization');
  const prefix = 'Bearer ';

  if (!authorization?.startsWith(prefix)) {
    return undefined;
  }

  return authorization.slice(prefix.length).trim();
}
