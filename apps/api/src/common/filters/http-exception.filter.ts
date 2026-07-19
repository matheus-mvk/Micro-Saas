import { errorCodes } from '@logistics/shared';
import type { ApiErrorResponse, ErrorCode } from '@logistics/shared';
import {
  Catch,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { ApplicationError } from '../errors/application-error';
import type { RequestWithContext } from '../types/request-context';

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithContext>();

    const response = this.toErrorResponse(exception, request);
    httpAdapter.reply(context.getResponse(), response, response.statusCode);
  }

  private toErrorResponse(exception: unknown, request: RequestWithContext): ApiErrorResponse {
    const requestId = request.context.requestId;
    const timestamp = new Date().toISOString();
    const path = request.url;

    if (exception instanceof ApplicationError) {
      return {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        details: exception.details,
        requestId,
        timestamp,
        path,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      return {
        statusCode,
        code: codeForStatus(statusCode),
        message: statusCode >= 500 ? 'Unexpected server error.' : exception.message,
        details: [],
        requestId,
        timestamp,
        path,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: errorCodes.INTERNAL_ERROR,
      message: 'Unexpected server error.',
      details: [],
      requestId,
      timestamp,
      path,
    };
  }
}

function codeForStatus(statusCode: number): ErrorCode {
  if (statusCode === 401) return errorCodes.UNAUTHORIZED;
  if (statusCode === 403) return errorCodes.FORBIDDEN;
  if (statusCode === 404) return errorCodes.NOT_FOUND;
  if (statusCode >= 500) return errorCodes.INTERNAL_ERROR;
  return errorCodes.VALIDATION_ERROR;
}
