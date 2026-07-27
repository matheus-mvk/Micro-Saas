import styles from '../dashboard/page.module.css';
import { OperationsManagement } from '@/features/logistics/operations-management';

export default function FreightTablesPage() { return <div className={styles.page}><nav className={styles.breadcrumbs} aria-label="Breadcrumb"><span>Configuracao logistica</span><span>Tabelas de frete</span></nav><header className={styles.title}><div><p>Regras persistidas usadas na precificacao</p><h1>Tabelas de frete</h1></div></header><OperationsManagement kind="rates" /></div>; }
