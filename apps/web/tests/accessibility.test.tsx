import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell } from '../src/components/layout/app-shell';

describe('basic accessibility', () => {
  it('exposes semantic navigation and labeled search', () => {
    render(
      <AppShell>
        <p>Dashboard</p>
      </AppShell>,
    );

    expect(screen.getByRole('navigation', { name: 'Navegacao administrativa' })).toBeInTheDocument();
    expect(screen.getByLabelText('Pesquisa')).toBeInTheDocument();
  });
});
