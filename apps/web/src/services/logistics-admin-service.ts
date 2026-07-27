import type { BranchDto, CarrierDto, CarrierTransportServiceDto, PaginatedResult } from '@logistics/shared';

import { apiRequest } from './http-client';

export const logisticsAdminQueryKeys = {
  branches: ['admin-logistics', 'branches'] as const,
  carriers: ['admin-logistics', 'carriers'] as const,
};

export interface BranchInput {
  name: string;
  code: string;
  postalCode?: string;
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
  main?: boolean;
  email?: string;
  phone?: string;
  complement?: string;
  country?: string;
  active?: boolean;
}

export interface CarrierInput {
  name: string;
  code?: string;
  document?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  contactName?: string;
  site?: string;
  notes?: string;
  stateRegistration?: string;
}

export interface ServiceInput {
  code: string;
  name: string;
  modality: string;
  description?: string;
  defaultDeadlineDays: number;
  cubicFactor: number;
  minWeightKg?: number;
  maxWeightKg?: number;
  minimumValue: number;
  maxLengthCm?: number;
  maxWidthCm?: number;
  maxHeightCm?: number;
  status?: 'ACTIVE' | 'INACTIVE';
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
