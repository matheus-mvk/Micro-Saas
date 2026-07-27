'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Eye, EyeOff, Github } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import styles from './login-form.module.css';
import identityStyles from './identity.module.css';

import { Button } from '@/components/ui/button';
import { loginSchema, type LoginFormValues } from '@/schemas/login.schema';
import { authQueryKeys, getOAuthStatus, login, startOAuth, verifyMfaLogin } from '@/services/auth-service';
import { ApiClientError, ApiConnectionError } from '@/services/http-client';

export function LoginForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const nextPath = searchParams.get('next') ?? '/dashboard';
  const reason = searchParams.get('reason');
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const oauthStatus = useQuery({ queryKey: ['auth', 'oauth-status'], queryFn: getOAuthStatus, staleTime: 60_000 });
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      if ('mfaRequired' in session) {
        setChallengeToken(session.challengeToken);
        return;
      }
      if ('pendingApproval' in session) {
        return;
      }
      if ('incompleteRegistration' in session) {
        router.replace(`/completar-cadastro?token=${encodeURIComponent(session.completionToken)}` as never);
        return;
      }
      queryClient.setQueryData(authQueryKeys.me, { user: session.user });
      router.replace((nextPath.startsWith('/') ? nextPath : '/dashboard') as never);
    },
  });
  const mfaMutation = useMutation({
    mutationFn: verifyMfaLogin,
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKeys.me, { user: session.user });
      router.replace((nextPath.startsWith('/') ? nextPath : '/dashboard') as never);
    },
  });
  const oauthMutation = useMutation({
    mutationFn: (provider: 'google' | 'github') => startOAuth(provider, 'login'),
    onSuccess: ({ authorizationUrl }) => {
      window.location.href = authorizationUrl;
    },
  });

  function onSubmit(values: LoginFormValues): void {
    loginMutation.mutate(values);
  }

  function onMfaSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!challengeToken) return;
    mfaMutation.mutate({ challengeToken, code: mfaCode });
  }

  const apiError =
    loginMutation.error instanceof ApiClientError
      ? 'E-mail ou senha inválidos.'
      : loginMutation.error instanceof ApiConnectionError
        ? 'API indisponível. Confirme se o backend configurado em NEXT_PUBLIC_API_URL está respondendo.'
      : loginMutation.error
        ? 'Não foi possível entrar agora.'
        : null;
  const pendingApproval = loginMutation.data && 'pendingApproval' in loginMutation.data ? loginMutation.data.message : null;
  const googleConfigured = oauthStatus.data?.google.configured === true;
  const githubConfigured = oauthStatus.data?.github.configured === true;
  const oauthUnavailable =
    oauthStatus.isSuccess && (!googleConfigured || !githubConfigured)
      ? 'OAuth externo depende de credenciais configuradas no backend. Use e-mail e senha neste ambiente ou configure Google/GitHub.'
      : null;

  if (challengeToken) {
    return (
      <form className={styles.form} onSubmit={onMfaSubmit}>
        {mfaMutation.error ? <p role="alert">Código inválido ou expirado.</p> : null}
        <div>
          <label htmlFor="mfa-code">Código MFA</label>
          <input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value)}
            placeholder="123456"
          />
        </div>
        <Button type="submit" disabled={mfaMutation.isPending || mfaCode.length < 6}>
          {mfaMutation.isPending ? 'Validando' : 'Validar MFA'} <ArrowRight size={18} aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" onClick={() => setChallengeToken(null)}>
          Voltar ao login
        </Button>
      </form>
    );
  }

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      {reason === 'session-expired' ? (
        <p className={styles.notice}>Sua sessão expirou. Entre novamente para continuar.</p>
      ) : null}
      {reason === 'logout' ? <p className={styles.notice}>Sessão encerrada com segurança.</p> : null}
      {reason === 'pending-approval' ? <p className={styles.notice}>Aguardando aprovação do Administrador.</p> : null}
      {pendingApproval ? <p className={styles.notice}>{pendingApproval}</p> : null}
      {oauthUnavailable ? <p className={styles.notice}>{oauthUnavailable}</p> : null}
      {apiError ? <p role="alert">{apiError}</p> : null}
      <div>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email ? (
          <p id="email-error" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="password">Senha</label>
        <div className={identityStyles.actions}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-describedby={errors.password ? 'password-error' : undefined}
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          <Button type="button" variant="secondary" aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'} onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </Button>
        </div>
        {errors.password ? (
          <p id="password-error" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={loginMutation.isPending} aria-busy={loginMutation.isPending}>
        {loginMutation.isPending ? 'Entrando' : 'Entrar'} <ArrowRight size={18} aria-hidden="true" />
      </Button>
      <div className={identityStyles.actions}>
        <Button type="button" variant="secondary" disabled={oauthMutation.isPending || oauthStatus.isPending || !googleConfigured} onClick={() => oauthMutation.mutate('google')}>
          Continuar com Google
        </Button>
        <Button type="button" variant="secondary" disabled={oauthMutation.isPending || oauthStatus.isPending || !githubConfigured} onClick={() => oauthMutation.mutate('github')}>
          <Github size={18} aria-hidden="true" /> Continuar com GitHub
        </Button>
      </div>
      <div className={identityStyles.linkRow}>
        <Link href={'/register' as never}>Criar conta</Link>
        <Link href={'/forgot-password' as never}>Esqueci minha senha</Link>
      </div>
    </form>
  );
}
