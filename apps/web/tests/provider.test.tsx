import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppProviders } from '../src/providers/app-providers';

describe('AppProviders', () => {
  it('renders children inside query provider', () => {
    render(
      <AppProviders>
        <span>conteudo</span>
      </AppProviders>,
    );

    expect(screen.getByText('conteudo')).toBeInTheDocument();
  });
});
