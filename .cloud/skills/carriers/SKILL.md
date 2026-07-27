# Carriers

Status: `IN_DESIGN`

Objective: manage tenant carrier records and carrier service modes.

Scope: carriers, services, status, contact data, integration mapping and future coverage.

Context: current `Carrier` model exists; `CarrierService` is proposed and not implemented.

Entities: Carrier, CarrierService, FreightRateTable, Shipment.

Use Cases: register carrier, update carrier, deactivate carrier, create service, configure service.

Endpoints: planned `/carriers` and `/carrier-services`.

Validations: document/code uniqueness, service code uniqueness and active constraints.

Permissions: ADMIN/MANAGER manage; OPERATOR read, pending approval.

Tenant: every carrier and service is tenant-scoped.

Security: rate data and integration credentials must be restricted.

Audit: carrier/service create and update.

Events: `carrier.updated`, `carrier_service.changed`.

Integrations: carrier APIs and quotation services later.

Tests: tenant isolation, duplicate constraints, deactivate behavior.

Errors: duplicate carrier, inactive service, not found.

Decisions: service-specific rules do not belong directly on Carrier.

Pending: coverage model and integration account model.

History: refined during domain analysis.
