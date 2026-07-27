# Freight Simulation Complete Execution Prompt

You are Codex working in `/mnt/c/projetos/micro-saas`.

This is an implementation execution prompt for the freight simulation flow only. Do not redo already functional foundation unless needed to integrate the flow.

## Existing Foundation To Reuse

Confirm directly in code, then reuse:

- basic authentication and session endpoints;
- refresh token validation rejecting non-`ACTIVE` users;
- tenant context from authenticated request;
- realtime tenant isolation derived from authenticated token/cookie;
- initial customer CRUD at `/api/v1/customers`;
- server-side customer pagination;
- CPF/CNPJ validation in `CustomersService`;
- `CUSTOMER_CHANGED` audit on customer mutations;
- frontend `/customers` page;
- dashboard summary foundation.

Do not rebuild these from scratch. Extend them only where the simulation flow requires it, such as customer addresses or customer selection.

## Known Blockers To Fix First

- API/web Vitest fail before specs execute with `SyntaxError: Unexpected token '*'`.
- Web build compiles but local Next validation did not finish.
- Lint was inconclusive.
- Seed is incomplete for simulation.
- No E2E covers the flow.

## Target Functional Flow

The final evaluator must be able to:

1. authenticate with demo user;
2. select or create a customer;
3. select origin;
4. select destination;
5. lookup addresses by CEP;
6. enter cargo value;
7. enter multiple packages/volumes;
8. calculate real weight;
9. calculate volume;
10. calculate cubic weight;
11. calculate chargeable weight;
12. calculate distance;
13. locate active carriers;
14. locate active carrier services;
15. validate coverage;
16. locate active rate tables by vigency;
17. locate weight ranges;
18. calculate base price;
19. apply minimum value;
20. apply price per kilogram;
21. apply ad valorem;
22. apply GRIS;
23. apply toll;
24. apply insurance;
25. apply additions and discounts;
26. calculate deadline;
27. generate options;
28. flag best price;
29. flag best deadline;
30. show breakdown;
31. save simulation;
32. consult history;
33. select an option;
34. generate a Shipment;
35. see the operation in indicators.

## Rules

- Do not use `Math.random` for freight results.
- Do not hardcode freight numbers in frontend.
- Do not calculate price in frontend.
- Do not use JavaScript `number`/MySQL float for money.
- Do not price inactive carriers or services.
- Do not price services without coverage.
- Do not use rules outside vigency.
- Do not silently recalculate historical simulations.
- Do not use JSON as a substitute for relational models. JSON is acceptable only for bounded immutable metadata/snapshots with justification.
- Every operational query must use tenant from authenticated server context.
- Every mutation must audit relevant simulation/rate/shipment actions with sanitized metadata.

## Onda 0 - Estabilizacao

1. Fix Vitest startup for API and web.
2. Fix lint runtime so `pnpm lint` completes.
3. Run baseline:
   - `pnpm typecheck`;
   - `pnpm test`;
   - `pnpm build`;
   - `pnpm --filter @logistics/api exec prisma validate`;
   - `docker compose config`.
4. Confirm shared contracts and ownership for:
   - `schema.prisma`;
   - migrations;
   - `packages/shared/src/index.ts`;
   - auth/tenant context;
   - frontend app shell/navigation.
5. Define final simulation ERD with Senior MySQL Database Analyst before migration.

## Onda 1 - Cadastros

Implement only missing pieces:

### Customer addresses

- Add `CustomerAddress` model with `tenantId`, `customerId`, type, postal code, street, number, complement, district, city, state, country, coordinates, main/pickup/delivery flags, active timestamps.
- Add endpoints under customers or addresses.
- Add UI for customer addresses, reusing `/customers`.
- Keep existing customer CRUD intact.

### Branches

- Extend or relate `Branch` to address/contact/main branch.
- Add branch CRUD endpoints/pages.
- Make active branch selectable as simulation origin.

### Carriers

- Add carrier CRUD endpoints/pages using existing `Carrier` model and migration for missing fields when needed.
- Preserve tenant uniqueness and active filtering.

### Carrier transport services

- Add `CarrierService` model with carrier, code, name, modality, description, default deadline, cubic factor, min/max weight, minimum value and active status.
- Enforce unique service code per carrier and tenant.
- Add endpoints/pages.

### Coverage

- Add `CarrierCoverage` model for origin/destination coverage by postal range, city/state/region or documented strategy.
- Add coverage CRUD and route test endpoint.
- Validate overlap and active status.

## Onda 2 - Precificacao

Add models and migrations:

- `FreightRateTable`;
- `FreightRateRange`;
- `FreightAdditionalCharge`;
- indexes reviewed by MySQL specialist.

Implement:

- rate table CRUD;
- version and vigency;
- range CRUD with overlap validation;
- charge CRUD for fixed, ad valorem, GRIS, toll, insurance, additions and discounts;
- audit on pricing changes.

### Calculation contracts

Units:

- dimensions input in centimeters;
- weight input in kilograms;
- volume calculated in cubic meters;
- distance in kilometers;
- currency BRL by default unless table defines another currency.

Formulas:

