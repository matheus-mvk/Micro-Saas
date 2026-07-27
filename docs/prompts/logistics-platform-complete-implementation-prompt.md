# Complete Logistics Platform Implementation Prompt

You are Codex working in the repository `/mnt/c/projetos/micro-saas`.

Your task is to implement, integrate, test and document the complete multi-tenant logistics intelligence SaaS platform. This is an implementation execution, not another audit. You must change code, schema, migrations, frontend, backend, tests, seed and documentation as needed, while respecting repository rules.

## Repository Rules

- Work only inside this repository.
- Do not use proprietary code or unverified snippets.
- Do not invent features without recording the hypothesis.
- Do not silently change ADRs.
- Do not overwrite another agent's work without final review.
- Do not create dead code or abstractions without a real use case.
- Do not ignore errors, weaken security, or commit secrets.
- Keep documentation, code, scripts and decisions aligned.
- Do not use `docker compose down -v`, `prisma migrate reset`, delete volumes, delete migrations indiscriminately, or run destructive production commands.
- Use a clean disposable database for destructive validation only after explicit coordination.

## Source Material To Read First

Read these files before implementation:

- `README.md`
- `AGENTS.md`
- `docs/audit/logistics-services-audit.md`
- `docs/audit/logistics-simulation-gap-analysis.md`
- `docs/audit/logistics-requirement-matrix.md`
- `docs/audit/authentication-audit.md`
- `docs/audit/final-requirement-review.md` if present
- `docs/audit/mysql-performance-audit.md` if present
- `docs/development/logistics-implementation-plan.md`
- `docs/development/logistics-manual-test-scenarios.md`
- `apps/api/prisma/schema.prisma`
- all Prisma migrations
- all backend modules under `apps/api/src`
- all frontend pages and services under `apps/web/src`
- `.cloud/agents`
- `.cloud/skills`

The original product objective is a SaaS multi-tenant logistics intelligence and freight analysis platform, not only a freight calculator.

## Current Audited State

