import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LoginPage from '../src/app/(auth)/login/page';
import { AppProviders } from '../src/providers/app-providers';

import { getNavigationMocks } from './setup';

describe('LoginPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('associates validation errors with fields', async () => {
    render(
      <AppProviders>
        <LoginPage />
      </AppProviders>,
    );

    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Informe um e-mail valido.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('submits credentials and redirects to dashboard after login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              accessToken: 'access',
              accessTokenExpiresAt: '2026-07-20T12:00:00.000Z',
              user: {
                id: 'user-1',
                name: 'Demo Admin',
                email: 'admin@example.com',
                role: 'ADMIN',
                tenant: { id: 'tenant-1', name: 'Demo Logistics', slug: 'demo-logistics' },
              },
            }),
          ),
      }),
    );

    render(
      <AppProviders>
        <LoginPage />
      </AppProviders>,
    );

    await userEvent.type(screen.getByLabelText('E-mail'), 'admin@example.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'DemoAdmin123!');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(getNavigationMocks().replace).toHaveBeenCalledWith('/dashboard');
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3333/api/v1/auth/login',
      expect.objectContaining({ credentials: 'include', method: 'POST' }),
    );
  });

  it('shows an API availability message when login cannot reach the backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    render(
      <AppProviders>
        <LoginPage />
      </AppProviders>,
    );

    await userEvent.type(screen.getByLabelText('E-mail'), 'administrador@dev.com');
    await userEvent.type(screen.getByLabelText('Senha'), '@DEV1512');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/API indisponivel/i)).toBeInTheDocument();
  });
});
