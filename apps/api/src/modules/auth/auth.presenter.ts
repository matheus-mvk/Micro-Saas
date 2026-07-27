import type { UserRole as SharedUserRole } from '@logistics/shared';
import type { Tenant, User, UserRole } from '@prisma/client';

import type { AuthenticatedUser, AuthResult } from './auth.types';

type UserWithTenant = User & { tenant: Tenant };

export function presentUser(user: UserWithTenant): AuthenticatedUser {
  const presented: AuthenticatedUser = {
    email: user.email,
    id: user.id,
    name: user.name,
    role: toSharedRole(user.role),
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      slug: user.tenant.slug,
    },
  };

  if (user.branchId) {
    presented.branchId = user.branchId;
  }

  return presented;
}

export function presentAuthResult(input: {
  accessToken: string;
  accessTokenExpiresAt: Date;
  user: AuthenticatedUser;
}): AuthResult {
  return {
    accessToken: input.accessToken,
    accessTokenExpiresAt: input.accessTokenExpiresAt.toISOString(),
    user: input.user,
  };
}

function toSharedRole(role: UserRole): SharedUserRole {
  return role as SharedUserRole;
}
