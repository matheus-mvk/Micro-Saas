import { UserRole } from '@logistics/shared';
import { UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import type { AuthContextService } from '../../modules/auth/auth-context.service';
import type { RequestWithContext } from '../types/request-context';

import { PrivateByDefaultGuard } from './private-by-default.guard';

describe('PrivateByDefaultGuard', () => {
  it('allows public routes without authentication context', async () => {
    const guard = new PrivateByDefaultGuard({} as AuthContextService, reflector(true));

    await expect(guard.canActivate(context({ context: { requestId: 'req', correlationId: 'req' } }))).resolves.toBe(true);
  });

  it('attaches trusted authentication context for private routes', async () => {
    const attachAuthenticatedContext = vi.fn(async (request: RequestWithContext) => {
      request.context.tenantId = 'tenant-1';
      request.context.userId = 'user-1';
      request.context.role = UserRole.ADMIN;
    });
    const authContext = {
      attachAuthenticatedContext,
    } as unknown as AuthContextService;
    const guard = new PrivateByDefaultGuard(authContext, reflector(false));

    await expect(guard.canActivate(context({ context: { requestId: 'req', correlationId: 'req' } }))).resolves.toBe(true);
    expect(attachAuthenticatedContext).toHaveBeenCalledOnce();
  });

  it('rejects private routes when verified context is missing', async () => {
    const authContext = {
      attachAuthenticatedContext: vi.fn(async () => undefined),
    } as unknown as AuthContextService;
    const guard = new PrivateByDefaultGuard(authContext, reflector(false));

    await expect(guard.canActivate(context({ context: { requestId: 'req', correlationId: 'req' } }))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

function reflector(isPublic: boolean): Reflector {
  return {
    getAllAndOverride: vi.fn(() => isPublic),
  } as unknown as Reflector;
}

function context(request: Partial<RequestWithContext>) {
  return {
    getClass: vi.fn(),
    getHandler: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as never;
}
