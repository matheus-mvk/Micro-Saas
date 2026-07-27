import { UserRole } from '@logistics/shared';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { ACCESS_TOKEN_COOKIE } from '../../modules/auth/auth-cookie.service';
import { AuthTokenService } from '../../modules/auth/auth-token.service';
import { AuthRepository } from '../../modules/auth/auth.repository';

interface TenantJoinPayload {
  tenantId?: string;
}

interface AuthenticatedSocketData {
  role: UserRole;
  tenantId: string;
  userId: string;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server!: Server;

  private readonly socketAuth = new WeakMap<Socket, AuthenticatedSocketData>();

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authTokens: AuthTokenService,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    const token = readSocketToken(socket);

    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const payload = this.authTokens.verifyAccessToken(token);
      const user = await this.authRepository.findActiveUserById(payload.sub, payload.tenantId);

      if (!user) {
        socket.disconnect(true);
        return;
      }

      this.socketAuth.set(socket, {
        role: payload.role,
        tenantId: payload.tenantId,
        userId: payload.sub,
      });
    } catch {
      socket.disconnect(true);
    }
  }

  @SubscribeMessage('tenant:join')
  joinTenantRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: TenantJoinPayload,
  ): { ok: boolean } {
    const auth = this.socketAuth.get(socket);

    if (!auth) {
      return { ok: false };
    }

    if (payload.tenantId !== undefined && payload.tenantId !== auth.tenantId) {
      return { ok: false };
    }

    void socket.join(auth.role === UserRole.OPERATOR ? this.userRoom(auth.tenantId, auth.userId) : this.tenantRoom(auth.tenantId));
    return { ok: true };
  }

  emitImportProgress(tenantId: string, payload: Record<string, unknown>): void {
    this.server.to(this.tenantRoom(tenantId)).emit('import:progress', payload);
  }

  emitImportEvent(tenantId: string, eventName: string, payload: Record<string, unknown>, userId?: string): void {
    this.server.to(this.tenantRoom(tenantId)).emit(eventName, payload);
    this.server.to(this.tenantRoom(tenantId)).emit('import:progress', payload);
    if (userId) {
      this.server.to(this.userRoom(tenantId, userId)).emit(eventName, payload);
      this.server.to(this.userRoom(tenantId, userId)).emit('import:progress', payload);
    }
  }

  emitDashboardRefresh(tenantId: string, reason: string): void {
    this.server.to(this.tenantRoom(tenantId)).emit('dashboard.refresh', {
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  emitTrackingUpdate(tenantId: string, shipmentId: string, payload: Record<string, unknown>): void {
    this.server.to(this.tenantRoom(tenantId)).emit('tracking.updated', { shipmentId, ...payload });
    this.emitDashboardRefresh(tenantId, 'tracking-updated');
  }

  private tenantRoom(tenantId: string): string {
    return `tenant:${tenantId}`;
  }

  private userRoom(tenantId: string, userId: string): string {
    return `tenant:${tenantId}:user:${userId}`;
  }
}

function readSocketToken(socket: Socket): string | undefined {
  const auth = readSocketAuth(socket);
  const authToken = auth.accessToken ?? auth.token;

  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.trim();
  }

  const authorization = readHeader(socket.handshake.headers.authorization);
  const bearerPrefix = 'Bearer ';
  if (authorization?.startsWith(bearerPrefix)) {
    return authorization.slice(bearerPrefix.length).trim();
  }

  return readCookie(readHeader(socket.handshake.headers.cookie), ACCESS_TOKEN_COOKIE);
}

function readHeader(header: string | string[] | undefined): string | undefined {
  if (Array.isArray(header)) {
    return header[0];
  }

  return header;
}

function readSocketAuth(socket: Socket): Record<string, unknown> {
  const handshake = socket.handshake as Socket['handshake'] & { auth?: unknown };
  const auth = handshake.auth;
  return isRecord(auth) ? auth : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readCookie(rawCookie: string | undefined, name: string): string | undefined {
  if (!rawCookie) return undefined;

  const prefix = `${name}=`;
  const match = rawCookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix));

  return match === undefined ? undefined : decodeURIComponent(match.slice(prefix.length));
}
