# Customers

Status: `PLANNED`

Objective: manage tenant customer records for freight operations.

Scope: create, list, update, deactivate, filters and pagination.

Context: model prepared only.

Entities: Customer and FreightSimulation.

Use Cases: register customer, update customer and deactivate customer.

Endpoints: planned `/customers`.

Validations: tenant-scoped document uniqueness and contact fields.

Permissions: matrix pending.

Tenant: every query includes tenant id.

Security: no customer data across tenants.

Audit: create and update customer.

Events: none initially.

Integrations: document/address enrichment future.

Tests: pagination, validation and tenant isolation.

Errors: standard API error contract.

Decisions: minimal initial model.

Pending: module specification.

History: planned during foundation.
