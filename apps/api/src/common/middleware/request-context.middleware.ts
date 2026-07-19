import { randomUUID } from 'node:crypto';

import { UserRole } from '@logistics/shared';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
  TENANT_ID_HEADER,
  USER_ID_HEADER,
  USER_ROLE_HEADER,
} from '../constants/metadata.constants';
import type { RequestWithContext } from '../types/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: RequestWithContext, response: Response, next: NextFunction): void {
    const requestId = readHeader(request, REQUEST_ID_HEADER) ?? randomUUID();
    const correlationId = readHeader(request, CORRELATION_ID_HEADER) ?? requestId;
    const roleHeader = readHeader(request, USER_ROLE_HEADER);
    const tenantId = readHeader(request, TENANT_ID_HEADER);
    const userId = readHeader(request, USER_ID_HEADER);
    const role = isUserRole(roleHeader) ? roleHeader : undefined;

    request.context = {
      requestId,
      correlationId,
    };

    if (tenantId) request.context.tenantId = tenantId;
    if (userId) request.context.userId = userId;
    if (role) request.context.role = role;

    response.setHeader(REQUEST_ID_HEADER, requestId);
    response.setHeader(CORRELATION_ID_HEADER, correlationId);
    next();
  }
}

function readHeader(request: RequestWithContext, header: string): string | undefined {
  const value = request.header(header);
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function isUserRole(value: string | undefined): value is UserRole {
  return value === UserRole.ADMIN || value === UserRole.MANAGER || value === UserRole.OPERATOR;
}
