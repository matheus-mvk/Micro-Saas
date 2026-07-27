# Freight Simulation Test Gaps

Date: 2026-07-25

## Current Test Runner State

Known current blocker:

- `npx pnpm --filter @logistics/api test` fails before specs execute with `SyntaxError: Unexpected token '*'`.
- `npx pnpm --filter @logistics/web test` fails before specs execute with the same error.

Existing tests are present for auth/token/password/login attempts, request context, realtime gateway, HTTP errors, Redis, frontend login/landing/provider/http-client and shared package basics. They are not currently executable in the observed local environment.

## Simulation Test Coverage Missing

| Area | Current coverage | Required coverage |
| --- | --- | --- |
| Customer addresses | None | Unit/integration tests for CRUD, main address rule, CEP lookup, tenant isolation and snapshots. |
| Branches | None | CRUD, main branch, active branch filtering, origin selection and tenant isolation. |
| Carriers | None | CRUD, document/code uniqueness, active filtering and audit. |
| Carrier services | None | Unique service code, modality, cubic factor, weight limits, active filtering. |
| Coverage | None | Postal/city/state rules, overlap validation, unavailable reasons, cross-tenant rejection. |
| Rate tables | None | Versioning, vigency, active/inactive behavior, audit, historical preservation. |
| Rate ranges | None | Non-overlap, boundary values, min/max behavior, null max behavior. |
| Additional charges | None | Fixed, ad valorem, GRIS, toll, insurance, extra fees, discounts. |
| Unit normalization | None | cm to m, grams to kg if supported, invalid units rejected. |
| Volumetric weight | None | Multiple packages, quantity, volume m3 and cubic factor. |
| Chargeable weight | None | max(real, cubic), service-specific override if implemented. |
| Pricing engine | None | Deterministic totals, Decimal precision, rounding, breakdown sum equals total. |
| CEP adapter | None | Valid CEP, missing CEP, timeout, retry, cache, fallback. |
| Route adapter | None | Valid route, timeout, retry, cache, fallback, external config missing. |
| Simulation API | None | Create/calculate, validation, tenant isolation, unavailable options, audit. |
| Simulation UI | None | Form validation, loading/error/empty/success, results comparison, breakdown. |
| History | None | Server-side filters, pagination, detail, historical immutable values. |
| Option selection | None | Transaction, one selected option, cross-tenant rejection, audit. |
| Shipment creation | None | Creates shipment from selected option once, snapshots values, initial tracking. |
| Dashboard | Basic endpoint only, no dedicated tests | KPIs from persisted simulations/options/shipments and tenant filters. |
| Insights | None | Deterministic insights with thresholds and evidence. |
| E2E | Landing smoke only | Login -> customer -> rate setup -> simulation -> option -> shipment -> dashboard. |

## Required Test Layers

### Unit

- pure pricing calculations;
- unit normalization;
- volumetric weight;
- chargeable weight;
- range selection;
- fee application;
- date/deadline calculation;
- adapter mapping and fallback decisions.

### Integration

- repositories/use cases with Prisma against test database;
- tenant isolation for every list/detail/mutation;
- coverage lookup and rate table lookup queries;
- simulation transaction creates all child records;
- option selection transaction;
- shipment creation transaction;
- audit writes with sanitized metadata.

### Frontend Component

- simulation form validation;
- multi-volume add/remove;
- CEP lookup states;
- result cards;
- breakdown drawer/modal;
- unavailable services;
- history filters;
- shipment creation action;
- dashboard cards.

### E2E

Minimum final E2E flow:

1. open landing;
2. login as `administrador@dev.com`;
3. open `/customers` and select or create a customer;
4. open simulation page;
5. lookup origin/destination CEP;
6. add multiple volumes;
7. run simulation;
8. verify multiple options and breakdown;
9. select cheapest option;
10. create shipment;
11. verify dashboard indicator changed;
12. logout.

### Cross-Tenant

Automated tests must prove:

- tenant A cannot read or use tenant B customers, addresses, carriers, services, rate tables, simulations, options or shipments;
- dashboard aggregates do not mix tenants;
- realtime events for import/simulation/shipment do not cross tenants;
- seed creates a second tenant with enough data to test isolation.

## Test Acceptance For Future Executor

The simulation flow cannot be marked complete until:

- Vitest startup is fixed;
- API and web test scripts pass;
- at least one integration test uses MySQL/Prisma for the full simulation transaction;
- Playwright covers the main simulation path;
- cross-tenant tests cover direct resource ID access and list aggregation;
- pricing engine has deterministic unit tests for all calculation components.
