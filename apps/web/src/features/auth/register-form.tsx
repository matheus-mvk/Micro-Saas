'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import styles from './identity.module.css';

import { Button } from '@/components/ui/button';
import { authQueryKeys, getOAuthStatus, registerTenant, startOAuth } from '@/services/auth-service';
import { ApiClientError } from '@/services/http-client';

export function RegisterForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    acceptedPrivacy: false,
    acceptedTerms: false,
    companyName: '',
    email: '',
    name: '',
    password: '',
    passwordConfirmation: '',
  });
  const registerMutation = useMutation({
    mutationFn: registerTenant,
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKeys.me, { user: session.user });
      router.replace('/onboarding' as never);
    },
  });
  const oauthMutation = useMutation({
    mutationFn: (provider: 'google' | 'github') => startOAuth(provider, 'register'),
    onSuccess: ({ authorizationUrl }) => {
      window.location.href = authorizationUrl;
    },
  });
  const oauthStatus = useQuery({ queryKey: ['auth', 'oauth-status'], queryFn: getOAuthStatus, staleTime: 60_000 });
  const canSubmit = form.acceptedTerms && form.acceptedPrivacy && form.password === form.passwordConfirmation && form.password.length >= 10;
  const googleConfigured = oauthStatus.data?.google.configured === true;
  const githubConfigured = oauthStatus.data?.github.configured === true;
  const oauthUnavailable =
    oauthStatus.isSuccess && (!googleConfigured || !githubConfigured)
      ? 'Cadastro com OAuth depende das credenciais Google/GitHub configuradas no backend.'
      : null;
  const error =
    registerMutation.error instanceof ApiClientError
      ? registerMutation.error.response.message
      : registerMutation.error
        ? 'Não foi possível criar a conta.'
        : null;

  return (
    <div className={styles.stack}>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {oauthMutation.error ? <p className={styles.error} role="alert">Não foi possível iniciar o cadastro com este provedor.</p> : null}
      {oauthUnavailable ? <p className={styles.notice}>{oauthUnavailable}</p> : null}
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          registerMutation.mutate({ ...form, email: form.email.trim().toLowerCase() });
        }}
      >
        <label className={styles.field}>
          Nome completo
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" />
        </label>
        <label className={styles.field}>
          Empresa
          <input required value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} autoComplete="organization" />
        </label>
        <label className={styles.field}>
          E-mail
          <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" />
        </label>
        <label className={styles.field}>
          Senha
          <div className={styles.actions}>
            <input required type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" />
            <Button type="button" variant="secondary" aria-label="Exibir ou ocultar senha" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
        </label>
        <label className={styles.field}>
          Confirmar senha
          <input required type={showPassword ? 'text' : 'password'} value={form.passwordConfirmation} onChange={(event) => setForm({ ...form, passwordConfirmation: event.target.value })} autoComplete="new-password" />
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={form.acceptedTerms} onChange={(event) => setForm({ ...form, acceptedTerms: event.target.checked })} />
          Aceito os termos de uso.
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={form.acceptedPrivacy} onChange={(event) => setForm({ ...form, acceptedPrivacy: event.target.checked })} />
          Aceito a política de privacidade.
        </label>
        <Button type="submit" disabled={!canSubmit || registerMutation.isPending}>
          {registerMutation.isPending ? 'Criando conta' : 'Criar conta'}
        </Button>
      </form>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" disabled={oauthMutation.isPending || oauthStatus.isPending || !googleConfigured} onClick={() => oauthMutation.mutate('google')}>
          Registrar com Google
        </Button>
        <Button type="button" variant="secondary" disabled={oauthMutation.isPending || oauthStatus.isPending || !githubConfigured} onClick={() => oauthMutation.mutate('github')}>
          <Github size={18} /> Registrar com GitHub
        </Button>
      </div>
    </div>
  );
}
