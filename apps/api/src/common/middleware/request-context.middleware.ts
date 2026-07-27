import { randomUUID } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
} from '../constants/metadata.constants';
import type { RequestWithContext } from '../types/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: RequestWithContext, response: Response, next: NextFunction): void {
    const requestId = readHeader(request, REQUEST_ID_HEADER) ?? randomUUID();
    const correlationId = readHeader(request, CORRELATION_ID_HEADER) ?? requestId;

    request.context = {
      requestId,
      correlationId,
    };

    response.setHeader(REQUEST_ID_HEADER, requestId);
    response.setHeader(CORRELATION_ID_HEADER, correlationId);
    next();
  }
}

function readHeader(request: RequestWithContext, header: string): string | undefined {
  const value = request.header(header);
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  return /^[a-zA-Z0-9._:-]{1,64}$/.test(normalized) ? normalized : undefined;
}
