# Customers

Status: `IN_DESIGN`

Objective: manage tenant customer records and reusable customer addresses.

Scope: create, list, update, deactivate, address management, filters, pagination and imports.

Context: current `Customer` model exists; `CustomerAddress` is proposed and not implemented.

Entities: Customer, CustomerAddress, Shipment.

Use Cases: register customer, update customer, deactivate customer, manage addresses.

Endpoints: planned `/customers` and nested `/customers/{id}/addresses`.

Validations: document normalization, contact fields, address fields and tenant-scoped uniqueness.

Permissions: ADMIN/MANAGER manage; OPERATOR may read and create if approved.

Tenant: every query uses tenant context.

Security: no customer data across tenants; PII must be masked in logs.

Audit: create, update, deactivate and address changes.

Events: `customer.created`, `customer.updated`.

Integrations: ViaCEP or BrasilAPI for address enrichment.

Tests: pagination, validation, tenant isolation and soft-deactivate behavior.

Errors: duplicate document, invalid document, not found without cross-tenant leak.

Decisions: customer addresses are not shipment history.

Pending: CPF/CNPJ rules and address requirements.

History: refined during domain analysis.
