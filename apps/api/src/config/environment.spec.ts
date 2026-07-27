import { describe, expect, it } from 'vitest';

import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('fails with a clear message when required secrets are missing', () => {
    expect(() => validateEnvironment({ DATABASE_URL: 'mysql://user:pass@localhost:3306/db' })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('parses typed values', () => {
    const env = validateEnvironment({
      DATABASE_URL: 'mysql://user:pass@localhost:3306/db',
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      API_PORT: '3333',
    });

    expect(env.API_PORT).toBe(3333);
    expect(env.AUTH_LOGIN_MAX_ATTEMPTS).toBe(5);
    expect(env.AUTH_LOGIN_WINDOW_SECONDS).toBe(900);
  });
});
