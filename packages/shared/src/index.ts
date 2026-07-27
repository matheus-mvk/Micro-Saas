export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  DISABLED = 'DISABLED',
  DELETED = 'DELETED',
}

export enum ImportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export enum ImportType {
  CUSTOMERS = 'CUSTOMERS',
  CARRIERS = 'CARRIERS',
}

export enum ImportRowStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  SKIPPED = 'SKIPPED',
}

export enum InsightCategory {
  COST = 'COST',
  DEADLINE = 'DEADLINE',
  CARRIER = 'CARRIER',
  ROUTE = 'ROUTE',
  CUSTOMER = 'CUSTOMER',
  OPERATION = 'OPERATION',
  IMPORT = 'IMPORT',
  DATA_QUALITY = 'DATA_QUALITY',
}

export enum InsightSeverity {
  INFO = 'INFO',
  OPPORTUNITY = 'OPPORTUNITY',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum InsightStatus {
  NEW = 'NEW',
  READ = 'READ',
  DISMISSED = 'DISMISSED',
  RESOLVED = 'RESOLVED',
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  AUTH_FAILURE = 'AUTH_FAILURE',
  TENANT_REGISTERED = 'TENANT_REGISTERED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  OAUTH_LINKED = 'OAUTH_LINKED',
  OAUTH_UNLINKED = 'OAUTH_UNLINKED',
  MFA_CHANGED = 'MFA_CHANGED',
  USER_INVITED = 'USER_INVITED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  ONBOARDING_UPDATED = 'ONBOARDING_UPDATED',
  CUSTOMER_CHANGED = 'CUSTOMER_CHANGED',
  CARRIER_CHANGED = 'CARRIER_CHANGED',
  FREIGHT_PRICING_CHANGED = 'FREIGHT_PRICING_CHANGED',
  FREIGHT_SIMULATION_CREATED = 'FREIGHT_SIMULATION_CREATED',
  FREIGHT_OPTION_SELECTED = 'FREIGHT_OPTION_SELECTED',
  SHIPMENT_CREATED = 'SHIPMENT_CREATED',
  IMPORT_CREATED = 'IMPORT_CREATED',
  IMPORT_STARTED = 'IMPORT_STARTED',
  IMPORT_COMPLETED = 'IMPORT_COMPLETED',
  IMPORT_FAILED = 'IMPORT_FAILED',
  IMPORT_CANCELED = 'IMPORT_CANCELED',
  IMPORT_RETRIED = 'IMPORT_RETRIED',
  IMPORT_FILE_DOWNLOADED = 'IMPORT_FILE_DOWNLOADED',
  INSIGHT_GENERATED = 'INSIGHT_GENERATED',
  INSIGHT_READ = 'INSIGHT_READ',
  INSIGHT_DISMISSED = 'INSIGHT_DISMISSED',
  ADMIN_OPERATION = 'ADMIN_OPERATION',
}

export enum FreightSimulationStatus {
  DRAFT = 'DRAFT',
  QUEUED = 'QUEUED',
  CALCULATED = 'CALCULATED',
  FAILED = 'FAILED',
}

export enum AddressType {
  MAIN = 'MAIN',
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  BILLING = 'BILLING',
  OTHER = 'OTHER',
}

export enum ShipmentStatus {
  CREATED = 'CREATED',
  PICKUP_SCHEDULED = 'PICKUP_SCHEDULED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED_AT_HUB = 'ARRIVED_AT_HUB',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  RETURNING = 'RETURNING',
  RETURNED = 'RETURNED',
  CANCELED = 'CANCELED',
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

export interface AuthenticatedUserDto {
  branchId?: string;
  email: string;
  id: string;
  name: string;
  role: UserRole;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface AuthResponseDto {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthenticatedUserDto;
}

export interface MfaRequiredResponseDto {
  challengeToken: string;
  expiresAt: string;
  mfaRequired: true;
  userHint: string;
}

export type LoginResponseDto = AuthResponseDto | MfaRequiredResponseDto;

export interface MeResponseDto {
  user: AuthenticatedUserDto;
}

export interface LogoutResponseDto {
  ok: true;
}

export interface RegisterTenantDto {
  acceptedPrivacy: boolean;
  acceptedTerms: boolean;
  companyName: string;
  email: string;
  name: string;
  password: string;
  passwordConfirmation: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ForgotPasswordResponseDto {
  devResetUrl?: string;
  ok: true;
}

export interface ResetPasswordDto {
  password: string;
  passwordConfirmation: string;
  token: string;
}

export interface MfaSetupDto {
  manualKey: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface ConfirmMfaDto {
  code: string;
}

export interface ConfirmMfaResponseDto {
  recoveryCodes: string[];
}

export interface VerifyMfaLoginDto {
  challengeToken: string;
  code: string;
}

export interface LinkedProviderDto {
  email: string;
  provider: 'GOOGLE' | 'GITHUB';
}

export interface UserSessionDto {
  createdAt: string;
  current: boolean;
  expiresAt: string;
  id: string;
  lastUsedAt: string | null;
  userAgent: string | null;
}

export interface ProfileDto {
  email: string;
  id: string;
  linkedProviders: LinkedProviderDto[];
  mfaEnabled: boolean;
  name: string;
  role: UserRole;
  sessions: UserSessionDto[];
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface UpdateProfileDto {
  name: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

export interface TenantOnboardingDto {
  branchDone: boolean;
  companyDone: boolean;
  completed: boolean;
  currentStep: string;
  inviteDone: boolean;
}

export interface UpdateOnboardingDto {
  branchDone?: boolean;
  companyDone?: boolean;
  completed?: boolean;
  currentStep?: string;
  inviteDone?: boolean;
}

export interface AdminUserDto {
  createdAt: string;
  email: string;
  id: string;
  invited: boolean;
  lastLoginAt: string | null;
  mfaEnabled: boolean;
  name: string;
  providers: LinkedProviderDto[];
  role: UserRole;
  status: UserStatus;
}

export interface CreateAdminUserDto {
  email: string;
  name: string;
  password?: string;
  passwordChangeRequired?: boolean;
  role: UserRole;
}

export interface InviteUserDto {
  email: string;
  role: UserRole;
}

export interface InviteUserResponseDto {
  devInviteUrl?: string;
  invitationId: string;
  ok: true;
}

export interface AcceptInviteDto {
  name: string;
  password: string;
  passwordConfirmation: string;
  token: string;
}

export interface UpdateAdminUserDto {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface DashboardSummaryDto {
  accessScope: 'FULL' | 'OPERATIONAL';
  comparisons: {
    costAverage: DashboardTrendDto;
    delayedShipments: DashboardTrendDto;
    freightSimulations: DashboardTrendDto;
    importErrorRate: DashboardTrendDto;
    shipments: DashboardTrendDto;
  };
  filterOptions: {
    branches: DashboardFilterOptionDto[];
    carrierServices: Array<DashboardFilterOptionDto & { carrierId: string }>;
    carriers: DashboardFilterOptionDto[];
    customers: DashboardFilterOptionDto[];
    shipmentStatuses: DashboardFilterOptionDto[];
  };
  filters: DashboardFiltersDto;
  generatedAt: string;
  period: {
    end: string;
    previousEnd: string;
    previousStart: string;
    start: string;
  };
  tenantId: string;
  totals: {
    activeCarriers: number;
    activeCustomers: number;
    activeUsers: number;
    auditEvents: number;
    freightSimulations: number;
    importJobs: number;
  };
  freight: {
    averageEstimatedPrice: number | null;
    calculatedSimulations: number;
    averageLowestOption?: number | null;
    conversionRate?: number;
    estimatedSavings?: number;
    selectedAveragePrice?: number | null;
    shipmentsFromSimulations?: number;
    selectedOptions?: number;
    simulationsChangePercent?: number | null;
  };
  imports: {
    completed: number;
    failed: number;
    processing: number;
    errorRate: number;
    stalled: number;
  };
  operations: {
    delayedShipments: number;
    deliveredShipments: number;
    failedShipments: number;
    inTransitShipments: number;
    successRate: number;
    totalShipments: number;
  };
  charts: {
    carrierPerformance: DashboardCarrierPerformanceDto[];
    conversionByPeriod: DashboardSeriesPointDto[];
    costByPeriod: DashboardSeriesPointDto[];
    importsQuality: DashboardImportQualityDto[];
    routePerformance: DashboardRoutePerformanceDto[];
    selectedCarriers: DashboardSeriesPointDto[];
    shipmentStatus: DashboardStatusPointDto[];
    simulationsByPeriod: DashboardSeriesPointDto[];
  };
  decisionHighlights: DashboardDecisionHighlightDto[];
  recentActivity: DashboardActivityDto[];
}

export interface DashboardFiltersDto {
  branchId?: string;
  carrierId?: string;
  carrierServiceId?: string;
  customerId?: string;
  endDate?: string;
  startDate?: string;
  status?: ShipmentStatus;
}

export interface DashboardFilterOptionDto {
  id: string;
  label: string;
}

export interface DashboardTrendDto {
  absoluteChange: number | null;
  current: number | null;
  direction: 'UP' | 'DOWN' | 'FLAT' | 'NONE';
  favorable: boolean | null;
  percentageChange: number | null;
  previous: number | null;
}

export interface DashboardSeriesPointDto {
  label: string;
  value: number;
}

export interface DashboardStatusPointDto {
  label: string;
  value: number;
}

export interface DashboardCarrierPerformanceDto {
  averageDeadlineDays: number | null;
  averagePrice: number | null;
  carrierId: string;
  carrierName: string;
  optionCount: number;
  selectedCount: number;
}

export interface DashboardRoutePerformanceDto {
  averagePrice: number | null;
  optionCount: number;
  route: string;
  simulationCount: number;
}

export interface DashboardImportQualityDto {
  errorRows: number;
  filename: string;
  id: string;
  successRows: number;
  totalRows: number;
}

export interface DashboardDecisionHighlightDto {
  actionUrl: string | null;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  value: string;
}

export interface DashboardActivityDto {
  action: string;
  createdAt: string;
  entityId: string | null;
  entityType: string | null;
  id: string;
}

export interface CustomerDto {
  active: boolean;
  createdAt: string;
  document: string | null;
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
  updatedAt: string;
}

export interface AddressDto {
  city: string;
  complement: string | null;
  country: string;
  district: string | null;
  latitude?: number | null;
  longitude?: number | null;
  number: string | null;
  postalCode: string;
  state: string;
  street: string;
  type?: AddressType;
}

export interface CustomerAddressDto extends AddressDto {
  active: boolean;
  customerId: string;
  delivery: boolean;
  id: string;
  label: string | null;
  main: boolean;
  pickup: boolean;
}

export interface CreateCustomerDto {
  document?: string | null;
  email?: string | null;
  name: string;
  phone?: string | null;
}

export interface UpdateCustomerDto {
  document?: string | null;
  email?: string | null;
  name?: string;
  phone?: string | null;
}

export interface BranchDto {
  active: boolean;
  city: string | null;
  code: string;
  id: string;
  main: boolean;
  name: string;
  postalCode: string | null;
  state: string | null;
  street: string | null;
  number?: string | null;
  district?: string | null;
  email?: string | null;
  phone?: string | null;
  complement?: string | null;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarrierDto {
  active: boolean;
  code: string | null;
  document: string | null;
  id: string;
  name: string;
  services?: CarrierTransportServiceDto[];
  legalName?: string | null;
  email?: string | null;
  phone?: string | null;
  contactName?: string | null;
  site?: string | null;
  notes?: string | null;
  stateRegistration?: string | null;
}

export interface CarrierTransportServiceDto {
  carrierId: string;
  code: string;
  cubicFactor: number;
  defaultDeadlineDays: number;
  id: string;
  maxWeightKg: number | null;
  minWeightKg: number | null;
  minimumValue: number;
  maxLengthCm?: number | null;
  maxWidthCm?: number | null;
  maxHeightCm?: number | null;
  modality: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string | null;
}

export interface FreightRateTableAdminDto {
  id: string;
  carrierServiceId: string;
  carrierName: string;
  serviceName: string;
  name: string;
  version: number;
  currency: string;
  validFrom: string;
  validTo: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  ranges: Array<{
    id: string;
    minWeightKg: number;
    maxWeightKg: number;
    basePrice: number;
    pricePerKg: number;
    excessPricePerKg: number | null;
    deadlineDays: number;
    priority: number;
  }>;
  charges: Array<{
    id: string;
    type: string;
    name: string;
    fixedAmount: number | null;
    percentage: number | null;
    active: boolean;
  }>;
}

export interface FreightPackageInputDto {
  description?: string | null;
  heightCm: number;
  lengthCm: number;
  quantity: number;
  weightKg: number;
  widthCm: number;
}

export interface FreightSimulationCreateDto {
  cargoValue: number;
  carrierId?: string | null;
  carrierServiceId?: string | null;
  customerId?: string | null;
  desiredShipDate?: string | null;
  destination: AddressDto;
  origin: AddressDto;
  packages: FreightPackageInputDto[];
}

export interface FreightPriceComponentDto {
  amount: number;
  label: string;
  sortOrder: number;
  type: string;
}

export interface FreightSimulationOptionDto {
  carrierId: string;
  carrierName: string;
  carrierServiceId: string;
  chargeableWeightKg: number;
  cheapest: boolean;
  components: FreightPriceComponentDto[];
  cubicWeightKg: number;
  currency: string;
  deadlineDays: number;
  distanceKm: number | null;
  estimatedDeliveryAt: string;
  fastest: boolean;
  id: string;
  realWeightKg: number;
  selected: boolean;
  serviceCode: string;
  serviceName: string;
  totalPrice: number;
}

export interface FreightSimulationDto {
  cargoValue: number | null;
  chargeableWeightKg: number | null;
  createdAt: string;
  customer: Pick<CustomerDto, 'id' | 'name'> | null;
  destinationPostalCode: string;
  distanceKm: number | null;
  estimatedDeadlineDays: number | null;
  estimatedPrice: number | null;
  id: string;
  options: FreightSimulationOptionDto[];
  originPostalCode: string;
  realWeightKg: number;
  status: FreightSimulationStatus;
  totalVolumeM3: number | null;
}

export interface FreightSimulationListItemDto {
  cargoValue: number | null;
  createdAt: string;
  customerName: string | null;
  destinationPostalCode: string;
  id: string;
  lowestPrice: number | null;
  optionCount: number;
  originPostalCode: string;
  selectedOption: string | null;
  status: FreightSimulationStatus;
}

export interface ShipmentDto {
  carrierName: string;
  carrierServiceName: string;
  createdAt: string;
  estimatedDeliveryAt: string;
  freightValue: number;
  id: string;
  simulationId: string;
  status: ShipmentStatus;
  trackingCode: string;
}

export type ImportDuplicateStrategy = 'SKIP' | 'UPDATE' | 'FAIL';

export interface ImportFieldDefinitionDto {
  aliases: string[];
  key: string;
  label: string;
  required: boolean;
}

export interface ImportTemplateDto {
  columns: string[];
  csv: string;
  fields: ImportFieldDefinitionDto[];
  type: ImportType;
}

export interface ImportPreviewRowDto {
  rowNumber: number;
  values: Record<string, string>;
}

export interface ImportPreviewDto {
  detectedHeaders: string[];
  duplicateHeaders: string[];
  fields: ImportFieldDefinitionDto[];
  mapping: Record<string, string>;
  previewRows: ImportPreviewRowDto[];
  structuralErrors: string[];
  totalRows: number;
  type: ImportType;
}

export interface CreateImportJobDto {
  duplicateStrategy?: ImportDuplicateStrategy;
  mapping: Record<string, string>;
  type: ImportType;
}

export interface ImportJobDto {
  createdAt: string;
  errorRows: number;
  failureReason: string | null;
  filename: string;
  fileType: string;
  finishedAt: string | null;
  id: string;
  mimeType: string | null;
  processedRows: number;
  progress: number;
  sizeBytes: number;
  skippedRows: number;
  startedAt: string | null;
  status: ImportStatus;
  successRows: number;
  totalRows: number;
  type: ImportType;
  updatedAt: string;
  user: {
    email: string;
    id: string;
    name: string;
  };
}

export interface ImportRowResultDto {
  createdResourceId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  externalReference: string | null;
  id: string;
  normalizedData: Record<string, unknown> | null;
  rowNumber: number;
  status: ImportRowStatus;
}

export interface ImportJobDetailDto extends ImportJobDto {
  mapping: Record<string, string>;
  options: Record<string, unknown>;
  rows: PaginatedResult<ImportRowResultDto>;
}

export interface ImportProgressEventDto {
  errorRows: number;
  importJobId: string;
  processedRows: number;
  progress: number;
  skippedRows: number;
  status: ImportStatus;
  successRows: number;
  timestamp: string;
  totalRows: number;
  type: ImportType;
}

export interface InsightDto {
  actionUrl: string | null;
  category: InsightCategory;
  comparisonValue: number | null;
  description: string;
  dismissedAt: string | null;
  evidence: Record<string, unknown>;
  generatedAt: string;
  id: string;
  metadata: Record<string, unknown> | null;
  metricValue: number | null;
  percentageChange: number | null;
  periodEnd: string;
  periodStart: string;
  readAt: string | null;
  resourceId: string | null;
  resourceType: string | null;
  severity: InsightSeverity;
  status: InsightStatus;
  title: string;
  type: string;
}

export interface InsightSummaryDto {
  active: number;
  byCategory: Record<InsightCategory, number>;
  bySeverity: Record<InsightSeverity, number>;
  generatedAt: string | null;
  newCount: number;
  opportunities: number;
}

export interface ListInsightsQueryDto extends PaginationQuery {
  category?: InsightCategory;
  endDate?: string;
  severity?: InsightSeverity;
  startDate?: string;
  status?: InsightStatus;
}

export interface RefreshInsightsResultDto {
  generated: number;
  periodEnd: string;
  periodStart: string;
}
