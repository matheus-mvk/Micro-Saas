import type { UserRole } from '@logistics/shared';
import type { Request } from 'express';

export interface RequestContext {
  requestId: string;
  correlationId: string;
  tenantId?: string;
  userId?: string;
  role?: UserRole;
}

export interface RequestWithContext extends Request {
  context: RequestContext;
}
