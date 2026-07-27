import type { DashboardFiltersDto, DashboardSummaryDto } from '@logistics/shared';

import { apiRequest } from './http-client';

export const dashboardQueryKeys = {
  summary: (filters: DashboardFiltersDto) => ['dashboard', 'summary', filters] as const,
};

export function getDashboardSummary(filters: DashboardFiltersDto = {}): Promise<DashboardSummaryDto> {
  const params = new URLSearchParams();
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.customerId) params.set('customerId', filters.customerId);
  if (filters.carrierId) params.set('carrierId', filters.carrierId);
  if (filters.carrierServiceId) params.set('carrierServiceId', filters.carrierServiceId);
  if (filters.branchId) params.set('branchId', filters.branchId);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return apiRequest<DashboardSummaryDto>(`/dashboard/summary${query ? `?${query}` : ''}`);
}
