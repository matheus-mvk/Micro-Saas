import type { InsightCategory, InsightDto, InsightSeverity, InsightStatus, InsightSummaryDto, PaginatedResult, RefreshInsightsResultDto } from '@logistics/shared';

import { apiRequest } from './http-client';

export const insightsQueryKeys = {
  list: (filters: Record<string, unknown>) => ['insights', filters] as const,
  summary: ['insights', 'summary'] as const,
};

export function listInsights(filters: { category?: InsightCategory | ''; endDate?: string; page?: number; perPage?: number; severity?: InsightSeverity | ''; startDate?: string; status?: InsightStatus | '' }): Promise<PaginatedResult<InsightDto>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('perPage', String(filters.perPage));
  if (filters.category) params.set('category', filters.category);
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.status) params.set('status', filters.status);
  return apiRequest<PaginatedResult<InsightDto>>(`/insights?${params.toString()}`);
}

export function getInsightSummary(): Promise<InsightSummaryDto> {
  return apiRequest<InsightSummaryDto>('/insights/summary');
}

export function refreshInsights(): Promise<RefreshInsightsResultDto> {
  return apiRequest<RefreshInsightsResultDto>('/insights/refresh', { method: 'POST' });
}

export function markInsightRead(id: string): Promise<InsightDto> {
  return apiRequest<InsightDto>(`/insights/${id}/read`, { method: 'PATCH' });
}

export function dismissInsight(id: string): Promise<InsightDto> {
  return apiRequest<InsightDto>(`/insights/${id}/dismiss`, { method: 'PATCH' });
}
