'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import styles from './identity.module.css';

import { Button } from '@/components/ui/button';
import { getOnboarding, updateOnboarding } from '@/services/auth-service';

export function OnboardingPanel() {
  const query = useQuery({ queryKey: ['onboarding'], queryFn: getOnboarding });
  const mutation = useMutation({ mutationFn: updateOnboarding, onSuccess: () => void query.refetch() });

  if (query.isPending) return <p>Carregando onboarding...</p>;
  if (query.isError || !query.data) return <p className={styles.error}>Nao foi possivel carregar o onboarding.</p>;

  const onboarding = query.data;
  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <h2>Configuracao inicial</h2>
        <p>Complete o essencial agora ou continue depois pelo menu de configuracoes.</p>
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
