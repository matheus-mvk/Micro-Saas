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
  history: ['freight', 'history'] as const,
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

export function getFreightSimulationHistory(): Promise<PaginatedResult<FreightSimulationListItemDto>> {
  return apiRequest<PaginatedResult<FreightSimulationListItemDto>>('/freight-simulations?perPage=20');
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
