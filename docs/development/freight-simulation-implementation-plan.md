# Freight Simulation Implementation Plan

Date: 2026-07-25

This plan contains only the work still needed to make freight simulation functional. It assumes the existing auth, active-user refresh validation, tenant-scoped realtime foundation, customer CRUD and `/customers` page remain in place and are reused.

## Onda 0 - Estabilizacao

1. Fix API/web Vitest startup failure.
2. Fix or document lint runtime and make lint finish.
3. Re-run typecheck/build after each wave.
4. Validate Prisma schema and current migration.
5. Define final relational model and ownership for shared files:
   - `schema.prisma`;
   - migrations;
   - shared DTOs;
   - auth/tenant context;
   - global layout/navigation;
   - Docker/env.
6. Add execution notes for MySQL test database without destructive operations on existing data.

## Onda 1 - Cadastros Para Simulacao

1. Add customer addresses to existing customer module.
2. Implement branch CRUD and branch address/main branch fields.
3. Implement carrier CRUD reusing existing `Carrier` model where possible and adding missing fields only through reviewed migration.
4. Implement carrier transport services/modalities.
5. Implement coverage rules and route eligibility testing.
6. Add frontend pages:
   - customer detail/addresses or address management inside `/customers`;
   - branches/settings;
   - carriers;
   - carrier services;
   - coverage.

## Onda 2 - Precificacao

1. Add freight rate table models, versioning and vigency.
2. Add rate ranges/bands with overlap validation.
3. Add additional charge model.
4. Implement pure domain services:
   - `UnitNormalizationService`;
   - `VolumetricWeightService`;
   - `ChargeableWeightService`;
   - `FreightPricingEngine`.
5. Add unit tests before connecting the engine to controllers.
6. Add frontend rate table management.

## Onda 3 - Integracoes

1. Implement CEP adapter using ViaCEP or BrasilAPI.
2. Implement distance/route adapter using OpenRouteService or a justified equivalent.
3. Add timeout, retry, cache and fallback.
4. Add environment variables and docs.
5. Add mocks/tests for success, invalid response, timeout and unavailable provider.

## Onda 4 - Simulacao

1. Expand simulation models:
   - addresses;
   - packages;
   - options;
   - price components;
   - unavailable service reasons.
2. Implement simulation create/calculate endpoint.
3. Use existing customer selector from `/customers` APIs.
4. Implement simulation frontend page:
   - origin/destination;
   - CEP lookup;
   - cargo value;
   - multiple volumes;
   - service/carrier filters;
   - loading/error/success states.
5. Show results comparison with cheapest/fastest flags and breakdown.

## Onda 5 - Historico e Selecao

1. Implement history list/detail endpoints.
2. Add filters and pagination.
3. Implement history page and detail page.
4. Implement option selection transaction.
5. Audit simulation creation and option selection.
6. Ensure old simulations never recalculate silently after rate changes.

## Onda 6 - Operacao

1. Add shipment models and shipment creation from selected option.
2. Persist shipment address/package snapshots.
3. Add initial tracking status/event.
4. Add shipment detail UI sufficient to prove operation was created.

## Onda 7 - Inteligencia

1. Expand dashboard KPIs using simulations/options/shipments.
2. Add simulation-specific indicators:
   - total simulations;
   - average freight;
   - average lowest option;
   - estimated savings;
   - selected carrier/service distribution;
   - shipments created from simulations.
3. Add deterministic insights from simulation history.

## Onda 8 - Validacao

1. Expand seed to complete demo narrative.
2. Run seed twice and prove no duplication.
3. Add integration tests for full simulation transaction.
4. Add E2E flow login -> simulation -> option -> shipment -> dashboard.
5. Add cross-tenant tests.
6. Run final commands:
   - lint;
   - typecheck;
   - tests;
   - build;
   - Prisma validate;
   - Docker Compose config/build.

## Final Acceptance

The flow is complete only when a real simulation can be executed end-to-end using persisted carriers, services, coverage and freight tables. The result must be deterministic, explainable, saved in history, isolated by tenant and covered by automated tests.

## Execution Status After 2026-07-25 Implementation

The core implementation waves were applied in the repository:

- Onda 1: customer addresses, branches, carriers, services and coverage were added to backend contracts and seed data.
- Onda 2: freight rate tables, ranges, additional charges and deterministic pricing engine were added.
- Onda 3: CEP lookup was added through ViaCEP with fallback; route distance currently uses deterministic local fallback unless coordinates are supplied.
- Onda 4: freight simulation create/list/detail endpoints and `/freight/simulate` UI were added.
- Onda 5: history listing and option selection were added.
- Onda 6: Shipment creation from selected option with snapshots was added.
- Onda 7: dashboard summary includes simulation option and generated Shipment metrics.
- Onda 8: seed was expanded, but live migration/seed/E2E validation remains blocked in this WSL environment because Docker is unavailable and MySQL was not reachable.

Remaining before final acceptance:

1. Fix Vitest startup failure (`SyntaxError: Unexpected token '*'`) so tests execute.
2. Run migrations in a MySQL-enabled environment.
3. Run seed twice and prove idempotency in the database.
4. Execute browser E2E login -> simulation -> option selection -> Shipment -> dashboard.
5. Replace or configure the route integration with a real external route provider when public distance validation is required.
