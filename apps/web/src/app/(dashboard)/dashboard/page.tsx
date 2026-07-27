import styles from './page.module.css';

import { DashboardSummary } from '@/features/dashboard/dashboard-summary';

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <span>Operacao</span>
        <span>Dashboard</span>
      </nav>
      <header className={styles.title}>
        <div>
          <p>Operacao autenticada</p>
          <h1>Dashboard</h1>
        </div>
      </header>
      <DashboardSummary />
    </div>
  );
}
