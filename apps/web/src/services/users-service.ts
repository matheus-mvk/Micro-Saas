import type { AcceptInviteDto, AdminUserDto, AuthResponseDto, CreateAdminUserDto, InviteUserDto, InviteUserResponseDto, PaginatedResult, UpdateAdminUserDto } from '@logistics/shared';

import { apiRequest } from './http-client';

export function listUsers(params: URLSearchParams): Promise<PaginatedResult<AdminUserDto>> {
  return apiRequest<PaginatedResult<AdminUserDto>>(`/users?${params.toString()}`);
}

export function createUser(values: CreateAdminUserDto): Promise<AdminUserDto> {
  return apiRequest<AdminUserDto>('/users', { method: 'POST', body: JSON.stringify(values) });
}

export function inviteUser(values: InviteUserDto): Promise<InviteUserResponseDto> {
  return apiRequest<InviteUserResponseDto>('/users/invite', { method: 'POST', body: JSON.stringify(values) });
}

export function acceptInvite(values: AcceptInviteDto): Promise<AuthResponseDto> {
  return apiRequest<AuthResponseDto>('/users/accept-invite', { method: 'POST', body: JSON.stringify(values) });
}

export function updateUser(userId: string, values: UpdateAdminUserDto): Promise<AdminUserDto> {
  return apiRequest<AdminUserDto>(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(values) });
}

export function revokeUserSessions(userId: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/users/${userId}/revoke-sessions`, { method: 'POST' });
}

export function resetUserMfa(userId: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/users/${userId}/reset-mfa`, { method: 'POST' });
}
