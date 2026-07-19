# Freight

Status: `PLANNED`

Objective: simulate and persist freight estimates.

Scope: origin, destination, real weight, dimensions, cubic weight, cargo value, distance, carrier, deadline and price.

Context: domain fields exist; calculation is not implemented.

Entities: FreightSimulation, Customer and Carrier.

Use Cases: simulate freight, queue simulation and review history.

Endpoints: planned `/freight-simulations`.

Validations: numeric precision, required route data and tenant ownership.

Permissions: matrix pending.

Tenant: all simulations scoped by tenant.

Security: do not expose other tenants' rates or history.

Audit: simulation creation and administrative changes.

Events: queued simulation progress future.

Integrations: ViaCEP/BrasilAPI and route provider candidate.

Tests: calculation rules after specification.

Errors: validation and provider failure mapping.

Decisions: Decimal for money and measurements.

Pending: business rules.

History: planned during foundation.
