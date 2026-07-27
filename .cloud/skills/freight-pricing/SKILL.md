# Freight Pricing

Status: `IN_DESIGN`

Objective: model versioned carrier service pricing for explainable freight simulations.

Scope: rate table lifecycle, lanes, weight bands, fee components, validity and calculation.

Context: not implemented; current Carrier model is insufficient for service-specific pricing.

Entities: FreightRateTable, CarrierService, FreightSimulationOption.

Use Cases: create draft table, publish table, calculate price, retire table.

Endpoints: planned `/freight-rate-tables`.

Validations: effective dates, non-overlapping ranges, decimal precision and active service.

Permissions: ADMIN/MANAGER maintain; OPERATOR reads through simulation only.

Tenant: rate tables tenant-scoped.

Security: rate data may be commercially sensitive and must be access-controlled.

Audit: rate table creation, publication and retirement.

Events: `rate_table.published`, `rate_table.retired`.

Integrations: imports and future carrier quotation APIs.

Tests: min freight, cubing, fee breakdown, validity, inactive rates and tenant isolation.

Errors: no active rate, overlapping band, invalid decimal, stale rate version.

Decisions: relational MVP with limited validated JSON for output breakdowns.

Pending: approve first tariff examples.

History: created during domain analysis.
