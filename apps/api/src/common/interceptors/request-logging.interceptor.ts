import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Optional } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable, tap } from 'rxjs';

import type { RequestWithContext } from '../types/request-context';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(@Optional() private readonly logger?: PinoLogger) {
    this.logger?.setContext(RequestLoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger?.info({
          requestId: request.context?.requestId,
          correlationId: request.context?.correlationId,
          method: request.method,
          path: request.url,
          durationMs: Date.now() - startedAt,
        });
      }),
    );
  }
}
