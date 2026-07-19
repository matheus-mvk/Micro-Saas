import styles from './page.module.css';

import { EmptyState } from '@/components/feedback/empty-state';

const stats = [
  { label: 'Simulacoes', value: '0' },
  { label: 'Custo medio', value: 'R$ 0,00' },
  { label: 'Importacoes', value: '0' },
];

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <span>Operacao</span>
        <span>Dashboard</span>
      </nav>
      <header className={styles.title}>
        <div>
          <p>Tenant demo</p>
          <h1>Dashboard</h1>
        </div>
      </header>
      <section className={styles.stats} aria-label="Indicadores">
        {stats.map((stat) => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>
      <EmptyState
        title="Dados operacionais ainda nao carregados"
        description="Os modulos de simulacao, importacao e insights serao especificados apos a aprovacao da fundacao."
      />
    </div>
  );
}
