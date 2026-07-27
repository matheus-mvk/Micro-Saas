import styles from '../../dashboard/page.module.css';
import { CarrierEditor } from '@/features/logistics/admin-editors';
export default async function CarrierPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <div className={styles.page}><h1>Transportadora</h1><CarrierEditor id={id} /></div>; }
