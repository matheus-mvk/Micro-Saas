import type {
  AddressDto,
  BranchDto,
  CarrierDto,
  FreightSimulationCreateDto,
  FreightSimulationDto,
  FreightSimulationListItemDto,
  PaginatedResult,
  ShipmentDto,
} from '@logistics/shared';

import { apiRequest } from './http-client';

export const freightQueryKeys = {
  branches: ['freight', 'branches'] as const,
  carriers: ['freight', 'carriers'] as const,
  historyRoot: ['freight', 'history'] as const,
  history: (filters: { endDate?: string; startDate?: string }) => ['freight', 'history', filters] as const,
};

export function lookupAddress(postalCode: string): Promise<AddressDto> {
  return apiRequest<AddressDto>(`/freight-simulations/address-lookup/${encodeURIComponent(postalCode)}`);
}

export function getBranches(): Promise<PaginatedResult<BranchDto>> {
  return apiRequest<PaginatedResult<BranchDto>>('/branches?perPage=50');
}

export function getCarriers(): Promise<PaginatedResult<CarrierDto>> {
  return apiRequest<PaginatedResult<CarrierDto>>('/carriers?perPage=50');
}

export function createFreightSimulation(input: FreightSimulationCreateDto): Promise<FreightSimulationDto> {
  return apiRequest<FreightSimulationDto>('/freight-simulations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getFreightSimulationHistory(filters: { endDate?: string; startDate?: string } = {}): Promise<PaginatedResult<FreightSimulationListItemDto>> {
  const params = new URLSearchParams({ perPage: '20' });
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  return apiRequest<PaginatedResult<FreightSimulationListItemDto>>(`/freight-simulations?${params.toString()}`);
}

export function selectFreightOption(simulationId: string, optionId: string): Promise<FreightSimulationDto> {
  return apiRequest<FreightSimulationDto>(`/freight-simulations/${simulationId}/options/${optionId}/select`, {
    method: 'POST',
  });
}

export function createShipmentFromSimulation(simulationId: string): Promise<ShipmentDto> {
  return apiRequest<ShipmentDto>(`/freight-simulations/${simulationId}/shipments`, {
    method: 'POST',
  });
}
