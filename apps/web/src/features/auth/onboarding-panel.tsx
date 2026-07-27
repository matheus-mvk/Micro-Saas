'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import styles from './identity.module.css';

import { Button } from '@/components/ui/button';
import { getOnboarding, updateOnboarding } from '@/services/auth-service';

export function OnboardingPanel() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['onboarding'], queryFn: getOnboarding });
  const mutation = useMutation({
    mutationFn: updateOnboarding,
    onSuccess: async (updated, variables) => {
      await query.refetch();
      if (variables.completed || updated.completed) {
        router.replace('/dashboard');
        return;
      }
      setNotice('Onboarding salvo. Voce pode continuar a configuracao depois.');
    },
  });

  if (query.isPending) return <p>Carregando onboarding...</p>;
  if (query.isError || !query.data) return <p className={styles.error}>Nao foi possivel carregar o onboarding.</p>;

  const onboarding = query.data;
  if (onboarding.completed) {
    return (
      <div className={styles.stack}>
        <section className={styles.panel}>
          <h2>Onboarding concluido</h2>
          <p className={styles.success}>A configuracao inicial deste tenant ja foi concluida.</p>
          <div className={styles.actions}>
            <Link className={styles.actionLink} href="/dashboard">Ir para o dashboard</Link>
            <Link className={styles.actionLinkSecondary} href={'/settings/company' as never}>Ver empresa</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <h2>Configuracao inicial</h2>
        <p>Complete o essencial agora ou continue depois pelo menu de configuracoes.</p>
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
        {mutation.isError ? <p className={styles.error} role="alert">Nao foi possivel salvar o onboarding agora.</p> : null}
        <label className={styles.check}><input type="checkbox" checked={onboarding.companyDone} onChange={(event) => mutation.mutate({ companyDone: event.target.checked, currentStep: 'branch' })} /> Dados da empresa confirmados</label>
        <label className={styles.check}><input type="checkbox" checked={onboarding.branchDone} onChange={(event) => mutation.mutate({ branchDone: event.target.checked, currentStep: 'invite' })} /> Filial principal revisada</label>
        <label className={styles.check}><input type="checkbox" checked={onboarding.inviteDone} onChange={(event) => mutation.mutate({ inviteDone: event.target.checked })} /> Convites iniciais revisados</label>
        <div className={styles.actions}>
          <Button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ completed: true, currentStep: 'done' })}>Concluir onboarding</Button>
          <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate({ currentStep: 'later' })}>Continuar depois</Button>
        </div>
      </section>
    </div>
  );
}
