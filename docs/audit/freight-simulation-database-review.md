# Freight Simulation Database Review

Date: 2026-07-25

Scope: MySQL/Prisma review for the future full freight simulation flow.

## Current Schema Summary

Current simulation-related schema is minimal:

- `branches`
- `customers`
- `carriers`
- `freight_simulations`
- `audit_logs`

`freight_simulations` currently stores a single flattened simulation-like row:

- `tenant_id`
- optional `customer_id`
- optional `carrier_id`
- origin/destination postal codes
- real/cubic weight
- length/width/height
- cargo value
- distance
- estimated price
- estimated deadline
- status
- metadata JSON

This shape is insufficient for a real comparative simulation because it cannot persist multiple packages, multiple carrier/service options, price components, rate versions, address snapshots, selected option or shipment relation.

## Existing Useful Indexes

Current indexes relevant to simulation:

- `branches`: unique `(tenant_id, code)`, index `(tenant_id, active)`.
- `customers`: unique `(tenant_id, document)`, index `(tenant_id, active, name)`.
- `carriers`: unique `(tenant_id, document)`, unique `(tenant_id, code)`, index `(tenant_id, active, name)`.
- `freight_simulations`: index `(tenant_id, status, created_at)`, index `(tenant_id, origin_postal_code, destination_postal_code)`.
- `audit_logs`: index `(tenant_id, action, created_at)`, index `(actor_id, created_at)`.

These indexes are a good starting point but do not cover the required future joins because the required tables do not exist.

## Required Model Additions

Minimum relational models for the executor:

| Model | Purpose | Required constraints/indexes |
| --- | --- | --- |
| `CustomerAddress` | Multiple addresses per customer. | `(tenantId, customerId)`, `(tenantId, postalCode)`, one main address policy. |
| `CarrierService` | Services/modalities under each carrier. | unique `(tenantId, carrierId, code)`, `(tenantId, carrierId, active)`, `(tenantId, active, modality)`. |
| `CarrierCoverage` | Coverage rules for carrier service. | `(tenantId, carrierServiceId, active)`, indexes for origin/destination state/city/postal range. |
| `FreightRateTable` | Versioned pricing table. | unique `(tenantId, carrierServiceId, version)`, `(tenantId, carrierServiceId, active, startsAt, endsAt)`. |
| `FreightRateRange` | Weight bands/ranges. | `(tenantId, freightRateTableId, minWeightKg, maxWeightKg)`, overlap validated in service and tests. |
| `FreightAdditionalCharge` | Fee configuration. | `(tenantId, freightRateTableId, type, active)`. |
| `FreightSimulationAddress` | Immutable origin/destination snapshots. | `(tenantId, freightSimulationId, type)`. |
| `FreightSimulationPackage` | Multiple packages/volumes. | `(tenantId, freightSimulationId)`. |
| `FreightSimulationOption` | Carrier/service option result. | `(tenantId, freightSimulationId, totalPrice)`, `(tenantId, freightSimulationId, deadlineDays)`, unique selected option rule if modeled with flag. |
| `FreightSimulationPriceComponent` | Breakdown rows. | `(tenantId, freightSimulationOptionId, type)`. |
| `Shipment` | Operation created from option. | `(tenantId, trackingCode)`, `(tenantId, externalReference)`, `(tenantId, status, estimatedDeliveryAt)`, `(tenantId, customerId, createdAt)`. |
| `ShipmentAddress` | Immutable shipment snapshots. | `(tenantId, shipmentId, type)`. |
| `ShipmentPackage` | Shipment packages. | `(tenantId, shipmentId)`. |

Snapshots may use JSON only for immutable source payloads or metadata, not to avoid modeling relationships, filters, ranges, statuses, price components or packages.

## Decimal and Precision Requirements

Use Prisma `Decimal`/MySQL `DECIMAL`, not floating point, for:

- money values: `DECIMAL(12,2)` or larger if needed;
- percentages: `DECIMAL(8,4)`;
- weight kg: `DECIMAL(10,3)`;
- dimensions cm: `DECIMAL(10,2)`;
- volume m3: `DECIMAL(12,6)`;
- distance km: `DECIMAL(10,2)`.

