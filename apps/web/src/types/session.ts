import type { UserRole } from '@logistics/shared';

export interface SessionUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
}
