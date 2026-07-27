import styles from '../dashboard/page.module.css';

import { CustomerManagement } from '@/features/customers/customer-management';

export default function CustomersPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <span>Operacao</span>
        <span>Clientes</span>
      </nav>
      <header className={styles.title}>
        <div>
          <p>Cadastro tenant-scoped</p>
          <h1>Clientes</h1>
        </div>
      </header>
      <CustomerManagement />
    </div>
  );
}
