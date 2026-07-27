import styles from '../../../dashboard/page.module.css';
import { CarrierEditor } from '@/features/logistics/admin-editors';
export default async function EditCarrierPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <div className={styles.page}><h1>Editar transportadora</h1><CarrierEditor id={id} /></div>; }
