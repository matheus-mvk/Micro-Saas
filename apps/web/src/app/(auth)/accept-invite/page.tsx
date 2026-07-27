import Link from 'next/link';
import { Suspense } from 'react';

import styles from '../login/page.module.css';

import { AcceptInviteForm } from '@/features/auth/accept-invite-form';

export default function AcceptInvitePage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <Link href="/" className={styles.brand}>
          <span>NF</span>
          <strong>Nexora Freight</strong>
        </Link>
        <div>
          <p className={styles.eyebrow}>Convite</p>
          <h1>Aceitar convite</h1>
          <p>Complete seu acesso ao tenant correto sem criar outra organizacao.</p>
        </div>
        <Suspense fallback={null}>
          <AcceptInviteForm />
        </Suspense>
      </section>
    </main>
  );
}