- per-package volume m3 = `(lengthCm / 100) * (widthCm / 100) * (heightCm / 100) * quantity`;
- total real weight kg = sum `weightKg * quantity`;
- total volume m3 = sum package volumes;
- cubic weight kg = `totalVolumeM3 * cubicFactor`;
- chargeable weight kg = `max(realWeightKg, cubicWeightKg)` unless an explicit service rule says otherwise;
- estimated delivery date = desired ship date plus service/range deadline in business/calendar days according to documented rule.

Money and rounding:

- use Prisma Decimal/decimal library for all money and precision operations;
- persist monetary values as `DECIMAL`;
- round persisted money components to 2 decimal places;
- final total must equal sum of persisted components.

Unit tests must cover:

- unit normalization;
- volume;
- cubic weight;
- chargeable weight;
- rate range boundaries;
- minimum price;
- fixed fee;
- per-kg price;
- excess weight;
- ad valorem;
- GRIS;
- toll;
- insurance;
- additions;
- discounts;
- deadline;
- breakdown sum.

## Onda 3 - Integracoes

Implement:

- CEP adapter using ViaCEP or BrasilAPI;
- route/distance adapter using OpenRouteService or justified equivalent;
- timeout;
- retry limited to safe attempts;
- cache with tenant-aware or provider-aware key where appropriate;
- fallback behavior documented;
- structured logs without sensitive data;
- environment variables in `.env.example`;
- tests with mocks for success, timeout, unavailable service and invalid payload.

Do not count OAuth providers as logistics integrations.

## Onda 4 - Simulacao

Add or expand models:

- `FreightSimulation` with `createdById`, branch/customer relation when applicable and status;
- `FreightSimulationAddress`;
- `FreightSimulationPackage`;
- `FreightSimulationOption`;
- `FreightSimulationPriceComponent`.

Implement endpoints:

- `POST /api/v1/freight-simulations`;
- `GET /api/v1/freight-simulations`;
- `GET /api/v1/freight-simulations/:id`;
- `POST /api/v1/freight-simulations/:id/recalculate` only if documented and never mutates historical result silently.

Processing:

1. validate input;
2. validate customer/branch/addresses within tenant;
3. lookup CEP/route when requested;
4. normalize units;
5. compute weights;
6. load active carriers/services;
7. validate coverage;
8. find active rate table by date;
9. find matching range;
10. price option;
11. persist simulation, addresses, packages, options and price components in one transaction;
12. persist unavailable service reasons;
13. audit creation.

Frontend:

- create `/freight/simulate` or equivalent route;
- customer selector using existing customers API;
- origin/destination form with CEP lookup;
- multiple package editor;
- cargo value;
- submit state;
- results comparison;
- cheapest/fastest flags;
- breakdown drawer/modal;
- unavailable services list.

## Onda 5 - Historico E Selecao

Implement:

- history list/detail endpoints with filters:
  - period;
  - customer;
  - user;
  - carrier;
  - service;
  - origin/destination;
  - value range;
  - selected option;
  - with/without shipment.
- history frontend pages.
- option selection endpoint:
  - `POST /api/v1/freight-simulations/:id/options/:optionId/select`.
- selection transaction with one selected option per simulation.
- audit action for option selection.

Acceptance:

- selecting an option from another tenant or another simulation fails.
- historical option values and components never change when rate tables are edited later.

## Onda 6 - Operacao

Implement:

- `Shipment`;
- `ShipmentAddress`;
- `ShipmentPackage`;
- minimal tracking initial event/status.

Endpoint:

- `POST /api/v1/freight-simulations/:id/shipments`.

Rules:

- shipment can be created from selected option;
- snapshots preserve origin/destination and packages;
- freight value equals selected historical option;
- duplicate shipment creation from same selected option is prevented;
- audit shipment creation.

UI:

- action from selected option/history detail;
- shipment success state;
- minimal shipment detail page or panel.

## Onda 7 - Inteligencia

Expand dashboard and insights:

- total simulations;
- simulations by period;
- average quoted freight;
- average lowest option;
- estimated savings from selected vs alternatives;
- carriers/services distribution;
- shipments generated from simulations;
- route frequency;
- delayed/unavailable reasons if data exists.

Implement deterministic simulation insights:

- cheapest carrier/service over period;
- route with highest cost;
- services frequently unavailable due coverage;
- potential savings when selected option was not cheapest;
- high charge concentration by fee type.

Each insight must have evidence, threshold, period, severity and tenant.

## Onda 8 - Validacao

Seed:

- demo user `administrador@dev.com` / `@DEV1512`;
- two tenants;
- branches with addresses;
- customers with addresses;
- carriers;
- carrier services;
- coverages;
- rate tables;
- ranges;
- additional charges;
- simulations with options;
- selected option;
- shipment generated from simulation;
- initial tracking;
- dashboard/insight data;
- cross-tenant data.

Validation:

- seed twice with no duplication;
- unit tests for engine;
- integration tests for simulation transaction;
- cross-tenant tests;
- E2E login -> customer -> simulation -> option -> shipment -> dashboard;
- `pnpm lint`;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm test:e2e`;
- `pnpm build`;
- Prisma validate;
- Docker Compose config/build.

## Final Response Required For Executor

Report:

- models/migrations created;
- endpoints implemented;
- pages implemented;
- tests added/executed;
- indexes added;
- external config required;
- seed twice result;
- cross-tenant result;
- whether full simulation flow works end-to-end;
- limitations.

Do not claim completion if a real persisted simulation cannot generate options from carrier services, coverage and rate tables.
