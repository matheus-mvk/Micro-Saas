import { UserRole } from '@logistics/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell } from '../src/components/layout/app-shell';
import { AppProviders } from '../src/providers/app-providers';

describe('basic accessibility', () => {
  it('exposes semantic navigation and labeled search', () => {
    render(
      <AppProviders>
        <AppShell
          user={{
            email: 'admin@example.com',
            id: 'user-1',
            name: 'Demo Admin',
            role: UserRole.ADMIN,
            tenant: { id: 'tenant-1', name: 'Demo Logistics', slug: 'demo-logistics' },
          }}
        >
          <p>Dashboard</p>
        </AppShell>
      </AppProviders>,
    );

    expect(screen.getByRole('navigation', { name: 'Navegacao administrativa' })).toBeInTheDocument();
    expect(screen.getByLabelText('Pesquisa')).toBeInTheDocument();
    expect(screen.getByLabelText('Sessao atual')).toHaveTextContent('Demo Admin');
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });
});
