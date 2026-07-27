'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import styles from './identity.module.css';

import { Button } from '@/components/ui/button';
import { authQueryKeys } from '@/services/auth-service';
import { acceptInvite } from '@/services/users-service';

export function AcceptInviteForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const mutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKeys.me, { user: session.user });
      router.replace('/dashboard' as never);
    },
  });

  return (
    <form className={styles.form} onSubmit={(event) => { event.preventDefault(); mutation.mutate({ name, password, passwordConfirmation, token }); }}>
      {mutation.error ? <p className={styles.error}>Convite invalido, expirado ou dados incompletos.</p> : null}
      <label className={styles.field}>
        Nome completo
        <input required value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className={styles.field}>
        Senha
        <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <label className={styles.field}>
        Confirmar senha
        <input type="password" required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} />
      </label>
      <Button type="submit" disabled={!token || mutation.isPending || password !== passwordConfirmation}>
        {mutation.isPending ? 'Aceitando' : 'Aceitar convite'}
      </Button>
    </form>
  );
}
