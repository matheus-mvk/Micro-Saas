import styles from '../../dashboard/page.module.css';

import { FreightSimulationWorkspace } from '@/features/freight/freight-simulation-workspace';

export default function FreightSimulationPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <span>Operação</span>
        <span>Simulação de frete</span>
      </nav>
      <header className={styles.title}>
        <div>
          <p>Comparação com regras persistidas</p>
          <h1>Simulação de frete</h1>
        </div>
      </header>
      <FreightSimulationWorkspace />
    </div>
  );
}
