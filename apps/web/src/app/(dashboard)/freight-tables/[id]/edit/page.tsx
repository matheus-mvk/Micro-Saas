import styles from '../../../dashboard/page.module.css';
import { RateTableEditor } from '@/features/logistics/admin-editors';
export default async function EditRateTablePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <div className={styles.page}><h1>Editar tabela de frete</h1><RateTableEditor id={id} /></div>; }
