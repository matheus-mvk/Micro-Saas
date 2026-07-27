import Link from 'next/link';
import { Suspense } from 'react';

import styles from '../login/page.module.css';

import { CompleteRegistrationForm } from '@/features/auth/complete-registration-form';

export default function CompleteRegistrationPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <Link href="/" className={styles.brand}>
          <span>NF</span>
          <strong>Nexora Freight</strong>
        </Link>
        <div>
          <p className={styles.eyebrow}>Cadastro B2B</p>
          <h1>Completar cadastro</h1>
          <p>Selecione a empresa para solicitar aprovação de acesso.</p>
        </div>
        <Suspense fallback={null}>
          <CompleteRegistrationForm />
        </Suspense>
      </section>
    </main>
  );
}
