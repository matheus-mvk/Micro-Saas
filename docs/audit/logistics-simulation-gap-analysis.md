# Logistics Simulation Gap Analysis

Date: 2026-07-25

Scope: read-only analysis of freight simulation, pricing and downstream logistics operation.

## Current State

The current repository has only one persistence model related to simulation:

- `FreightSimulation` in `apps/api/prisma/schema.prisma`.

The seed creates one calculated demo row with static values:

- origin postal code `01001000`
- destination postal code `20040002`
- real weight `42.500`
- cubic weight `38.200`
- estimated price `128.90`
- estimated deadline `3`
- metadata route text

There is no simulation controller, service, domain pricing engine, carrier service model, coverage model, rate table model, rate band model, simulation option model, selection model, shipment model, tracking model or frontend simulation page.

## Required Flow vs Current Evidence

| Requirement | Current status | Evidence | Gap |
| --- | --- | --- | --- |
| Optional customer | PARTIALLY_IMPLEMENTED | `FreightSimulation.customerId` exists | No endpoint validates customer by tenant or preserves customer snapshot. |
| Origin/destination addresses | PARTIALLY_IMPLEMENTED | Postal code fields exist | No full address, city/state/country, coordinates or snapshots. |
| Multiple volumes | NOT_IMPLEMENTED | No volume table/model | No quantity, weight/dimensions per package or volume aggregation. |
| Real weight | PARTIALLY_IMPLEMENTED | `realWeightKg` exists | No input validation or calculation from multiple volumes. |
| Cubic weight | PARTIALLY_IMPLEMENTED | `cubicWeightKg` exists | No formula, factor source, unit conversion or tests. |
| Chargeable weight | NOT_IMPLEMENTED | No field/engine | Must use max(real, cubic) or documented carrier rule. |
| Carrier/service eligibility | NOT_IMPLEMENTED | No carrier service/coverage models | Cannot filter active services, weight limits or coverage. |
| Rate table lookup | NOT_IMPLEMENTED | No rate table model | Cannot select active/vigency/version/range. |
| Fee breakdown | NOT_IMPLEMENTED | No option/breakdown model | No base, minimum, per kg, ad valorem, GRIS, toll, insurance, discount or total breakdown. |
| Multiple options | NOT_IMPLEMENTED | No simulation option table | Cannot compare carriers/services, cheapest or fastest option. |
| Unavailable reasons | NOT_IMPLEMENTED | No eligibility engine | Cannot explain no coverage, inactive service or weight limits. |
| Deterministic calculation | NOT_IMPLEMENTED | Values are seeded directly | No pure pricing service or unit tests. |
| Historical preservation | PARTIALLY_IMPLEMENTED | Stored estimated fields and metadata JSON | No rate version, option breakdown, rule snapshots or address snapshots. |
| Select option | NOT_IMPLEMENTED | No option/selection field | Cannot select, unselect or audit selection. |
| Create shipment | NOT_IMPLEMENTED | No shipment model/API | Cannot transform simulation into operation. |
| History list/detail | NOT_IMPLEMENTED | No endpoint/page | Cannot query or inspect persisted simulation records. |
| Dashboard integration | PARTIALLY_IMPLEMENTED | Dashboard counts simulations and average estimated price | Missing required logistics KPIs and filters. |

## Pricing Engine Gaps

The repository lacks a domain service responsible for:

- normalizing units;
- calculating total physical weight;
- calculating total volume;
- calculating cubic weight;
- calculating chargeable weight;
- selecting coverage;
- selecting rate table and rate band;
- applying minimum value;
- applying base price and per-kg price;
- applying ad valorem, GRIS, toll, insurance, extra fees and discounts;
- calculating deadline and estimated delivery date;
- returning an explainable breakdown;
- preserving rule version and inputs.

## Required Data Model Additions

The implementation prompt should require, at minimum:

- `CarrierService`
- `ServiceCoverage`
- `FreightRateTable`
- `FreightRateVersion` or explicit version fields
- `FreightRateBand`
- `FreightRateAdditionalFee` or structured fee configuration
- `FreightSimulationVolume`
- `FreightSimulationOption`
- `FreightSimulationSelectedOption` or selected option relation
- address snapshot structures for simulation and shipment
- `Shipment`
- `ShipmentVolume`
- `TrackingEvent`

## Required Endpoints

Minimum endpoints for simulation completion:

- `POST /api/v1/freight-simulations`
- `GET /api/v1/freight-simulations`
- `GET /api/v1/freight-simulations/:id`
- `POST /api/v1/freight-simulations/:id/select-option`
- `POST /api/v1/freight-simulations/:id/shipments`
- supporting endpoints for carriers/services/coverage/rate tables.

All endpoints must derive `tenantId` from the authenticated context and must never accept tenant selection from the frontend.

## Required Frontend Screens

- simulation form with origin/destination, CEP lookup, optional customer, cargo value and multiple volumes;
- results comparison with cheapest/fastest flags;
- option detail drawer/modal with full breakdown;
- unavailable services/reasons;
- history listing with filters and pagination;
- history detail page;
- create shipment action and success feedback.

## Acceptance Criteria For Simulation

A simulation is complete only when the evaluator can:

1. login as `administrador@dev.com`;
2. create or select a customer;
3. fill origin and destination by CEP and edit manually;
4. add multiple volumes with quantity, weight and dimensions;
5. calculate real, cubic and chargeable weight deterministically;
6. identify eligible active carriers/services by coverage and limits;
7. locate a current rate table and weight band;
8. calculate all fee components with Decimal-safe precision;
9. generate multiple persisted options;
10. display cheapest and fastest options;
11. display full explainable breakdown;
12. persist original inputs, volumes, rule versions and options;
13. list and filter history from the database;
14. select one option transactionally;
15. create a shipment from the selected option;
16. audit simulation creation and selection;
17. prevent cross-tenant access;
18. pass unit, integration and e2e tests.

## Risk

The current UI and dashboard can give the impression that simulation exists, but the only simulation data is seed data and there is no functional freight calculation journey. This must be treated as `PARTIALLY_IMPLEMENTED`, not complete.
