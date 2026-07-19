import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface TenantJoinPayload {
  tenantId: string;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway {
  @WebSocketServer()
  private readonly server!: Server;

  @SubscribeMessage('tenant:join')
  joinTenantRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: TenantJoinPayload,
  ): { ok: boolean } {
    if (!payload.tenantId) {
      return { ok: false };
    }

    void socket.join(this.tenantRoom(payload.tenantId));
    return { ok: true };
  }

  emitImportProgress(tenantId: string, payload: Record<string, unknown>): void {
    this.server.to(this.tenantRoom(tenantId)).emit('import:progress', payload);
  }

  private tenantRoom(tenantId: string): string {
    return `tenant:${tenantId}`;
  }
}
