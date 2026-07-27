# Shipments

Status: `IN_DESIGN`

Objective: manage real transport operations separately from freight simulations.

Scope: create shipments manually, from selected simulation option, from imports or integrations; manage snapshots, packages and current status.

Context: not implemented in schema or code.

Entities: Shipment, ShipmentAddress, ShipmentPackage, FreightSimulationOption, Customer, CarrierService.

Use Cases: create shipment, list shipments, view detail, update operational fields, create from option.

Endpoints: planned `/shipments`.

Validations: tenant ownership, address snapshots, package dimensions, status consistency.

Permissions: OPERATOR create/update operational data; MANAGER/ADMIN broader access pending approval.

Tenant: all records tenant-scoped.

Security: never infer access from tracking code alone.

Audit: creation, manual edits, cancellation and administrative reopen.

Events: `shipment.created`, `shipment.updated`, `shipment.status_changed`.

Integrations: carrier API and import sources.

Tests: create from option transaction, tenant isolation, package totals and current status.

Errors: invalid option, invalid package, terminal status, not found.

Decisions: shipment can exist without simulation.

Pending: approve shipment fields and creation sources.

History: created during domain analysis.
