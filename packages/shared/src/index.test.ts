import { describe, expect, it } from 'vitest';

import { errorCodes, UserRole } from './index';

describe('shared contracts', () => {
  it('exposes stable roles and error codes', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(errorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
  });
});
