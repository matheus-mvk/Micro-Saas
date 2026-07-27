import styles from '../../dashboard/page.module.css';
import { BranchEditor } from '@/features/logistics/admin-editors';
export default function NewBranchPage() { return <div className={styles.page}><h1>Nova filial</h1><BranchEditor /></div>; }
