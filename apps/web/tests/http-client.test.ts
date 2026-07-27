import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError, ApiConnectionError, apiRequest } from '../src/services/http-client';

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
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ status: 'ok' })),
      }),
    );

    await expect(apiRequest<{ status: string }>('/health/live')).resolves.toEqual({ status: 'ok' });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3333/api/v1/health/live',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('supports empty successful responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      }),
    );

    await expect(apiRequest<undefined>('/empty')).resolves.toBeUndefined();
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

  it('throws connection errors when the API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    await expect(apiRequest('/auth/login')).rejects.toBeInstanceOf(ApiConnectionError);
  });
});
