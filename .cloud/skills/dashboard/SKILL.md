# Dashboard

Status: `IN_DESIGN`

Objective: provide tenant-scoped operational indicators and drill-downs.

Scope: simulations, shipments, tracking, imports, carrier performance and cost trends.

Context: web dashboard placeholder exists; no API aggregations exist.

Entities: FreightSimulation, FreightSimulationOption, Shipment, TrackingEvent, ImportJob, Insight.

Use Cases: view summary, filter by period/status/carrier/customer/route, drill into records.

Endpoints: planned `/dashboard/summary`, `/dashboard/shipments`, `/dashboard/simulations`.

Validations: date range, tenant scope, pagination and filter limits.

Permissions: MANAGER/ADMIN default; OPERATOR limited view pending approval.

Tenant: aggregates only current tenant data.

Security: no cross-tenant aggregate leakage or hidden count inference.

Audit: dashboard export and admin reports.

Events: `dashboard.updated`.

Integrations: none for MVP metrics.

Tests: aggregation correctness, empty state and authorization.

Errors: invalid date range, partial data, unavailable projection.

Decisions: no fake charts; metrics must use real data and show source period.

Pending: KPI definitions and projection strategy.

History: refined during domain analysis.
