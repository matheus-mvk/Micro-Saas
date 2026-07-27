import styles from '../dashboard/page.module.css';
import { LogisticsManagement } from '@/features/logistics/logistics-management';

export default function BranchesPage() { return <div className={styles.page}><nav className={styles.breadcrumbs} aria-label="Breadcrumb"><span>Cadastros</span><span>Filiais</span></nav><header className={styles.title}><div><p>Origens da operacao</p><h1>Filiais</h1></div></header><LogisticsManagement initialTab="branches" /></div>; }
