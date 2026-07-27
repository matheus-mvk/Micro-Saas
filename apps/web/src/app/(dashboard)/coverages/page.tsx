import styles from '../dashboard/page.module.css';
import { CoverageManagement } from '@/features/logistics/coverage-management';

export default function CoveragesPage() { return <div className={styles.page}><nav className={styles.breadcrumbs} aria-label="Breadcrumb"><span>Configuracao logistica</span><span>Coberturas</span></nav><header className={styles.title}><div><p>Regras de atendimento por rota</p><h1>Coberturas</h1></div></header><CoverageManagement /></div>; }
