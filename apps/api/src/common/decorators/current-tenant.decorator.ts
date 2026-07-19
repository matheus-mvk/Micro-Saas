import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import type { RequestWithContext } from '../types/request-context';

export const CurrentTenant = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithContext>();
  return request.context.tenantId;
});