Backend endpoints currently found:

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/dashboard/summary`

Frontend routes currently found:

- `/`
- `/login`
- `/dashboard`

Prisma models currently found:

- `Tenant`
- `Branch`
- `User`
- `RefreshToken`
- `Customer`
- `Carrier`
- `FreightSimulation`
- `ImportJob`
- `AuditLog`

Most logistics services are missing, scaffolded, or partial. Do not treat these as complete.

## Mandatory Agents

Use or create agents matching the existing `.cloud/agents` pattern:

- Backend Specialist
- Frontend Specialist
- UI/UX Specialist
- Security Specialist
- Infrastructure Specialist
- Testing/QA Specialist
- Senior MySQL Database Analyst
- Final Integrator and Reviewer

The Final Integrator coordinates shared files and resolves conflicts. Schema, migrations, shared contracts, auth, RBAC, Docker, env and root scripts require final review.

## Completion Rule

A service is complete only when it has:

1. business objective;
2. actors and permissions;
3. model/migration/constraints/indexes when persistence is needed;
4. backend controller/use case/service/repository;
5. DTOs and validation;
6. authorization and tenant isolation;
7. audit events;
8. error handling and Swagger;
9. frontend page/components;
10. loading, empty, error, success and no-permission states;
11. server-side pagination/filtering/sorting when applicable;
12. unit tests;
13. integration tests;
14. relevant e2e tests;
15. demo data;
16. manual test scenario;
17. documentation;
18. passing lint/typecheck/test/build;
19. Security Specialist review;
20. Senior MySQL Database Analyst review;
21. Final Integrator review.

Do not mark as complete when only a table, Prisma model, empty controller, visual screen, frontend mock, placeholder, fixed data, button without action, endpoint without persistence or documentation exists.

## Wave 0 - Foundation

Implement first:

- Fix Vitest startup failure currently observed as `SyntaxError: Unexpected token '*'`.
- Configure Vitest/cache/output paths so tests do not fail merely because `node_modules/.vite/vitest/results.json` is not writable in stricter environments.
- Run and document `lint`, `typecheck`, `test`, `build`, `prisma validate`, `docker compose config`.
- Validate migration strategy without destructive reset.
- Review current initial migration and previous MySQL identifier issue.
- Define complete logistics relational model with Senior MySQL Database Analyst.
- Define shared DTOs in `packages/shared`.
- Define RBAC matrix for ADMIN, MANAGER, OPERATOR.
- Define tenant isolation strategy for queries, jobs, cache, uploads and realtime.
- Add CSRF strategy for cookie-authenticated mutations.
- Fix unsafe Socket.IO tenant join before adding realtime events.
- Update `.env.example` for all external integrations without committing secrets.

## Wave 1 - Identity, Tenants and Users

Implement:

- tenant service: create, consult, edit, activate, deactivate, settings;
- branch service: create, list, edit, activate, deactivate, address/contact/code/main branch;
- user management: invite/create, list/search/filter/paginate, detail, edit name, edit role, activate, deactivate, logical remove, revoke sessions, reset MFA, resend invite, status, last access, auth methods;
- roles: ADMIN, MANAGER, OPERATOR with explicit backend permission matrix;
- prevent removal/deactivation of last active ADMIN;
- prevent self-elevation without permission;
- revoke sessions after deactivation and critical permission changes;
- session list/revoke/current logout/global logout;
- refresh token reuse detection tests;
- password recovery with one-time expiring token and development email adapter;
- OAuth Google with state, callback, verified email, tenant/user association and error page;
- OAuth GitHub including verified email lookup when public email is unavailable;
- MFA/TOTP enrollment, challenge, disable, recovery codes, regeneration and audit.

Acceptance:

- `administrador@dev.com` / `@DEV1512` logs in as ADMIN in tenant `demo-logistics`.
- Refresh refuses inactive users and inactive tenants.
- No sensitive tokens/secrets are stored in `localStorage`.
- Backend returns 403 for role violations.

## Wave 2 - Logistics Master Data

Implement:

- customers CRUD with person type, name, legal name, CPF/CNPJ, state registration, email, phone, main contact, notes, status, responsible user, branch when applicable;
- customer addresses with multiple types, CEP, street, number, complement, district, city, state, country, coordinates, main/pickup/delivery flags;
- ViaCEP or BrasilAPI integration with timeout, cache, fallback, mocks and tests;
- carriers CRUD with legal data, contact, status, integration metadata without exposing secrets;
- carrier services with code, name, modality, description, default deadline, cubic factor, weight min/max, minimum price, coverage and pricing association;
- coverage rules by country/state/city/postal range/region/origin-destination with overlap validation and route test endpoint.

Acceptance:

- CRUDs are tenant-scoped, paginated server-side, audited and tested.
- Inactive carriers/services are excluded from new simulations.

## Wave 3 - Freight Pricing

Implement:

- freight rate tables associated with carrier/service/coverage;
- versioning and vigency;
- weight bands with min/max/base/per-kg/excess/deadline/priority;
- fees: fixed, ad valorem, GRIS, toll, insurance, extra fees, discounts;
- restrictions and currency;
- overlap validation;
- historical rule snapshots;
- deterministic pricing engine independent from controllers.

Pricing engine must:

- normalize units;
- compute total real weight;
- compute total volume;
- compute cubic weight as volume times cubic factor using documented units;
- compute chargeable weight deterministically;
- select active coverage, rate table and band;
- calculate breakdown and total with Decimal-safe precision;
- explain every component.

Acceptance:

- Unit tests cover cubage, chargeable weight, minimum price, bands, fees, rounding and edge limits.

## Wave 4 - Freight Simulation

Implement:

- simulation page/form with optional customer, origin/destination, CEP lookup, city/state, cargo value, desired date, notes, service/carrier filters and multiple volumes;
- route/distance integration such as OpenRouteService or a justified equivalent with timeout, retry, cache, fallback and mocks;
- backend create/calculate simulation endpoint;
- deterministic processing for each eligible service;
- persisted input, volumes, options, unavailable reasons, breakdown and rule versions;
- result comparison with sorting/filtering/details;
- cheapest and fastest flags;
- option selection transaction and audit;
- simulation history list/detail with filters and pagination;
- create Shipment from selected option.

Acceptance:

- Evaluator can run the complete freight simulation flow from login to history and shipment creation.

## Wave 5 - Shipments and Tracking

Implement:

- shipments created from simulation, manually and by import;
- fields: customer, carrier, service, tracking code, external reference, origin/destination snapshots, volumes, weight, cargo value, freight value, ETA, current status, delivery date, source, user, tenant;
- allowed edits and cancellation rules;
- tracking events with statuses `CREATED`, `PICKUP_SCHEDULED`, `PICKED_UP`, `IN_TRANSIT`, `ARRIVED_AT_HUB`, `OUT_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_FAILED`, `RETURNING`, `RETURNED`, `CANCELED`;
- non-status events `ETA_UPDATED`, `LOCATION_UPDATED`, `NOTE_ADDED`, `EXCEPTION_REPORTED`, `CORRECTION_CREATED`;
- immutable event timeline;
- explicit state machine;
- idempotency for external events;
- event creation and shipment status update in same transaction;
- realtime tracking update after secure realtime is implemented.

Acceptance:

- Invalid status transitions fail.
- Corrections do not mutate original events.
- Timeline and current status stay consistent.

## Wave 6 - Imports, Async and Realtime

Implement at least one fully functional import flow, preferably customers or shipments:

- CSV and XLSX upload;
- extension, MIME, size, filename, content, headers and row validation;
- preview/pre-validation;
- ImportJob and ImportJobRow/Error models;
- tenant-scoped file storage;
- BullMQ job with tenantId, userId, type, payload, idempotency key, attempts, timeout and correlation ID;
- worker process, health check, retry/backoff, failure state, metrics and cleanup;
- progress persistence;
- Socket.IO progress events using authenticated server-derived tenant rooms;
- frontend connection/reconnection/fallback polling;
- downloadable error report protected against formula injection.

Acceptance:

- Upload of valid file persists rows.
- Invalid rows produce report.
- Duplicate file follows documented checksum/idempotency rule.
- User from another tenant cannot access file/job/events.

## Wave 7 - Dashboard, Insights and Audit

Implement:

- dashboard filters: period, branch, customer, carrier, service, status;
- KPIs: total simulations, average freight, average lowest value, estimated savings, total shipments, in transit, delayed, delivered, failed, success rate, predicted and actual deadlines, import counts and errors;
- charts: simulations over time, costs over time, carrier performance, shipment statuses, frequent routes, predicted vs actual deadline, cost distribution and import quality;
- optimized SQL/Prisma queries with indexes and no avoidable N+1;
- insights model and deterministic generator with type, title, description, severity, evidence, metric, period, generated date, validity, tenant, context link, read/dismiss state;
- audit query API/UI with period/user/action/resource filters, details and pagination.

Acceptance:

- No KPI or insight uses fixed frontend data.
- Dashboard and insights consider only current tenant data.

## Wave 8 - Public and Admin Experience

Implement:

- complete landing page sections: header, hero, problem, solution, features, flow demo, benefits, illustrative indicators, differentiators, security, integrations, CTA, footer;
- responsive menu and anchor navigation;
- SEO metadata, Open Graph and semantic structure;
- all admin pages for users, customers, carriers, services, rate tables, simulations, history, shipments, tracking, imports, dashboard, insights, audit and settings;
- accessible forms/tables/dialogs;
- loading, empty, error, success and no-permission states;
- no mock-only frontend data.

Acceptance:

- Every visible button has a working action or is intentionally absent.
- All pages have backend integration or are not presented as implemented.

## Wave 9 - Demo Data, Tests, Docs and Deploy

Implement:

- complete idempotent seed with two tenants, branches, users, disabled user, customers, addresses, carriers, services, coverage, rate tables, versions, bands, simulations, options, selected option, shipments, volumes, tracking, imports, errors, audit, dashboard data, insights, sessions and permissions;
- seed production guard and concurrent/idempotency tests;
- unit tests for domain logic;
- integration tests for API + database;
- e2e tests for landing, login, dashboard, CRUDs, simulation, shipment, tracking, import, audit, MFA, RBAC and tenant isolation;
- Docker Compose with API, web, worker, MySQL and Redis;
- README and technical docs for architecture, setup, migrations, seed, OAuth, MFA, integrations, queues, realtime, observability and deploy.

Final validation must run and report:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm db:generate`
- `pnpm --filter @logistics/api exec prisma validate`
- migrations on a clean disposable database
- seed twice without duplication
- `docker compose config`
- Docker build/start health checks
- manual test scenarios in `docs/development/logistics-manual-test-scenarios.md`

## Final Response Required

At the end, report:

1. agents used;
2. files changed;
3. migrations created;
4. indexes added/removed;
5. endpoints implemented;
6. pages implemented;
7. tests added;
8. tests executed and results;
9. seed twice result;
10. Docker result;
11. cross-tenant test result;
12. external configuration still required;
13. known limitations;
14. whether login `administrador@dev.com` works;
15. whether the platform is ready for demonstration.

Do not claim success for commands or flows that were not executed.
