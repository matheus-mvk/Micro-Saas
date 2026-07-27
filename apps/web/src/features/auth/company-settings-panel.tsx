'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import styles from './identity.module.css';

import { authQueryKeys, getCurrentSession, getOnboarding } from '@/services/auth-service';

export function CompanySettingsPanel() {
  const session = useQuery({ queryKey: authQueryKeys.me, queryFn: getCurrentSession, retry: false });
  const onboarding = useQuery({ queryKey: ['onboarding'], queryFn: getOnboarding, retry: false });

  if (session.isPending || onboarding.isPending) return <p>Carregando empresa...</p>;
  if (session.isError || !session.data) return <p className={styles.error}>Nao foi possivel carregar os dados da empresa.</p>;

  const tenant = session.data.user.tenant;
  const onboardingData = onboarding.data;

  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <h2>Empresa</h2>
        <p>Dados principais do tenant ativo nesta sessao.</p>
        <dl className={styles.detailList}>
          <div>
            <dt>Nome</dt>
            <dd>{tenant.name}</dd>
          </div>
          <div>
            <dt>Identificador</dt>
            <dd>{tenant.slug}</dd>
          </div>
          <div>
            <dt>ID do tenant</dt>
            <dd>{tenant.id}</dd>
          </div>
          <div>
            <dt>Onboarding</dt>
            <dd>{onboardingData?.completed ? 'Concluido' : 'Pendente'}</dd>
          </div>
        </dl>
        <div className={styles.actions}>
          <Link className={styles.actionLink} href="/branches">Ver filiais</Link>
          <Link className={styles.actionLinkSecondary} href="/onboarding">Revisar onboarding</Link>
        </div>
      </section>
    </div>
  );
}
