import Link from 'next/link';

import styles from '../login/page.module.css';

import { PlatformPreview } from '@/components/shared/platform-preview';
import { RegisterForm } from '@/features/auth/register-form';

export default function RegisterPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <Link href="/" className={styles.brand}>
          <span>NF</span>
          <strong>Nexora Freight</strong>
        </Link>
        <div>
          <p className={styles.eyebrow}>Nova organização</p>
          <h1>Criar conta</h1>
          <p>Crie sua empresa por e-mail ou registre-se com OAuth para solicitar aprovação B2B.</p>
        </div>
        <RegisterForm />
        <Link href="/login">Já tenho conta</Link>
      </section>
      <section className={styles.preview}>
        <PlatformPreview />
      </section>
    </main>
  );
}
