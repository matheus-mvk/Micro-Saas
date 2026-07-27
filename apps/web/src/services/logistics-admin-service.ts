import type { BranchDto, CarrierDto, CarrierTransportServiceDto, PaginatedResult } from '@logistics/shared';

import { apiRequest } from './http-client';

export const logisticsAdminQueryKeys = {
  branches: ['admin-logistics', 'branches'] as const,
  carriers: ['admin-logistics', 'carriers'] as const,
};

export interface BranchInput {
  name: string;
  code: string;
  postalCode?: string | undefined;
  street?: string | undefined;
  number?: string | undefined;
  district?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  main?: boolean | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  complement?: string | undefined;
  country?: string | undefined;
  active?: boolean | undefined;
}

export interface CarrierInput {
  name: string;
  code?: string | undefined;
  document?: string | undefined;
  legalName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  contactName?: string | undefined;
  site?: string | undefined;
  notes?: string | undefined;
  stateRegistration?: string | undefined;
}

export interface ServiceInput {
  code: string;
  name: string;
  modality: string;
  description?: string | undefined;
  defaultDeadlineDays: number;
  cubicFactor: number;
  minWeightKg?: number | undefined;
  maxWeightKg?: number | undefined;
  minimumValue: number;
  maxLengthCm?: number | undefined;
  maxWidthCm?: number | undefined;
  maxHeightCm?: number | undefined;
  status?: 'ACTIVE' | 'INACTIVE' | undefined;
}

export function getBranches(search = ''): Promise<PaginatedResult<BranchDto>> {
  return apiRequest<PaginatedResult<BranchDto>>(`/branches?perPage=50&search=${encodeURIComponent(search)}`);
}
export function getBranch(id: string): Promise<BranchDto> { return apiRequest<BranchDto>(`/branches/${id}`); }

export function saveBranch(input: BranchInput, id?: string): Promise<BranchDto> {
  return apiRequest<BranchDto>(id ? `/branches/${id}` : '/branches', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(input) });
}

export function toggleBranch(id: string, active: boolean): Promise<BranchDto> {
  return apiRequest<BranchDto>(`/branches/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) });
}

export function getCarriers(search = ''): Promise<PaginatedResult<CarrierDto>> {
  return apiRequest<PaginatedResult<CarrierDto>>(`/carriers?perPage=50&search=${encodeURIComponent(search)}`);
}
export function getCarrier(id: string): Promise<CarrierDto> { return apiRequest<CarrierDto>(`/carriers/${id}`); }

export function saveCarrier(input: CarrierInput, id?: string): Promise<CarrierDto> {
  return apiRequest<CarrierDto>(id ? `/carriers/${id}` : '/carriers', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(input) });
}

export function toggleCarrier(id: string, active: boolean): Promise<CarrierDto> {
  return apiRequest<CarrierDto>(`/carriers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) });
}

export function saveCarrierService(carrierId: string, input: ServiceInput, id?: string): Promise<CarrierTransportServiceDto> {
  return apiRequest<CarrierTransportServiceDto>(id ? `/carriers/${carrierId}/services/${id}` : `/carriers/${carrierId}/services`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(input) });
}

export function uploadCarrierLogo(carrierId: string, file: File): Promise<CarrierDto> {
  const formData = new FormData();
  formData.set('file', file);
  return apiRequest<CarrierDto>(`/carriers/${carrierId}/logo`, { method: 'POST', body: formData });
}
