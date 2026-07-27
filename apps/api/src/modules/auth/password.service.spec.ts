import { describe, expect, it } from 'vitest';

import { PasswordService } from './password.service';

describe('PasswordService', () => {
  it('hashes and verifies passwords without storing the plain value', async () => {
    const service = new PasswordService();

    const hash = await service.hash('DemoAdmin123!');

    expect(hash).not.toContain('DemoAdmin123!');
    await expect(service.verify('DemoAdmin123!', hash)).resolves.toBe(true);
    await expect(service.verify('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects unsupported stored hash formats', async () => {
    const service = new PasswordService();

    await expect(service.verify('DemoAdmin123!', 'plain-text')).resolves.toBe(false);
  });
});
