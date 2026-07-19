import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LandingPage from '../src/app/(public)/page';

describe('LandingPage', () => {
  it('renders the brand and main CTA', () => {
    render(<LandingPage />);

    expect(screen.getByRole('heading', { name: 'Nexora Freight' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /entrar na plataforma/i })).toBeInTheDocument();
  });
});
