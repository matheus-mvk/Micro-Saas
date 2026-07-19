import { Bell, Building2, ChartNoAxesCombined, FileUp, Menu, Search, Settings, Truck, Users } from 'lucide-react';
import type { ReactNode } from 'react';

import styles from './app-shell.module.css';

const navItems = [
  { label: 'Dashboard', icon: ChartNoAxesCombined },
  { label: 'Usuarios', icon: Users },
  { label: 'Clientes', icon: Building2 },
  { label: 'Transportadoras', icon: Truck },
  { label: 'Importacoes', icon: FileUp },
  { label: 'Configuracoes', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Navegacao administrativa">
        <div className={styles.brand}>
          <span className={styles.mark}>NF</span>
          <strong>Nexora Freight</strong>
        </div>
        <nav className={styles.nav} aria-label="Navegacao administrativa">
          {navItems.map((item) => (
            <a key={item.label} href="/dashboard" className={styles.navItem}>
              <item.icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <button className={styles.iconButton} aria-label="Abrir navegacao">
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className={styles.search}>
            <Search size={18} aria-hidden="true" />
            <label className="sr-only" htmlFor="global-search">
              Pesquisa
            </label>
            <input id="global-search" placeholder="Pesquisar operacoes" />
          </div>
          <button className={styles.iconButton} aria-label="Notificacoes">
            <Bell size={20} aria-hidden="true" />
          </button>
          <div className={styles.profile} aria-label="Perfil">
            <span>DL</span>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
