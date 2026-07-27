import { UserRole } from '@logistics/shared';
import type { Socket } from 'socket.io';
import { describe, expect, it, vi } from 'vitest';

import type { AuthTokenService } from '../../modules/auth/auth-token.service';
import type { AuthRepository } from '../../modules/auth/auth.repository';

import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway tenant isolation', () => {
  it('binds websocket room joins to the authenticated tenant', async () => {
    const gateway = new NotificationsGateway(repository(), tokenService());
    const { join, socket } = socketWithToken('valid-token');

    await gateway.handleConnection(socket);

    expect(gateway.joinTenantRoom(socket, { tenantId: 'tenant-b' })).toEqual({ ok: false });
    expect(join.mock.calls).toHaveLength(0);

    expect(gateway.joinTenantRoom(socket, {})).toEqual({ ok: true });
    expect(join.mock.calls).toEqual([['tenant:tenant-a']]);
  });

  it('disconnects unauthenticated sockets and refuses room joins', async () => {
    const gateway = new NotificationsGateway(repository(), tokenService());
    const { disconnect, join, socket } = socketWithoutToken();

    await gateway.handleConnection(socket);

    expect(disconnect.mock.calls).toEqual([[true]]);
    expect(gateway.joinTenantRoom(socket, {})).toEqual({ ok: false });
    expect(join.mock.calls).toHaveLength(0);
  });
});

function repository(): AuthRepository {
  return {
    findActiveUserById: vi.fn().mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-a',
    }),
  } as unknown as AuthRepository;
}

function tokenService(): AuthTokenService {
  return {
    verifyAccessToken: vi.fn().mockReturnValue({
      email: 'admin@example.com',
      exp: 9_999_999_999,
      iat: 1,
      role: UserRole.ADMIN,
      sub: 'user-1',
      tenantId: 'tenant-a',
      type: 'access',
    }),
  } as unknown as AuthTokenService;
}

function socketWithToken(token: string): { join: ReturnType<typeof vi.fn>; socket: Socket } {
  const join = vi.fn();
  const socket = {
    data: {},
    disconnect: vi.fn(),
    handshake: {
      auth: { accessToken: token },
      headers: {},
    },
    join,
  } as unknown as Socket;
  return { join, socket };
}

function socketWithoutToken(): { disconnect: ReturnType<typeof vi.fn>; join: ReturnType<typeof vi.fn>; socket: Socket } {
  const disconnect = vi.fn();
  const join = vi.fn();
  const socket = {
    data: {},
    disconnect,
    handshake: {
      auth: {},
      headers: {},
    },
    join,
  } as unknown as Socket;
  return { disconnect, join, socket };
}
