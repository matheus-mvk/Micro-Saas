import styles from './platform-preview.module.css';

const lanes = [
  { route: 'SP -> RJ', carrier: 'Rota Sul', value: 'R$ 842,30', state: 'Economia 12%' },
  { route: 'MG -> BA', carrier: 'Atlas Cargo', value: 'R$ 1.204,10', state: 'Prazo 2d' },
  { route: 'PR -> SC', carrier: 'Norte Line', value: 'R$ 612,90', state: 'Risco baixo' },
];

export function PlatformPreview() {
  return (
    <div className={styles.preview} aria-label="Demonstracao visual da plataforma">
      <div className={styles.toolbar}>
        <span />
        <span />
        <span />
      </div>
      <div className={styles.grid}>
        <section className={styles.panel}>
          <p>Simulacoes hoje</p>
          <strong>1.284</strong>
          <div className={styles.bar}>
            <span style={{ width: '68%' }} />
          </div>
        </section>
        <section className={styles.panel}>
          <p>Custo medio</p>
          <strong>R$ 739</strong>
          <div className={styles.bar}>
            <span style={{ width: '42%' }} />
          </div>
        </section>
        <section className={styles.routes}>
          {lanes.map((lane) => (
            <article key={lane.route}>
              <div>
                <strong>{lane.route}</strong>
                <span>{lane.carrier}</span>
              </div>
              <div>
                <strong>{lane.value}</strong>
                <span>{lane.state}</span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
