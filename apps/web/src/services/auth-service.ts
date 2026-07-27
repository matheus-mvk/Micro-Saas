import type {
  AuthResponseDto,
  ChangePasswordDto,
  CompleteOAuthRegistrationDto,
  ConfirmMfaDto,
  ConfirmMfaResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  MeResponseDto,
  MfaSetupDto,
  OAuthStatusDto,
  ProfileDto,
  RegisterTenantDto,
  ResetPasswordDto,
  TenantOnboardingDto,
  TenantOptionDto,
  UpdateOnboardingDto,
  UpdateProfileDto,
  VerifyMfaLoginDto,
} from '@logistics/shared';

import { apiRequest } from './http-client';

import type { LoginFormValues } from '@/schemas/login.schema';

export const authQueryKeys = {
  me: ['auth', 'me'] as const,
};

export function login(values: LoginFormValues): Promise<LoginResponseDto> {
  return apiRequest<LoginResponseDto>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export function registerTenant(values: RegisterTenantDto): Promise<AuthResponseDto> {
  return apiRequest<AuthResponseDto>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export function verifyMfaLogin(values: VerifyMfaLoginDto): Promise<AuthResponseDto> {
  return apiRequest<AuthResponseDto>('/auth/mfa/verify-login', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export function getCurrentSession(): Promise<MeResponseDto> {
  return apiRequest<MeResponseDto>('/auth/me');
}

export function logout(): Promise<LogoutResponseDto> {
  return apiRequest<LogoutResponseDto>('/auth/logout', {
    method: 'POST',
  });
}

export function forgotPassword(values: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
  return apiRequest<ForgotPasswordResponseDto>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export function resetPassword(values: ResetPasswordDto): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export function listTenantOptions(search = ''): Promise<TenantOptionDto[]> {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  return apiRequest<TenantOptionDto[]>(`/auth/tenants?${params.toString()}`);
}

export function completeOAuthRegistration(values: CompleteOAuthRegistrationDto): Promise<{ ok: true; pendingApproval: true }> {
  return apiRequest<{ ok: true; pendingApproval: true }>('/auth/oauth/complete-registration', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export function getOAuthStatus(): Promise<OAuthStatusDto> {
  return apiRequest<OAuthStatusDto>('/auth/oauth/status');
}

export function getProfile(): Promise<ProfileDto> {
  return apiRequest<ProfileDto>('/auth/profile');
}

export function updateProfile(values: UpdateProfileDto): Promise<ProfileDto> {
  return apiRequest<ProfileDto>('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
}

export function changePassword(values: ChangePasswordDto): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>('/auth/profile/change-password', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export function startMfaSetup(): Promise<MfaSetupDto> {
  return apiRequest<MfaSetupDto>('/auth/mfa/setup', { method: 'POST' });
}

export function confirmMfa(values: ConfirmMfaDto): Promise<ConfirmMfaResponseDto> {
  return apiRequest<ConfirmMfaResponseDto>('/auth/mfa/confirm', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export function disableMfa(values: ConfirmMfaDto): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>('/auth/mfa/disable', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export function revokeOtherSessions(): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>('/auth/sessions/revoke-others', { method: 'POST' });
}

export function getOnboarding(): Promise<TenantOnboardingDto> {
  return apiRequest<TenantOnboardingDto>('/auth/onboarding');
}

export function updateOnboarding(values: UpdateOnboardingDto): Promise<TenantOnboardingDto> {
  return apiRequest<TenantOnboardingDto>('/auth/onboarding', {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
}

export function startOAuth(provider: 'google' | 'github', mode: 'login' | 'register' | 'link', companyName?: string): Promise<{ authorizationUrl: string }> {
  const params = new URLSearchParams({ mode });
  if (companyName) params.set('companyName', companyName);
  const path = mode === 'link' ? `/auth/profile/oauth/${provider}/start` : `/auth/oauth/${provider}/start`;
  return apiRequest<{ authorizationUrl: string }>(`${path}?${params.toString()}`);
}

export function unlinkOAuth(provider: 'google' | 'github'): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/auth/profile/oauth/${provider}/unlink`, { method: 'POST' });
}
