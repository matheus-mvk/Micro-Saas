export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  DISABLED = 'DISABLED',
}

export enum ImportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  AUTH_FAILURE = 'AUTH_FAILURE',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  CUSTOMER_CHANGED = 'CUSTOMER_CHANGED',
  CARRIER_CHANGED = 'CARRIER_CHANGED',
  IMPORT_CREATED = 'IMPORT_CREATED',
  ADMIN_OPERATION = 'ADMIN_OPERATION',
}

export enum FreightSimulationStatus {
  DRAFT = 'DRAFT',
  QUEUED = 'QUEUED',
  CALCULATED = 'CALCULATED',
  FAILED = 'FAILED',
}

export const errorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  TENANT_REQUIRED: 'TENANT_REQUIRED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

export interface ApiErrorResponse {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details: unknown[];
  requestId: string;
  timestamp: string;
  path: string;
}

export interface PaginationQuery {
  page?: number;
  perPage?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface TenantScopedContext {
  tenantId: string;
  userId: string;
  role: UserRole;
}
