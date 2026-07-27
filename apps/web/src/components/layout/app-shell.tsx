'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Building2, Calculator, ChartNoAxesCombined, FileClock, FileUp, Lightbulb, LogOut, Menu, Route, Settings, Truck, Users, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import styles from './app-shell.module.css';

import { authQueryKeys, logout } from '@/services/auth-service';
import type { SessionUser } from '@/types/session';

const navItems = [
  { label: 'Dashboard', icon: ChartNoAxesCombined, href: '/dashboard', implemented: true },
  { label: 'Usuários', icon: Users, href: '/users', implemented: true, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Clientes', icon: Building2, href: '/customers', implemented: true },
  { label: 'Filiais', icon: Warehouse, href: '/branches', implemented: true, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Simulação', icon: Calculator, href: '/freight/simulate', implemented: true },
  { label: 'Histórico', icon: FileClock, href: '/freight/history', implemented: true },
  { label: 'Shipments', icon: Truck, href: '/shipments', implemented: true },
  { label: 'Transportadoras', icon: Truck, href: '/carriers', implemented: true, roles: ['ADMIN', 'MANAGER', 'OPERATOR'] },
  { label: 'Importações', icon: FileUp, href: '/imports', implemented: true },
  { label: 'Insights', icon: Lightbulb, href: '/insights', implemented: true },
  { label: 'Tabelas de frete', icon: Calculator, href: '/freight-tables', implemented: true, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Auditoria', icon: FileClock, href: '/audit', implemented: true, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Perfil', icon: Settings, href: '/settings/profile', implemented: true },
];

export function AppShell({ children, user }: { children: ReactNode; user: SessionUser }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  async function handleLogout(): Promise<void> {
    await logout();
    queryClient.removeQueries({ queryKey: authQueryKeys.me });
    router.replace('/login?reason=logout');
  }

  return (
    <div className={styles.shell}>
      <aside className={classNames(styles.sidebar, isNavigationOpen ? styles.sidebarOpen : undefined)} aria-label="Navegação administrativa">
        <div className={styles.brand}>
          <span className={styles.mark}>NF</span>
          <strong>Nexora Freight</strong>
        </div>
        <nav className={styles.nav} aria-label="Navegação administrativa">
          {navItems.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) =>
            item.implemented && item.href ? (
              <Link
                key={item.label}
                href={item.href as never}
                className={styles.navItem}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                <item.icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                className={classNames(styles.navItem, styles.navItemDisabled)}
                aria-disabled="true"
                title="Módulo ainda não implementado"
              >
                <item.icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </button>
            ),
          )}
        </nav>
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <button
            className={styles.iconButton}
            aria-expanded={isNavigationOpen}
            aria-label="Alternar navegação"
            onClick={() => {
              setIsNavigationOpen((current) => !current);
            }}
            type="button"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className={styles.headerContext} aria-label="Contexto da operação">
            <span>Operação logística</span>
          </div>
          <div className={styles.identity} aria-label="Sessão atual">
            <div>
              <Link className={styles.profileLink} href="/settings/profile">
                {user.name}
              </Link>
              <Link className={styles.tenantLink} href={'/settings/company' as never}>
                {user.tenant.name}
              </Link>
            </div>
            <Link className={styles.profile} href="/settings/profile" aria-label="Abrir perfil">
              <span>{initials || 'NF'}</span>
            </Link>
          </div>
          <button className={styles.iconButton} aria-label="Sair" onClick={() => void handleLogout()} type="button">
            <LogOut size={20} aria-hidden="true" />
          </button>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

function classNames(...values: (string | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}
