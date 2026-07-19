import { describe, expect, it, vi } from 'vitest';

import { REQUEST_ID_HEADER } from '../constants/metadata.constants';
import type { RequestWithContext } from '../types/request-context';

import { RequestContextMiddleware } from './request-context.middleware';

describe('RequestContextMiddleware', () => {
  it('sets request context and response header', () => {
    const middleware = new RequestContextMiddleware();
    const request = {
      header: vi.fn((name: string) => (name === REQUEST_ID_HEADER ? 'req-1' : undefined)),
    } as unknown as RequestWithContext;
    const response = { setHeader: vi.fn() };
    const next = vi.fn();

    middleware.use(request, response as never, next);

    expect(request.context.requestId).toBe('req-1');
    expect(response.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'req-1');
    expect(next).toHaveBeenCalledOnce();
  });
});
