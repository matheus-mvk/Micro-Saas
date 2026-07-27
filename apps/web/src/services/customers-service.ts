import type { CreateCustomerDto, CustomerDto, PaginatedResult, UpdateCustomerDto } from '@logistics/shared';

import { apiRequest } from './http-client';

export const customerQueryKeys = {
  list: ['customers', 'list'] as const,
};

export function getCustomers(): Promise<PaginatedResult<CustomerDto>> {
  return apiRequest<PaginatedResult<CustomerDto>>('/customers?perPage=20');
}

export function createCustomer(input: CreateCustomerDto): Promise<CustomerDto> {
  return apiRequest<CustomerDto>('/customers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCustomer(customerId: string, input: UpdateCustomerDto): Promise<CustomerDto> {
  return apiRequest<CustomerDto>(`/customers/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function updateCustomerStatus(customerId: string, active: boolean): Promise<CustomerDto> {
  return apiRequest<CustomerDto>(`/customers/${customerId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}
