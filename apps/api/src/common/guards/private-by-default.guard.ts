import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../constants/metadata.constants';
import type { RequestWithContext } from '../types/request-context';

@Injectable()
export class PrivateByDefaultGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();

    if (!request.context.tenantId || !request.context.userId || !request.context.role) {
      throw new UnauthorizedException('Authentication context is required.');
    }

    return true;
  }
}
