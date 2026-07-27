import Link from 'next/link';
import { Suspense } from 'react';

import styles from './page.module.css';

import { PlatformPreview } from '@/components/shared/platform-preview';
import { LoginForm } from '@/features/auth/login-form';

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <Link href="/" className={styles.brand}>
          <span>NF</span>
          <strong>Nexora Freight</strong>
        </Link>
        <div>
          <p className={styles.eyebrow}>Acesso administrativo</p>
          <h1>Entrar</h1>
          <p>Acesse sua operacao logistica com uma sessao segura e auditavel.</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </section>
      <section className={styles.preview}>
        <PlatformPreview />
      </section>
    </main>
  );
}
