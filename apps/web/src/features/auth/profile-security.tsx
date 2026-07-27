'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Github } from 'lucide-react';
import { useState } from 'react';

import styles from './identity.module.css';

import { Button } from '@/components/ui/button';
import { changePassword, confirmMfa, disableMfa, getProfile, revokeOtherSessions, startMfaSetup, startOAuth, unlinkOAuth, updateProfile } from '@/services/auth-service';

export function ProfileSecurity() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const [name, setName] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', newPasswordConfirmation: '' });
  const [mfaCode, setMfaCode] = useState('');
  const [setup, setSetup] = useState<Awaited<ReturnType<typeof startMfaSetup>> | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const profile = profileQuery.data;
  const saveProfile = useMutation({ mutationFn: updateProfile, onSuccess: (data) => { queryClient.setQueryData(['profile'], data); setName(''); } });
  const changePasswordMutation = useMutation({ mutationFn: changePassword, onSuccess: () => setPasswords({ currentPassword: '', newPassword: '', newPasswordConfirmation: '' }) });
  const setupMutation = useMutation({ mutationFn: startMfaSetup, onSuccess: setSetup });
  const confirmMutation = useMutation({ mutationFn: confirmMfa, onSuccess: (data) => { setRecoveryCodes(data.recoveryCodes); void profileQuery.refetch(); } });
  const disableMutation = useMutation({ mutationFn: disableMfa, onSuccess: () => { setMfaCode(''); setSetup(null); setRecoveryCodes([]); void profileQuery.refetch(); } });
  const revokeMutation = useMutation({ mutationFn: revokeOtherSessions, onSuccess: () => void profileQuery.refetch() });
  const oauthMutation = useMutation({
    mutationFn: (provider: 'google' | 'github') => startOAuth(provider, 'link'),
    onSuccess: ({ authorizationUrl }) => { window.location.href = authorizationUrl; },
  });
  const unlinkMutation = useMutation({
    mutationFn: (provider: 'google' | 'github') => unlinkOAuth(provider),
    onSuccess: () => void profileQuery.refetch(),
  });

  if (profileQuery.isPending) return <p>Carregando perfil...</p>;
  if (profileQuery.isError || !profile) return <p className={styles.error}>Nao foi possivel carregar o perfil.</p>;

  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <h2>Dados pessoais</h2>
        <p>{profile.email} · {profile.role} · {profile.tenant.name}</p>
        <form className={styles.form} onSubmit={(event) => { event.preventDefault(); saveProfile.mutate({ name: name || profile.name }); }}>
          <label className={styles.field}>
            Nome
            <input value={name || profile.name} onChange={(event) => setName(event.target.value)} />
          </label>
          <Button type="submit" disabled={saveProfile.isPending}>Salvar nome</Button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Senha</h2>
        {changePasswordMutation.isSuccess ? <p className={styles.success}>Senha alterada. Sessoes anteriores foram revogadas.</p> : null}
        <form className={styles.grid} onSubmit={(event) => { event.preventDefault(); changePasswordMutation.mutate(passwords); }}>
          <label className={styles.field}>Senha atual<input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} /></label>
          <label className={styles.field}>Nova senha<input type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} /></label>
          <label className={styles.field}>Confirmar nova senha<input type="password" value={passwords.newPasswordConfirmation} onChange={(event) => setPasswords({ ...passwords, newPasswordConfirmation: event.target.value })} /></label>
          <Button type="submit" disabled={changePasswordMutation.isPending || passwords.newPassword !== passwords.newPasswordConfirmation}>Alterar senha</Button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Contas vinculadas</h2>
        <p>{profile.linkedProviders.length ? profile.linkedProviders.map((provider) => provider.provider).join(', ') : 'Nenhum provider vinculado.'}</p>
        {profile.linkedProviders.length ? (
          <div className={styles.actions}>
            {profile.linkedProviders.map((provider) => (
              <Button
                key={provider.provider}
                type="button"
                variant="secondary"
                disabled={unlinkMutation.isPending}
                onClick={() => unlinkMutation.mutate(provider.provider.toLowerCase() as 'google' | 'github')}
              >
                Desvincular {provider.provider}
              </Button>
            ))}
          </div>
        ) : null}
        <div className={styles.actions}>
          <Button type="button" variant="secondary" disabled={oauthMutation.isPending} onClick={() => oauthMutation.mutate('google')}>Vincular Google</Button>
          <Button type="button" variant="secondary" disabled={oauthMutation.isPending} onClick={() => oauthMutation.mutate('github')}><Github size={18} /> Vincular GitHub</Button>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>MFA/TOTP</h2>
        <p>Status: {profile.mfaEnabled ? 'ativo' : 'desativado'}</p>
        {!profile.mfaEnabled && !setup ? <Button type="button" onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}>Ativar MFA</Button> : null}
        {setup ? (
          <div className={styles.stack}>
            <img src={setup.qrCodeDataUrl} alt="QR Code para configurar MFA" width={192} height={192} />
            <p>Chave manual: <strong>{setup.manualKey}</strong></p>
            <form className={styles.actions} onSubmit={(event) => { event.preventDefault(); confirmMutation.mutate({ code: mfaCode }); }}>
              <input value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} placeholder="Codigo TOTP" />
              <Button type="submit" disabled={confirmMutation.isPending}>Confirmar MFA</Button>
            </form>
          </div>
        ) : null}
        {profile.mfaEnabled ? (
          <form className={styles.actions} onSubmit={(event) => { event.preventDefault(); disableMutation.mutate({ code: mfaCode }); }}>
            <input value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} placeholder="Codigo para desativar" />
            <Button type="submit" variant="secondary" disabled={disableMutation.isPending}>Desativar MFA</Button>
          </form>
        ) : null}
        {recoveryCodes.length ? <ul className={styles.codeList}>{recoveryCodes.map((code) => <li key={code}>{code}</li>)}</ul> : null}
      </section>

      <section className={styles.panel}>
        <h2>Sessoes</h2>
        <Button type="button" variant="secondary" onClick={() => revokeMutation.mutate()} disabled={revokeMutation.isPending}>Encerrar outras sessoes</Button>
        <ul>
          {profile.sessions.map((session) => (
            <li key={session.id}>{session.current ? 'Sessao atual' : 'Sessao'} · expira em {new Date(session.expiresAt).toLocaleString('pt-BR')}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
