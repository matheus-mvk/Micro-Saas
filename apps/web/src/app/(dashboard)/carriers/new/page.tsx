import styles from '../../dashboard/page.module.css';
import { CarrierEditor } from '@/features/logistics/admin-editors';
export default function NewCarrierPage() { return <div className={styles.page}><h1>Nova transportadora</h1><CarrierEditor /></div>; }
