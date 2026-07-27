# Freight

Status: `IN_DESIGN`

Objective: simulate freight and compare carrier service options.

Scope: input validation, address normalization, distance estimate, rate evaluation, option persistence and history.

Context: current `FreightSimulation` model exists; calculation and options are not implemented.

Entities: FreightSimulation, FreightSimulationOption, Customer, CarrierService, FreightRateTable.

Use Cases: create simulation, calculate options, list history, choose option for shipment.

Endpoints: planned `/freight-simulations` and option selection endpoint.

Validations: route, weight, dimensions, cargo value, active rate table and tenant ownership.

Permissions: OPERATOR can simulate; MANAGER/ADMIN can view broader history, pending approval.

Tenant: all simulations and options are tenant-scoped.

Security: do not expose other tenants' rates or simulations.

Audit: simulation creation and option-to-shipment conversion.

Events: `simulation.created`, `simulation.calculated`.

Integrations: address API and route/distance API.

Tests: decimal precision, provider fallback, tenant isolation and option selection.

Errors: validation, unavailable provider, no eligible carrier service.

Decisions: simulation is separate from shipment.

Pending: approve pricing model and first carrier service rules.

History: moved from PLANNED to IN_DESIGN during domain analysis.
