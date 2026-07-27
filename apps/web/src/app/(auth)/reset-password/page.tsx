import Link from 'next/link';
import { Suspense } from 'react';

import styles from '../login/page.module.css';

import { ResetPasswordForm } from '@/features/auth/password-reset-forms';

export default function ResetPasswordPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <Link href="/" className={styles.brand}>
          <span>NF</span>
          <strong>Nexora Freight</strong>
        </Link>
        <div>
          <p className={styles.eyebrow}>Nova senha</p>
          <h1>Redefinir senha</h1>
          <p>Crie uma nova senha forte para invalidar sessoes anteriores.</p>
        </div>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
