import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

export function getNavigationMocks() {
  return navigationMocks;
}

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    replace: navigationMocks.replace,
  }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

afterEach(() => {
  cleanup();
  navigationMocks.replace.mockReset();
});
