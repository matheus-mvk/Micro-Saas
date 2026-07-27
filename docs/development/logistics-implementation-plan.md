# Logistics Platform Implementation Plan

Date: 2026-07-25

This plan is derived from the read-only service audit. It is intentionally implementation-oriented and must be used together with `docs/prompts/logistics-platform-complete-implementation-prompt.md`.

## Non-Negotiable Rules

- Do not mark a feature complete for schema-only, endpoint-only, visual-only, mock-only or documentation-only work.
- Every operational query must derive `tenantId` from authenticated server context.
- Frontend must consume documented backend contracts only.
- Admin features need real integration among frontend, backend and MySQL.
- Security review can block implementation choices.
- Schema, migrations, Docker, env vars and shared contracts require final integrator review.

## Wave 0 - Foundation

Objectives:

- fix test runner startup failure;
- configure test cache/output paths so tests run in local, Docker and sandboxed CI environments;
- validate Prisma schema and migration on a clean disposable database;
- define domain model for logistics entities;
- define shared DTOs and pagination/error contracts;
- document RBAC matrix;
- document tenant isolation strategy;
- add CSRF strategy for cookie-authenticated mutations;
- fix unsafe realtime tenant join before adding any realtime flow.

Deliverables:

- tests can run locally and in Docker;
- migration plan reviewed by Senior MySQL Database Analyst;
- final ERD/domain notes updated;
- acceptance checklist for each service.

## Wave 1 - Identity and Organization

Implement:

- tenants service and settings;
- branches CRUD;
- users CRUD/invite/status/profile changes;
- explicit RBAC matrix for ADMIN, MANAGER, OPERATOR;
- sessions list/revoke/logout global;
- password recovery;
- MFA/TOTP with recovery codes;
- OAuth Google and GitHub;
- auth e2e and cross-tenant tests.

Critical fixes:

- refresh must verify user is still `ACTIVE`;
- CSRF must protect cookie-authenticated mutations;
- access token response in JSON must be reviewed and minimized;
- audit must cover all identity events.

## Wave 2 - Logistics Master Data

Implement:

- customers CRUD with CPF/CNPJ validation and server-side pagination;
- customer addresses with multiple types and main/collect/delivery flags;
- CEP integration through ViaCEP or BrasilAPI with timeout/cache/mocks;
- carriers CRUD;
- carrier services/modalities;
- coverage rules and route eligibility tests.

Data:

- seed must include realistic customers, addresses, carriers, services and coverages for two tenants.

## Wave 3 - Pricing

Implement:

- freight rate tables;
- versions/vigency;
- weight bands;
- base/minimum/per-kg values;
- ad valorem, GRIS, toll, insurance, extra fees and discounts;
- overlap validation;
- deterministic pricing engine;
- Decimal-safe arithmetic and rounding rules;
- unit tests for pricing edge cases.

## Wave 4 - Simulation

Implement:

- simulation form with multiple volumes;
- route/distance integration, such as OpenRouteService or justified equivalent;
- create/calculate simulation endpoint;
- eligible services query;
- persisted simulation options;
- unavailable reasons;
- cheapest/fastest classification;
- option detail and breakdown;
- history list/detail with filters and pagination;
- option selection transaction and audit.

## Wave 5 - Operations

Implement:

- shipments from simulation, manual creation and import creation;
- origin/destination snapshots;
- shipment volumes;
- tracking status machine;
- immutable tracking events;
- correction events;
- tracking timeline UI;
- realtime tracking updates after secure realtime is fixed.

## Wave 6 - Imports and Async Processing

Implement at least one complete import flow first, preferably customers or shipments:

- upload endpoint;
- CSV and XLSX validation;
- pre-validation/preview;
- import job and row/error tables;
- BullMQ processor/worker;
- progress updates;
- error report download;
- checksum/idempotency;
- secure tenant-scoped storage;
- realtime import progress with polling fallback.

## Wave 7 - Intelligence

Implement:

- full dashboard KPIs from MySQL;
- filters by period, branch, customer, carrier, service and status;
- charts for simulations, costs, carrier performance, status distribution, routes and import quality;
- deterministic insight generation with thresholds and evidence;
- insights list/read/dismiss;
- audit query UI/API.

## Wave 8 - Experience

Implement:

- complete landing page sections required by the challenge;
- SEO/OpenGraph metadata;
- responsive admin pages for every module;
- loading/empty/error/success/no-permission states;
- accessible dialogs/forms/tables;
- server-side pagination, filters and sorting;
- remove visual-only buttons or connect them to real flows.

## Wave 9 - Demonstration, Quality and Deploy

Implement:

- complete coherent demo dataset with two tenants;
- seed idempotency and production guard tests;
- unit/integration/e2e coverage for core journeys;
- Docker API/web/worker validation;
- README and technical docs updates;
- deployment guide with external credential dependencies.

Final validation:

- lint;
- typecheck;
- tests;
- build;
- Prisma validate;
- migrations in clean disposable DB;
- seed twice without duplication;
- Docker Compose config/build;
- manual flow from login to shipment/tracking/dashboard/insights/logout.
