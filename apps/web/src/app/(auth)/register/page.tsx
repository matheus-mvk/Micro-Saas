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
          <p className={styles.eyebrow}>Nova organizacao</p>
          <h1>Criar conta</h1>
          <p>Crie sua empresa e entre como administrador do tenant com uma sessao segura.</p>
        </div>
        <RegisterForm />
        <Link href="/login">Ja tenho conta</Link>
      </section>
      <section className={styles.preview}>
        <PlatformPreview />
      </section>
    </main>
  );
}
