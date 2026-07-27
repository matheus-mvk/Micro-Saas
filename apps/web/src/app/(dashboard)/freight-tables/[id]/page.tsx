import styles from '../../dashboard/page.module.css';
import { RateTableEditor, RateTableStatusAction } from '@/features/logistics/admin-editors';
export default async function RateTablePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <div className={styles.page}><h1>Detalhe da tabela de frete</h1><RateTableStatusAction id={id} /><RateTableEditor id={id} /></div>; }
