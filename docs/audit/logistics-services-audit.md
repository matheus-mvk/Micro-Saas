# Logistics Services Audit

Date: 2026-07-25

Scope: read-only functional audit of the logistics SaaS platform. No functional code, schema, migration, seed, or infrastructure file was changed in this execution.

## Executive Summary

The repository is a usable technical foundation, not a complete logistics intelligence platform. It contains:

- NestJS API foundation with global private-by-default guard, request context, structured errors, health checks, Redis service, BullMQ queue registration, Socket.IO gateway, local auth, audit writes for auth events, and a basic dashboard summary endpoint.
- Next.js frontend with public landing page, login page, authenticated layout, admin shell, and dashboard summary connected to a real backend endpoint.
- Prisma/MySQL schema with 9 tables: `tenants`, `branches`, `users`, `refresh_tokens`, `customers`, `carriers`, `freight_simulations`, `import_jobs`, `audit_logs`.
- Seed for demo admin, two tenants, users, one customer, one carrier, one freight simulation, one import job, and one audit log.

The core logistics services required by the challenge are absent or scaffolded: carrier services, coverage, freight rate tables, weight bands, deterministic pricing engine, simulation options, history detail, shipments, tracking, upload/import processing, workers, secure realtime flow, insights, audit UI, user/customer/carrier CRUDs, OAuth, MFA, password recovery, and cross-tenant tests.

## Evidence Baseline

Frontend routes found:

- `/`: `apps/web/src/app/(public)/page.tsx`
- `/login`: `apps/web/src/app/(auth)/login/page.tsx`
- `/dashboard`: `apps/web/src/app/(dashboard)/dashboard/page.tsx`

