# Domain

Status: `IN_DESIGN`

The product domain is multi-tenant logistics intelligence and freight management.

Current foundation entities: Tenant, Branch, User, RefreshToken, Customer, Carrier, FreightSimulation, ImportJob and AuditLog.

Recommended next domain entities:

- CustomerAddress for reusable customer addresses.
- CarrierService for carrier service modes.
- FreightRateTable and related rate rows for versioned pricing.
- FreightSimulationOption for comparison results.
- Shipment for real transport operations.
- ShipmentAddress for immutable address snapshots.
- ShipmentPackage for cargo volumes.
- TrackingEvent for immutable logistics facts.
- ImportJobRow for row-level validation and reporting.
- Insight for explainable recommendations.

Key distinctions:

- FreightSimulation is an estimate and comparison workflow.
- Shipment is an operational transport workflow.
- TrackingEvent records logistics facts.
- AuditLog records system accountability.
