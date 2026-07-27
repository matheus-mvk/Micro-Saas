'use client';

import { UserRole, UserStatus } from '@logistics/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import styles from '@/features/auth/identity.module.css';
import { Button } from '@/components/ui/button';
import { createUser, inviteUser, listUsers, resetUserMfa, revokeUserSessions, updateUser } from '@/services/users-service';

export function UserManagement() {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ email: '', name: '', password: '', role: UserRole.OPERATOR });
  const [feedback, setFeedback] = useState<string | null>(null);
  const params = new URLSearchParams({ page: '1', perPage: '20' });
  if (search.trim()) params.set('search', search.trim());
  const query = useQuery({ queryKey: ['users', search], queryFn: () => listUsers(params) });
  const createMutation = useMutation({ mutationFn: createUser, onSuccess: async () => { setFeedback('Usuario criado com sucesso.'); await query.refetch(); } });
  const inviteMutation = useMutation({ mutationFn: inviteUser, onSuccess: async () => { setFeedback('Convite enviado.'); await query.refetch(); } });
  const actionMutation = useMutation<{ ok: true } | unknown, Error, { id: string; action: 'disable' | 'enable' | 'sessions' | 'mfa' }>({ mutationFn: ({ id, action }) => {
    if (action === 'sessions') return revokeUserSessions(id);
    if (action === 'mfa') return resetUserMfa(id);
    return updateUser(id, { status: action === 'enable' ? UserStatus.ACTIVE : UserStatus.DISABLED });
  }, onSuccess: async () => { setFeedback('Operacao de acesso atualizada.'); await query.refetch(); } });

  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <h2>Novo usuario</h2>
        {feedback ? <p className={styles.success} role="status">{feedback}</p> : null}
        {createMutation.error || inviteMutation.error || actionMutation.error ? <p className={styles.error} role="alert">Nao foi possivel concluir a operacao de usuario.</p> : null}
        <form className={styles.grid} onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate({
            email: form.email,
            name: form.name,
            role: form.role,
            ...(form.password ? { password: form.password } : {}),
          });
        }}>
          <label className={styles.field}>Nome<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className={styles.field}>E-mail<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className={styles.field}>Perfil<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}><option value={UserRole.OPERATOR}>OPERATOR</option><option value={UserRole.MANAGER}>MANAGER</option><option value={UserRole.ADMIN}>ADMIN</option></select></label>
          <label className={styles.field}>Senha temporaria opcional<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <div className={styles.actions}>
            <Button type="submit" disabled={createMutation.isPending || inviteMutation.isPending}>Criar usuario</Button>
            <Button type="button" variant="secondary" disabled={inviteMutation.isPending || !form.email} onClick={() => inviteMutation.mutate({ email: form.email, role: form.role })}>Enviar convite</Button>
          </div>
        </form>
        {inviteMutation.data?.devInviteUrl ? <p className={styles.notice}>Ambiente local: <a href={inviteMutation.data.devInviteUrl}>abrir convite</a>.</p> : null}
      </section>

      <section className={styles.panel}>
        <h2>Usuarios do tenant</h2>
        <label className={styles.field}>Buscar<input value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        {query.isPending ? <p>Carregando usuarios...</p> : null}
        {query.isError ? <p className={styles.error}>Nao foi possivel carregar usuarios.</p> : null}
        {query.data?.data.length === 0 ? <p>Nenhum usuario encontrado.</p> : null}
        <div className={styles.stack}>
          {query.data?.data.map((user) => (
            <article className={styles.panel} key={user.id}>
              <strong>{user.name}</strong>
              <span>{user.email} · {user.role} · {user.status} · MFA {user.mfaEnabled ? 'ativo' : 'inativo'}</span>
              <span>Providers: {user.providers.length ? user.providers.map((provider) => provider.provider).join(', ') : 'senha/e-mail'}</span>
              <div className={styles.actions}>
                <Button type="button" variant="secondary" onClick={() => actionMutation.mutate({ id: user.id, action: user.status === UserStatus.ACTIVE ? 'disable' : 'enable' })}>{user.status === UserStatus.ACTIVE ? 'Desativar' : 'Ativar'}</Button>
                <Button type="button" variant="secondary" onClick={() => actionMutation.mutate({ id: user.id, action: 'sessions' })}>Revogar sessoes</Button>
                <Button type="button" variant="secondary" onClick={() => actionMutation.mutate({ id: user.id, action: 'mfa' })}>Resetar MFA</Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
