# Dashboard

Status: `PLANNED`

Objective: provide operational indicators for logistics decisions.

Scope: simulation volume, average cost, frequent routes, carriers, savings, trends and recent operations.

Context: placeholder UI exists only.

Entities: FreightSimulation, Carrier, Customer, ImportJob and AuditLog.

Use Cases: view indicators and drill into operational records.

Endpoints: planned `/dashboard`.

Validations: date ranges and tenant scope.

Permissions: matrix pending.

Tenant: aggregate only current tenant data.

Security: no cross-tenant aggregate leakage.

Audit: administrative dashboard exports future.

Events: realtime dashboard updates future.

Integrations: analytics future.

Tests: aggregation correctness and access control.

Errors: empty state when no data exists.

Decisions: no fake charts until data contracts exist.

Pending: metric definitions.

History: planned during foundation.
