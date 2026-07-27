import styles from '../../dashboard/page.module.css';

import { FreightHistory } from '@/features/freight/freight-history';

export default function FreightHistoryPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <span>Operação</span>
        <span>Histórico</span>
      </nav>
      <header className={styles.title}>
        <div>
          <p>Consulta de resultados salvos</p>
          <h1>Histórico de simulações</h1>
        </div>
      </header>
      <FreightHistory />
    </div>
  );
}
