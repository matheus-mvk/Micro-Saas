import styles from '../dashboard/page.module.css';
import { OperationsManagement } from '@/features/logistics/operations-management';

export default function AuditPage() { return <div className={styles.page}><nav className={styles.breadcrumbs} aria-label="Breadcrumb"><span>Administracao</span><span>Auditoria</span></nav><header className={styles.title}><div><p>Rastreabilidade do tenant</p><h1>Auditoria</h1></div></header><OperationsManagement kind="audit" /></div>; }
