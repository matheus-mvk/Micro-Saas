import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import LoginPage from '../src/app/(auth)/login/page';

describe('LoginPage', () => {
  it('associates validation errors with fields', async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Informe um e-mail valido.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });
});
