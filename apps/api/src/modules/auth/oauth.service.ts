import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { OAuthProvider } from '@prisma/client';

import { AppConfigService } from '../../config/app-config.service';

export interface OAuthIdentity {
  email: string;
  emailVerified: boolean;
  name: string;
  provider: OAuthProvider;
  providerUserId: string;
}

@Injectable()
export class OAuthService {
  constructor(private readonly config: AppConfigService) {}

  status(): { github: { configured: boolean; provider: 'github' }; google: { configured: boolean; provider: 'google' } } {
    return {
      github: { configured: Boolean(this.config.githubClientId && this.config.githubClientSecret), provider: 'github' },
      google: { configured: Boolean(this.config.googleClientId && this.config.googleClientSecret), provider: 'google' },
    };
  }

  authorizationUrl(provider: OAuthProvider, state: string): string {
    const callbackUrl = this.callbackUrl(provider);

    if (provider === OAuthProvider.GOOGLE) {
      if (!this.config.googleClientId || !this.config.googleClientSecret) {
        throw new ServiceUnavailableException('Google OAuth is not configured.');
      }

      const params = new URLSearchParams({
        client_id: this.config.googleClientId,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: 'openid email profile',
        state,
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    if (!this.config.githubClientId || !this.config.githubClientSecret) {
      throw new ServiceUnavailableException('GitHub OAuth is not configured.');
    }

    const params = new URLSearchParams({
      client_id: this.config.githubClientId,
      redirect_uri: callbackUrl,
      scope: 'read:user user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchange(provider: OAuthProvider, code: string): Promise<OAuthIdentity> {
    return provider === OAuthProvider.GOOGLE ? this.exchangeGoogle(code) : this.exchangeGitHub(code);
  }

  private callbackUrl(provider: OAuthProvider): string {
    const path = provider === OAuthProvider.GOOGLE ? 'google' : 'github';
    return `${this.config.apiPublicUrl}/auth/oauth/${path}/callback`;
  }

  private async exchangeGoogle(code: string): Promise<OAuthIdentity> {
    if (!this.config.googleClientId || !this.config.googleClientSecret) {
      throw new ServiceUnavailableException('Google OAuth is not configured.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.googleClientId,
        client_secret: this.config.googleClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.callbackUrl(OAuthProvider.GOOGLE),
      }),
    });

    const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new BadRequestException('Google OAuth callback is invalid.');
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { authorization: `Bearer ${tokenPayload.access_token}` },
    });
    const profile = (await profileResponse.json()) as {
      email?: string;
      hd?: string;
      id?: string;
      name?: string;
      verified_email?: boolean;
    };

    if (!profileResponse.ok || !profile.id || !profile.email || profile.verified_email !== true) {
      throw new BadRequestException('Google account does not expose a verified e-mail.');
    }

    return {
      email: profile.email.trim().toLowerCase(),
      emailVerified: true,
      name: profile.name ?? profile.email,
      provider: OAuthProvider.GOOGLE,
      providerUserId: profile.id,
    };
  }

  private async exchangeGitHub(code: string): Promise<OAuthIdentity> {
    if (!this.config.githubClientId || !this.config.githubClientSecret) {
      throw new ServiceUnavailableException('GitHub OAuth is not configured.');
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.githubClientId,
        client_secret: this.config.githubClientSecret,
        code,
        redirect_uri: this.callbackUrl(OAuthProvider.GITHUB),
      }),
    });

    const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new BadRequestException('GitHub OAuth callback is invalid.');
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${tokenPayload.access_token}` },
    });
    const user = (await userResponse.json()) as { email?: string | null; id?: number; name?: string | null; login?: string };

    if (!userResponse.ok || user.id === undefined) {
      throw new BadRequestException('GitHub OAuth profile is invalid.');
    }

    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${tokenPayload.access_token}` },
    });
    const emails = (await emailsResponse.json()) as Array<{ email?: string; primary?: boolean; verified?: boolean }>;
    const verifiedEmail =
      emails.find((item) => item.primary === true && item.verified === true && item.email)?.email ??
      emails.find((item) => item.verified === true && item.email)?.email ??
      (typeof user.email === 'string' ? user.email : undefined);

    if (!emailsResponse.ok || !verifiedEmail) {
      throw new BadRequestException('GitHub account does not expose a verified e-mail.');
    }

    return {
      email: verifiedEmail.trim().toLowerCase(),
      emailVerified: true,
      name: user.name ?? user.login ?? verifiedEmail,
      provider: OAuthProvider.GITHUB,
      providerUserId: String(user.id),
    };
  }
}
