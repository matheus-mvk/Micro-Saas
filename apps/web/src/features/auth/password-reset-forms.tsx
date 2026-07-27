'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import styles from './identity.module.css';

import { Button } from '@/components/ui/button';
import { forgotPassword, resetPassword } from '@/services/auth-service';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (result) => setDevUrl(result.devResetUrl ?? null),
  });

  return (
    <form className={styles.form} onSubmit={(event) => { event.preventDefault(); mutation.mutate({ email }); }}>
      {mutation.isSuccess ? <p className={styles.success}>Se existir uma conta para este e-mail, enviaremos instrucoes de recuperacao.</p> : null}
      {mutation.error ? <p className={styles.error} role="alert">Nao foi possivel processar a solicitacao agora.</p> : null}
      {devUrl ? <p className={styles.notice}>Ambiente local: <a href={devUrl}>abrir link de redefinicao</a>.</p> : null}
      <label className={styles.field}>
        E-mail
        <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Enviando' : 'Enviar instrucoes'}</Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => router.replace('/login?reason=password-reset' as never),
  });

  return (
    <form className={styles.form} onSubmit={(event) => { event.preventDefault(); mutation.mutate({ password, passwordConfirmation, token }); }}>
      {mutation.error ? <p className={styles.error}>Link invalido, expirado ou senha fora do padrao.</p> : null}
      <label className={styles.field}>
        Nova senha
        <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <label className={styles.field}>
        Confirmar nova senha
        <input type="password" required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} />
      </label>
      <Button type="submit" disabled={!token || mutation.isPending || password !== passwordConfirmation}>{mutation.isPending ? 'Salvando' : 'Redefinir senha'}</Button>
    </form>
  );
}
