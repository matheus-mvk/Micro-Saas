import Link from 'next/link';

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
          <p>Area preparada para autenticacao com senha, OAuth, MFA e sessoes auditaveis.</p>
        </div>
        <LoginForm />
      </section>
      <section className={styles.preview}>
        <PlatformPreview />
      </section>
    </main>
  );
}