Backend HTTP endpoints found by static search:

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/dashboard/summary`

Realtime handlers found:

- Socket.IO namespace `/realtime`
- `tenant:join` message in `apps/api/src/infrastructure/realtime/notifications.gateway.ts`

Validation commands executed in this audit:

- `npx pnpm --filter @logistics/api typecheck`: passed.
- `npx pnpm --filter @logistics/web typecheck`: passed.
- `npx pnpm --filter @logistics/api test`: failed at Vitest startup with `SyntaxError: Unexpected token '*'`.
- `npx pnpm --filter @logistics/web test`: failed at Vitest startup with `SyntaxError: Unexpected token '*'`.
- `docker compose config`: passed and printed effective development configuration.
- `npx pnpm --filter @logistics/api exec prisma validate`: started, printed Prisma package warning, did not complete within the observed windows and was interrupted with exit code 130.

QA subagent validation in a stricter read-only sandbox also found:

- `node -v`: `v18.19.1`.
- `pnpm -v`: failed because `pnpm` was not available directly in PATH.
- package-local `tsc` for API and web: passed.
- package-local Vitest for API and web: failed because Vitest tried to write `node_modules/.vite/vitest/results.json` in a read-only sandbox.
- package-local `prisma validate`: failed because `DATABASE_URL` was absent in that sandbox.
- `docker compose config`: failed in that sandbox because Docker was unavailable there.

## Service Classification

| Service | Status | Current behavior | Evidence | Main gaps | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| Tenants and companies | PARTIALLY_IMPLEMENTED | `Tenant` model, seed with two tenants, auth context derives tenant from token/user. No tenant CRUD or settings. | `schema.prisma`, `TenantsModule` empty, `AuthContextService` | No tenant service, admin operations, tenant settings, tenant lifecycle, cross-tenant tests. | Tenant CRUD/settings, tenant-scoped queries, tests proving no cross-tenant read/write/list/aggregation/realtime/import leakage. |
| Branches | SCAFFOLDED | `Branch` model, seed creates branches, user may have `branchId`. No endpoints. | `schema.prisma`, `BranchesModule` empty | No branch CRUD, address/contact/main branch, dashboard/simulation filters, branch permissions. | Branch CRUD, tenant isolation, user association, optional/required branch decision documented and tested. |
| Authentication | PARTIALLY_IMPLEMENTED | Local login, password hash, access token, refresh token rotation, cookies, logout, `/me`, audit, login attempt limiting. | `auth.controller.ts`, `auth.service.ts`, `auth-login-attempt.service.ts` | No OAuth Google/GitHub, MFA/TOTP, password recovery, session management UI/API, CSRF, full e2e. Refresh does not verify user status before issuing new tokens. | Full identity flows with tests, secure cookies, CSRF, revocation, session list/revoke, recovery, OAuth, MFA, audit. |
| Users and RBAC | SCAFFOLDED | `User` model and roles exist. `RolesGuard` exists but no business endpoint uses a permission matrix. | `users.module.ts` empty, `roles.guard.ts` | No user CRUD/invite/status/profile/session/MFA reset, no matrix enforcement. | Admin user management, RBAC matrix in backend, last admin rule, session revocation, audit, tests per role. |
| Customers | SCAFFOLDED | `Customer` model and seed demo customer. No API or UI. | `customers.module.ts` empty, `Customer` model | Missing person type, legal name, CPF/CNPJ validation, addresses, CRUD, filters, pagination, historical references. | Full customer CRUD with addresses, document uniqueness per tenant, server pagination, audit and tests. |
| Addresses | NOT_IMPLEMENTED | No address model or service. | No `Address` model found | No multiple addresses, CEP lookup, snapshots, geocoding, customer/shipment address history. | Address model/service, ViaCEP/BrasilAPI integration, snapshots for simulations/shipments, tests. |
| Carriers | SCAFFOLDED | `Carrier` model and seed demo carrier. No API or UI. | `carriers.module.ts` empty, `Carrier` model | Missing carrier CRUD, status workflow, service list, performance, integration secrets. | Full carrier CRUD, CNPJ uniqueness per tenant, audit, history-preserving references, tests. |
| Carrier services/modalities | NOT_IMPLEMENTED | No model, endpoint, UI, seed, or tests. | No `CarrierService` model | No service code/name/modal/factor/weights/status/coverage/pricing association. | Model, CRUD, unique code per carrier, active filtering in simulations, tests. |
| Coverage | NOT_IMPLEMENTED | No model or deterministic eligibility logic. | No coverage tables | No origin/destination zones, postal ranges, regions, exceptions, route testing. | Coverage model, overlap validation, deterministic service eligibility, unavailable reasons, tests. |
| Freight rate tables | DOCUMENTED_ONLY | Architecture docs mention pricing, but no schema or API. | `docs/architecture/freight-pricing.md` | No tables/versioning/vigency/rules/fees/ranges. | Versioned rate tables, constraints, audit, valid date logic, historical snapshots. |
| Weight bands and prices | NOT_IMPLEMENTED | No model or calculation use case. | No `FreightRateBand` model | No min/max weight validation, overlap protection, decimal rounding rules. | Decimal-safe band model, overlap checks, pricing tests at limits. |
| Pricing engine | NOT_IMPLEMENTED | No deterministic domain service. Current seed stores estimated values directly. | No pricing service files | No cubage, chargeable weight, fee breakdown, reproducibility, unit tests. | Pure deterministic engine, decimal precision, explainable breakdown, unit tests. |
| Freight simulation | PARTIALLY_IMPLEMENTED | `FreightSimulation` model exists and seed creates one calculated row. No endpoint or frontend journey. | `FreightSimulation` model, seed | No create/list/detail/calculate, no multi-volume, no options, no pricing rules, no selection, no history UI. | End-to-end simulation flow with persisted input/options/rule versions and tests. |
| Simulation history | NOT_IMPLEMENTED | No listing/detail endpoints or page. | No controller/page | No filters, pagination, option details, selected option, shipment relation. | Tenant-scoped history list/detail, filters, server pagination, tests. |
| Option selection | NOT_IMPLEMENTED | No simulation option model. | No `FreightSimulationOption` model | Cannot select an option, audit selection, or create shipment from it. | Single selected option transaction, audit, cross-tenant protection, tests. |
| Shipments | DOCUMENTED_ONLY | Architecture docs mention shipments. No model/code. | `docs/architecture/recommended-domain-model.md` | No operational shipment entity, snapshots, volumes, statuses, creation flows. | Shipment model/API/UI, create from simulation/manual/import, snapshots, audit, tests. |
| Tracking | DOCUMENTED_ONLY | Threat model/docs exist, but no tables/API/UI. | `docs/architecture/tracking.md` | No immutable events, status machine, idempotency, timeline, realtime updates. | Status machine, immutable tracking events, transaction with shipment status, realtime, tests. |
| Upload/import | SCAFFOLDED | `ImportJob` model and BullMQ queue registration exist. No upload endpoint/worker. | `imports.module.ts`, `queue.module.ts`, `ImportJob` model | No CSV/XLSX parser, validation, storage, preview, rows, errors, worker, report, idempotency. | At least one complete import flow with worker, progress, error report, tenant isolation, tests. |
| Async processing | PARTIALLY_IMPLEMENTED | BullMQ root and `imports` queue configured with retry/backoff. | `QueueModule` | No processor, worker process, health, metrics, job payload validation. | Real worker, queue health, retries, idempotency, tenant/correlation ID, tests. |
| Realtime | BROKEN | Socket joins tenant room from client-provided `tenantId` without auth. | `notifications.gateway.ts` | Cross-tenant event leakage risk; no frontend realtime client. | Authenticated handshake, server-derived tenant, authorized rooms, fallback polling, tests. |
| Dashboard | PARTIALLY_IMPLEMENTED | Real `/dashboard/summary` counts tenant-scoped basic records. Frontend consumes it. | `dashboard.service.ts`, `dashboard-summary.tsx` | Missing required KPIs, filters, charts, shipments, delay/success, import quality, tests. | Full KPIs and charts from DB, filters, optimized queries, tests. |
| Insights | NOT_IMPLEMENTED | Module empty, no schema. | `insights.module.ts` | No deterministic generation, storage, read/dismiss state. | Insight model/generator/UI, evidence/thresholds, tests. |
| Audit | PARTIALLY_IMPLEMENTED | Audit service writes auth/seed events. No audit endpoints/UI. | `audit.service.ts`, `AuditLog` model | No consult/filter/detail page, before/after, broad event coverage, tests. | Audit all relevant actions, sanitized payloads, query UI/API, tests. |
| Observability | PARTIALLY_IMPLEMENTED | Pino, request ID, exception filter, liveness/readiness for MySQL/Redis. | `main.ts`, `health.controller.ts` | No metrics endpoint, worker/queue health, integration metrics, slow query visibility. | Logs, health, queue/worker checks, metrics and safe errors. |
| Landing page | PARTIALLY_IMPLEMENTED | Professional public page with static preview and CTA. | `apps/web/src/app/(public)/page.tsx` | Missing several required sections, anchor nav, responsive menu, SEO/OpenGraph depth, demo disclaimers for numbers. | Complete commercial landing with required sections, accessibility/performance/SEO tests. |
| Admin UI | PARTIALLY_IMPLEMENTED | Login, authenticated layout, dashboard and shell exist. Other menu items disabled. | `app-shell.tsx`, dashboard files | No pages for users/customers/carriers/freight/imports/insights/audit/settings. | All administrative pages integrated with backend and DB, full states and tests. |
| Demo data | PARTIALLY_IMPLEMENTED | Demo admin and minimal seed data. | `prisma/seed.ts` | Missing most required operational dataset: services, coverage, rate tables, options, shipments, tracking, insights, import errors. | Coherent two-tenant dataset covering every screen and workflow, idempotent and tested. |
| Tests | BROKEN | Unit/test files exist but Vitest startup fails in current environment. Coverage is narrow. | `*.spec.ts`, `apps/web/tests/*` | No domain tests for logistics, tenant, RBAC, e2e flows; test runner failing. | Fix test environment, add unit/integration/e2e coverage for all core flows. |

## Critical Risks

1. Realtime is unsafe: a client can request `tenant:join` with any `tenantId`.
2. Required logistics domain is mostly absent: no carrier services, coverage, rate tables, pricing engine, simulation options, shipments, tracking or insights.
3. Auth is incomplete for the challenge: OAuth, MFA, password recovery and sessions UI/API are missing.
4. Mutations authenticated by cookies do not have dedicated CSRF protection.
5. Dashboard is real but too narrow and has no backend test.
6. Demo login may fail on a database where the initial migration previously failed, because missing tables can break audit/session writes.
7. Tests do not execute in the observed environment due Vitest startup error.
8. Test execution is sensitive to environment: the stricter QA sandbox additionally blocks Vitest cache writes.

## Required Prompt Input

The executor prompt must require implementation, not documentation-only completion. A feature must not be marked complete unless it has model/migration when needed, backend, authorization, tenant isolation, frontend integration, states, tests, demo data and documentation.
