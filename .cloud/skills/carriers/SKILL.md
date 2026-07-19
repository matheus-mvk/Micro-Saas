# Carriers

Status: `PLANNED`

Objective: manage tenant carrier records and future quotation rules.

Scope: create, list, update, deactivate, filters and pagination.

Context: model prepared only.

Entities: Carrier and FreightSimulation.

Use Cases: register carrier, update carrier and deactivate carrier.

Endpoints: planned `/carriers`.

Validations: tenant-scoped document and code uniqueness.

Permissions: matrix pending.

Tenant: every query includes tenant id.

Security: carrier rates future must be access controlled.

Audit: create and update carrier.

Events: none initially.

Integrations: quotation service future.

Tests: validation and tenant isolation.

Errors: standard API error contract.

Decisions: minimal initial model.

Pending: module specification.

History: planned during foundation.
