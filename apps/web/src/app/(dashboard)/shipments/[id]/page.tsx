import styles from '../../dashboard/page.module.css';
import { ShipmentDetail } from '@/features/logistics/shipment-detail';

export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className={styles.page}><nav className={styles.breadcrumbs} aria-label="Breadcrumb"><span>Operacao</span><span>Shipment</span></nav><header className={styles.title}><div><p>Timeline e dados persistidos</p><h1>Detalhe da Shipment</h1></div></header><ShipmentDetail id={id} /></div>;
}
