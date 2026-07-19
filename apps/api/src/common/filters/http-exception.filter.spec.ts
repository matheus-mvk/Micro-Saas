import { errorCodes } from '@logistics/shared';
import { BadRequestException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  it('returns the standard error contract without stack traces', () => {
    const reply = vi.fn();
    const filter = new HttpExceptionFilter({ httpAdapter: { reply } } as unknown as HttpAdapterHost);
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/api/v1/demo', context: { requestId: 'req-1' } }),
        getResponse: () => ({}),
      }),
    } as ArgumentsHost;

    filter.catch(new BadRequestException('Invalid payload'), host);

    expect(reply).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        statusCode: 400,
        code: errorCodes.VALIDATION_ERROR,
        requestId: 'req-1',
        path: '/api/v1/demo',
      }),
      400,
    );
    expect(JSON.stringify(reply.mock.calls[0])).not.toContain('stack');
  });
});
