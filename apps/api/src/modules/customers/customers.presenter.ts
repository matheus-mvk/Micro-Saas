import type { CustomerDto } from '@logistics/shared';
import type { Customer } from '@prisma/client';

export function presentCustomer(customer: Customer): CustomerDto {
  return {
    active: customer.active,
    createdAt: customer.createdAt.toISOString(),
    document: customer.document,
    email: customer.email,
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    updatedAt: customer.updatedAt.toISOString(),
  };
}