The pricing engine must centralize rounding:

- money rounded to 2 decimal places after each final component calculation;
- internal weight and volume calculations keep at least 3 decimal places;
- final total equals the sum of persisted price components.

## Query and Index Review For Critical Paths

### Active carrier services

Expected query:

- tenant equality;
- carrier active;
- service active;
- optional carrier/service filters.

Required indexes:

- `Carrier`: `(tenantId, active, name)`.
- `CarrierService`: `(tenantId, active, carrierId)`.

### Coverage lookup

Expected query:

- tenant equality;
- carrierServiceId equality;
- active equality;
- origin/destination by state/city or postal ranges.

Required:

- index `(tenantId, carrierServiceId, active)`;
- separate range-aware indexes for postal prefix/range strategy chosen;
- documented query plan. Avoid broad `%contains%` lookups for CEP.

### Rate table vigente

Expected query:

- tenant equality;
- carrierServiceId equality;
- active equality;
- `startsAt <= simulationDate`;
- `endsAt IS NULL OR endsAt >= simulationDate`;
- order by version/effective date.

Required index:

- `(tenantId, carrierServiceId, active, startsAt, endsAt)`.

### Weight range lookup

Expected query:

- tenant equality;
- freightRateTableId equality;
- `minWeightKg <= chargeableWeight`;
- `maxWeightKg IS NULL OR maxWeightKg >= chargeableWeight`;
- order by priority/minWeight.

Required index:

- `(tenantId, freightRateTableId, minWeightKg, maxWeightKg)`.

The service must validate non-overlapping bands because MySQL cannot express this constraint directly with a simple unique index.

### History listing

Required list filters:

- period;
- customer;
- user;
- carrier;
- service;
- origin/destination;
- selected option;
- shipment relation.

Required indexes:

- `FreightSimulation`: `(tenantId, createdAt)`, `(tenantId, customerId, createdAt)`, `(tenantId, createdById, createdAt)` after adding `createdById`.
- `FreightSimulationOption`: `(tenantId, freightSimulationId)`, `(tenantId, carrierId, createdAt)`, `(tenantId, carrierServiceId, createdAt)`.
- `Shipment`: `(tenantId, simulationId)` or `(tenantId, selectedOptionId)`.

### Dashboard

Dashboard must avoid loading all rows into Node.js. Use aggregate queries or grouped raw SQL where Prisma aggregate is not expressive enough. Add indexes for:

- `(tenantId, createdAt)`;
- `(tenantId, status, createdAt)`;
- `(tenantId, carrierId, createdAt)`;
- `(tenantId, carrierServiceId, createdAt)`;
- `(tenantId, estimatedDeliveryAt)`.

### Audit

Simulation audit filters require:

- `(tenantId, action, createdAt)`;
- `(tenantId, entityType, entityId, createdAt)` if details link by resource.

## Transaction Requirements

Use transactions for:

- creating simulation plus addresses/packages/options/components;
- selecting option and clearing previous selection;
- creating shipment from selected option plus address/package snapshots plus initial tracking event;
- rate table version changes that affect multiple rows;
- seed setup for coherent demo data where feasible.

Do not include external API calls inside DB transactions. Fetch CEP/route data before opening the transaction or use cached data.

## Concurrency Requirements

Constraints must be the final defense for:

- unique carrier service code per carrier and tenant;
- unique rate table version per service and tenant;
- idempotent shipment creation from selected option;
- unique tracking code within tenant;
- idempotent seed IDs/upserts.

For option selection, use a transaction and either:

- a single selected option field on `FreightSimulation`, or
- a unique constraint strategy that prevents multiple selected options for one simulation.

## Current Database Risks

- `FreightSimulation` currently has no createdBy user relation, no branch relation and no selected option relation.
- `metadata` JSON stores demo context and could become a dumping ground if not controlled.
- `Customer` has no addresses; address history cannot be preserved.
- `Carrier` has no services; pricing cannot distinguish economic/express/same day/etc.
- There is no relational representation for price components, making dashboard/insights impossible without parsing JSON.
- No executable DB tests currently prove cross-tenant isolation or seed idempotency.
