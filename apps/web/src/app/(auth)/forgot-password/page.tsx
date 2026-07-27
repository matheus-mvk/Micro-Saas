import Link from 'next/link';

import styles from '../login/page.module.css';

import { ForgotPasswordForm } from '@/features/auth/password-reset-forms';

export default function ForgotPasswordPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <Link href="/" className={styles.brand}>
          <span>NF</span>
          <strong>Nexora Freight</strong>
        </Link>
        <div>
          <p className={styles.eyebrow}>Recuperacao</p>
          <h1>Esqueci minha senha</h1>
          <p>Informe seu e-mail. A resposta nao revela se a conta existe.</p>
        </div>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
