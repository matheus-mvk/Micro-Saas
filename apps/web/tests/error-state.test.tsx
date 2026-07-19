import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ErrorPage from '../src/app/error';

describe('ErrorPage', () => {
  it('renders recovery action', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<ErrorPage error={new Error('boom')} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Falha ao carregar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});
