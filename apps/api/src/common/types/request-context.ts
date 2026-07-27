import type { UserRole } from '@logistics/shared';
import type { Request } from 'express';

export interface AuthenticatedRequestUser {
  branchId?: string;
  email: string;
  id: string;
  name: string;
  role: UserRole;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface RequestContext {
  requestId: string;
  correlationId: string;
  tenantId?: string;
  userId?: string;
  role?: UserRole;
  user?: AuthenticatedRequestUser;
}

export interface RequestWithContext extends Request {
  context: RequestContext;
}
