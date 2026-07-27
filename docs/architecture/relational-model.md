# Relational Model

Status: `IN_DESIGN`

This document proposes the next relational model. It does not change the current Prisma schema.

## Identifier Strategy

Recommendation: keep UUID for current tables to avoid churn. Before creating high-volume tables such as `tracking_events`, evaluate ULID for better chronological locality. Do not expose sequential IDs externally.

## Tenant Strategy

Use `tenantId` on every private high-value table even when tenant could be inherited through relationships. This improves authorization, indexing, and query review. Examples:

- required: `users`, `branches`, `customers`, `customer_addresses`, `carriers`, `carrier_services`, `freight_rate_tables`, `freight_simulations`, `freight_simulation_options`, `shipments`, `shipment_addresses`, `shipment_packages`, `tracking_events`, `import_jobs`, `import_job_rows`, `audit_logs`, `insights`.
- optional/global: `tenants`, integration catalog, public plan catalog.

For tenant-scoped foreign keys, prefer either composite constraints or transactional validation that ensures child and parent share the same `tenantId`.

## Proposed Cardinalities

| Relationship | Recommendation |
| --- | --- |
| Tenant 1:N Branch/User/Customer/Carrier/Shipment/ImportJob/AuditLog | Valid |
| Customer 1:N CustomerAddress | Valid |
| Customer 1:N Shipment | Optional on Shipment; imported shipments may not resolve customer initially |
| Carrier 1:N CarrierService | Valid |
| CarrierService 1:N FreightSimulationOption | Valid |
| CarrierService 1:N Shipment | Optional until manual/imported shipments can resolve carrier service |
| FreightSimulation 1:N FreightSimulationOption | Required for comparison |
| FreightSimulationOption 0..1:1 Shipment | Valid if a selected option can create one shipment |
| Shipment 1:N ShipmentAddress/ShipmentPackage/TrackingEvent | Valid |
| ImportJob 0..1:N Shipment/TrackingEvent | Valid through `importJobId`; not every record is imported |
| User 0..1:N TrackingEvent | Optional actor for manual/system/imported events |
| User 1:N AuditLog | Optional actor for system actions |

## Precision

| Data | Decimal |
| --- | --- |
| Money | `Decimal(12,2)` for BRL MVP; upgrade to `Decimal(14,2)` if enterprise invoices require |
| Weight kg | `Decimal(10,3)` |
| Dimensions cm | `Decimal(10,2)` |
| Distance km | `Decimal(10,2)` |
| Percentual fees | `Decimal(7,4)` |
| Cubing factor | `Decimal(10,4)` |
| Volumetric weight | `Decimal(10,3)` |

## Dates

Store UTC in MySQL `DateTime(3)`. Display timezone comes from tenant/user preferences. Use:

- `createdAt`, `updatedAt`: technical persistence timestamps.
- `deletedAt`: soft deletion when applicable.
- `occurredAt`: when logistics event occurred.
- `receivedAt`: when platform received external/imported event.
- `effectiveFrom`, `effectiveTo`: rate table validity.
- `currentStatusAt`: timestamp used for shipment current state.

## Uniqueness

| Entity | Recommended uniqueness |
| --- | --- |
| User | `(tenantId, email)` for MVP; revisit membership model later |
| Customer | `(tenantId, document)` when document present; consider normalized document |
| CustomerAddress | `(tenantId, customerId, label)` if labels are unique per customer |
| Carrier | `(tenantId, document)`, `(tenantId, code)` |
| CarrierService | `(tenantId, carrierId, code)` |
| FreightRateTable | `(tenantId, carrierServiceId, version)` |
| Shipment | `(tenantId, trackingCode)` when present; `(tenantId, source, externalReference)` when present |
| TrackingEvent | `(tenantId, source, externalEventId)` when external ID exists |
| ImportJob | `(tenantId, idempotencyKey)` for retries |

Nullable unique columns in MySQL allow multiple `NULL` values. Decide explicitly whether that is acceptable per field.

## Indexes

Create indexes only for expected query patterns:

- `Shipment(tenantId, currentStatus, createdAt)`: operational lists by status.
- `Shipment(tenantId, customerId, createdAt)`: customer detail history.
- `Shipment(tenantId, carrierServiceId, createdAt)`: carrier performance.
- `Shipment(tenantId, estimatedDeliveryAt)`: lateness monitoring.
- `Shipment(tenantId, externalReference)`: support and integrations.
- `TrackingEvent(tenantId, shipmentId, occurredAt)`: timeline.
- `TrackingEvent(tenantId, source, externalEventId)`: idempotency.
- `FreightSimulation(tenantId, createdAt)`: history by period.
- `FreightSimulationOption(tenantId, simulationId, amount)`: comparison.
- `ImportJob(tenantId, status, createdAt)`: import monitor.
- `AuditLog(tenantId, entityType, entityId, createdAt)`: resource audit.
- `Insight(tenantId, status, priority, validUntil)`: dashboard.

## Deletion and Cascade

- Tenant: no hard delete while child data exists; use suspension and retention workflows.
- User: deactivate; preserve audit links with `SetNull` actor if required.
- Customer/Carrier/CarrierService: deactivate or soft delete; do not cascade shipments.
- FreightSimulation/Option: immutable enough for history; no cascade delete after option selection.
- Shipment/TrackingEvent/AuditLog/ImportJob: no destructive cascade delete.
- CustomerAddress: soft delete if referenced by future operations; shipment snapshots remain immutable.

## Transactions

Mandatory transaction cases:

- create shipment from selected simulation option;
- append status-changing tracking event and update shipment current status;
- process import row and update job counters;
- change role/status and write audit log;
- create or rotate refresh token family;
- persist domain event/outbox record with state change.
