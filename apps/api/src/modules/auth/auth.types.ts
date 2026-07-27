import type { AuthenticatedUserDto, AuthResponseDto, UserRole } from '@logistics/shared';

export type AuthenticatedUser = AuthenticatedUserDto;
export type AuthResult = AuthResponseDto;

export interface AuthRequestMetadata {
  ip?: string | undefined;
  requestId?: string | undefined;
  userAgent?: string | undefined;
}

export interface VerifiedAccessToken {
  email: string;
  exp: number;
  iat: number;
  role: UserRole;
  sub: string;
  tenantId: string;
  type: 'access';
}
