import type { ErrorCode } from '@logistics/shared';
import { HttpStatus } from '@nestjs/common';

export class ApplicationError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly statusCode: number = HttpStatus.BAD_REQUEST,
    readonly details: unknown[] = [],
  ) {
    super(message);
  }
}
