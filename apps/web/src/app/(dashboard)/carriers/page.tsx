import styles from '../dashboard/page.module.css';
import { LogisticsManagement } from '@/features/logistics/logistics-management';

export default function CarriersPage() { return <div className={styles.page}><nav className={styles.breadcrumbs} aria-label="Breadcrumb"><span>Cadastros</span><span>Transportadoras</span></nav><header className={styles.title}><div><p>Parceiros e servicos de transporte</p><h1>Transportadoras</h1></div></header><LogisticsManagement initialTab="carriers" /></div>; }
