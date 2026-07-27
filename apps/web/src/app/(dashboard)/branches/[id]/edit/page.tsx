import styles from '../../../dashboard/page.module.css';
import { BranchEditor } from '@/features/logistics/admin-editors';
export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <div className={styles.page}><h1>Editar filial</h1><BranchEditor id={id} /></div>; }
