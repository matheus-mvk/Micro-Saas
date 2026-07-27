import styles from '../dashboard/page.module.css';
import { OperationsManagement } from '@/features/logistics/operations-management';

export default function ShipmentsPage() { return <div className={styles.page}><nav className={styles.breadcrumbs} aria-label="Breadcrumb"><span>Operacao</span><span>Shipments</span></nav><header className={styles.title}><div><p>Entregas e acompanhamento operacional</p><h1>Shipments</h1></div></header><OperationsManagement kind="shipments" /></div>; }
