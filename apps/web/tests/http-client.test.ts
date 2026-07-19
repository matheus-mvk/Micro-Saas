import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError, apiRequest } from '../src/services/http-client';

describe('apiRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns JSON for successful responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      }),
    );

    await expect(apiRequest<{ status: string }>('/health/live')).resolves.toEqual({ status: 'ok' });
  });

  it('throws structured API errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Invalid',
          details: [],
          requestId: 'req-1',
          timestamp: '2026-07-18T00:00:00.000Z',
          path: '/api/v1/demo',
        }),
      }),
    );

    await expect(apiRequest('/demo')).rejects.toBeInstanceOf(ApiClientError);
  });
});
