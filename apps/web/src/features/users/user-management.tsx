'use client';

import { UserRole, UserStatus } from '@logistics/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import styles from '@/features/auth/identity.module.css';
import { Button } from '@/components/ui/button';
import { authQueryKeys, getCurrentSession } from '@/services/auth-service';
import { approveUser, createUser, inviteUser, listUsers, resetUserMfa, revokeUserSessions, updateUser } from '@/services/users-service';

export function UserManagement() {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ email: '', name: '', password: '', role: UserRole.OPERATOR });
  const [feedback, setFeedback] = useState<string | null>(null);
  const params = new URLSearchParams({ page: '1', perPage: '20' });
  if (search.trim()) params.set('search', search.trim());
  const session = useQuery({ queryKey: authQueryKeys.me, queryFn: getCurrentSession, retry: false });
  const isAdmin = session.data?.user.role === UserRole.ADMIN;
  const query = useQuery({ queryKey: ['users', search], queryFn: () => listUsers(params) });
  const createMutation = useMutation({ mutationFn: createUser, onSuccess: async () => { setFeedback('Usuário criado com sucesso.'); await query.refetch(); } });
  const inviteMutation = useMutation({ mutationFn: inviteUser, onSuccess: async () => { setFeedback('Convite enviado.'); await query.refetch(); } });
  const actionMutation = useMutation<{ ok: true } | unknown, Error, { id: string; action: 'approve' | 'disable' | 'enable' | 'sessions' | 'mfa'; role?: UserRole }>({ mutationFn: ({ id, action, role }) => {
    if (action === 'approve') return approveUser(id, { role: role ?? UserRole.OPERATOR });
    if (action === 'sessions') return revokeUserSessions(id);
    if (action === 'mfa') return resetUserMfa(id);
    return updateUser(id, { status: action === 'enable' ? UserStatus.ACTIVE : UserStatus.DISABLED });
  }, onSuccess: async () => { setFeedback('Operação de acesso atualizada.'); await query.refetch(); } });

  return (
    <div className={styles.stack}>
      {isAdmin ? <section className={styles.panel}>
        <h2>Novo usuário</h2>
        {feedback ? <p className={styles.success} role="status">{feedback}</p> : null}
        {createMutation.error || inviteMutation.error || actionMutation.error ? <p className={styles.error} role="alert">Não foi possível concluir a operação de usuário.</p> : null}
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
          <label className={styles.field}>Senha temporária opcional<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <div className={styles.actions}>
            <Button type="submit" disabled={createMutation.isPending || inviteMutation.isPending}>Criar usuário</Button>
            <Button type="button" variant="secondary" disabled={inviteMutation.isPending || !form.email} onClick={() => inviteMutation.mutate({ email: form.email, role: form.role })}>Enviar convite</Button>
          </div>
        </form>
        {inviteMutation.data?.devInviteUrl ? <p className={styles.notice}>Ambiente local: <a href={inviteMutation.data.devInviteUrl}>abrir convite</a>.</p> : null}
      </section> : <section className={styles.panel}><h2>Controle de acesso</h2><p className={styles.notice}>Seu perfil permite consultar usuários do tenant, mas ações administrativas são restritas ao ADMIN.</p>{actionMutation.error ? <p className={styles.error} role="alert">Não foi possível concluir a operação de usuário.</p> : null}</section>}

      <section className={styles.panel}>
        <h2>Usuários do tenant</h2>
        <label className={styles.field}>Buscar<input value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        {query.isPending ? <p>Carregando usuários...</p> : null}
        {query.isError ? <p className={styles.error}>Não foi possível carregar usuários.</p> : null}
        {query.data?.data.length === 0 ? <p>Nenhum usuário encontrado.</p> : null}
        <div className={styles.stack}>
          {query.data?.data.map((user) => (
            <article className={styles.panel} key={user.id}>
              <strong>{user.name}</strong>
              <span>{user.email} · {user.role} · {user.status} · MFA {user.mfaEnabled ? 'ativo' : 'inativo'}</span>
              <span>Providers: {user.providers.length ? user.providers.map((provider) => provider.provider).join(', ') : 'senha/e-mail'}</span>
              {isAdmin ? <div className={styles.actions}>
                {user.status === UserStatus.PENDING || user.status === UserStatus.INVITED ? (
                  <Button type="button" onClick={() => actionMutation.mutate({ id: user.id, action: 'approve', role: user.role })}>Aprovar</Button>
                ) : (
                  <>
                    <Button type="button" variant="secondary" onClick={() => actionMutation.mutate({ id: user.id, action: user.status === UserStatus.ACTIVE ? 'disable' : 'enable' })}>{user.status === UserStatus.ACTIVE ? 'Desativar' : 'Ativar'}</Button>
                    <Button type="button" variant="secondary" onClick={() => actionMutation.mutate({ id: user.id, action: 'sessions' })}>Revogar sessões</Button>
                    <Button type="button" variant="secondary" onClick={() => actionMutation.mutate({ id: user.id, action: 'mfa' })}>Resetar MFA</Button>
                  </>
                )}
              </div> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
