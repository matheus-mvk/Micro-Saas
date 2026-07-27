import type {
  CreateImportJobDto,
  ImportJobDetailDto,
  ImportJobDto,
  ImportPreviewDto,
  ImportProgressEventDto,
  ImportStatus,
  ImportTemplateDto,
  ImportType,
  PaginatedResult,
} from '@logistics/shared';

import { publicEnv } from '@/lib/env';

import { apiRequest } from './http-client';

export const importsQueryKeys = {
  detail: (id: string) => ['imports', id] as const,
  list: (filters: Record<string, unknown>) => ['imports', filters] as const,
};

export function listImports(filters: { page?: number; perPage?: number; search?: string; status?: ImportStatus | ''; type?: ImportType | '' }): Promise<PaginatedResult<ImportJobDto>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('perPage', String(filters.perPage));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  return apiRequest<PaginatedResult<ImportJobDto>>(`/imports?${params.toString()}`);
}

export function getImport(id: string, page = 1): Promise<ImportJobDetailDto> {
  return apiRequest<ImportJobDetailDto>(`/imports/${id}?page=${page}&perPage=50`);
}

export function getImportTemplate(type: ImportType): Promise<ImportTemplateDto> {
  return apiRequest<ImportTemplateDto>(`/imports/templates/${type}`);
}

export function previewImport(file: File, type: ImportType): Promise<ImportPreviewDto> {
  const form = new FormData();
  form.set('file', file);
  form.set('type', type);
  return apiRequest<ImportPreviewDto>('/imports/preview', {
    method: 'POST',
    body: form,
  });
}

export function createImport(file: File, input: CreateImportJobDto): Promise<ImportJobDto> {
  const form = new FormData();
  form.set('file', file);
  form.set('type', input.type);
  form.set('mapping', JSON.stringify(input.mapping));
  if (input.duplicateStrategy) form.set('duplicateStrategy', input.duplicateStrategy);
  return apiRequest<ImportJobDto>('/imports', {
    method: 'POST',
    body: form,
  });
}

export function cancelImport(id: string): Promise<ImportJobDto> {
  return apiRequest<ImportJobDto>(`/imports/${id}/cancel`, { method: 'POST' });
}

export function retryImport(id: string): Promise<ImportJobDto> {
  return apiRequest<ImportJobDto>(`/imports/${id}/retry`, { method: 'POST', body: JSON.stringify({}) });
}

export function importErrorsUrl(id: string): string {
  return `${publicEnv.NEXT_PUBLIC_API_URL}/imports/${id}/errors.csv`;
}

export type ImportRealtimeEvent = ImportProgressEventDto;
