import styles from '../../dashboard/page.module.css';
import { RateTableEditor } from '@/features/logistics/admin-editors';
export default function NewRateTablePage() { return <div className={styles.page}><h1>Nova tabela de frete</h1><RateTableEditor /></div>; }
