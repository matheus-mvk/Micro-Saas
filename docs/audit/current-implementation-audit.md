# Current Implementation Audit

Status: `IN_DESIGN`

This audit is based on repository inspection and the specialist reviews completed for the planning stage. It distinguishes implemented behavior from scaffolding and documentation.

## Status Legend

- `IMPLEMENTED`: executable behavior exists and was validated or is directly evident in code.
- `PARTIALLY_IMPLEMENTED`: useful base exists, but security, data flow, or business behavior is incomplete.
- `SCAFFOLDED`: module, folder, or shell exists without functional use cases.
- `DOCUMENTED_ONLY`: described in docs or skills, not implemented.
- `NOT_IMPLEMENTED`: no meaningful artifact found.
- `NEEDS_REVIEW`: exists but has a design or safety concern before feature work.
- `BLOCKED_BY_EXTERNAL_CONFIGURATION`: depends on local Docker, secrets, browser deps, or environment state.

## Matrix

| Area | Item | Status | Files | Behavior | Test | Risk | Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Backend | NestJS bootstrap | `IMPLEMENTED` | `apps/api/src/main.ts`, `apps/api/src/app.module.ts` | API starts, global prefix `/api/v1`, validation, CORS, Swagger in non-production | build/typecheck previously passed | Swagger path and production exposure need policy | Keep, document route policy |
| Backend | Health endpoints | `IMPLEMENTED` | `apps/api/src/modules/health/*` | `GET /api/v1/health`, `/live`, `/ready`; readiness checks MySQL and Redis | API e2e health exists | Public readiness can reveal dependencies if exposed broadly | Keep liveness public, restrict readiness by environment if needed |
| Backend | Business modules | `SCAFFOLDED` | `apps/api/src/modules/{auth,users,customers,carriers,...}` | Module classes only, no controllers/use cases/repositories | none | False sense of feature completeness | Specify each module before implementation |
| Backend | Controller-use case-repository flow | `DOCUMENTED_ONLY` | `docs/architecture/backend.md` | No business use case or repository exists yet | none | Future direct Prisma usage in controllers | Enforce during first functional module |
| Backend | Config validation | `IMPLEMENTED` | `apps/api/src/config/environment.ts` | Zod validates required runtime variables | `environment.spec.ts` | Secrets are placeholders in examples | Keep strict validation |
| Backend | Error contract | `PARTIALLY_IMPLEMENTED` | `apps/api/src/common/filters/http-exception.filter.ts`, `packages/shared/src/index.ts` | Structured errors with requestId/timestamp/path | filter spec exists | `ApplicationError.details` needs public allowlist policy | Add error detail classification before CRUDs |
| Backend | Request ID and correlation ID | `IMPLEMENTED` | `request-context.middleware.ts`, `request-logging.interceptor.ts` | Generates or propagates IDs | middleware spec exists | Context also accepts spoofable tenant/user headers | Split technical request context from auth context |
| Security | Private-by-default guard | `PARTIALLY_IMPLEMENTED` | `private-by-default.guard.ts`, `public.decorator.ts` | Denies non-public routes without context | indirect tests only | Context comes from arbitrary headers | Replace with real auth guard before private endpoints |
| Security | RBAC | `PARTIALLY_IMPLEMENTED` | `roles.guard.ts`, `roles.decorator.ts`, `packages/shared/src/index.ts` | Role decorator/guard exists | none | Role is spoofable through header | Derive role from verified session/token |
| Security | Authentication | `SCAFFOLDED` | `apps/api/src/modules/auth/auth.module.ts`, docs/security | No login, JWT, OAuth, MFA, refresh flow | none | Cannot protect business routes yet | Implement first functional module |
| Security | Tenant isolation runtime | `NEEDS_REVIEW` | `schema.prisma`, `request-context.middleware.ts` | Tenant columns exist; no repository enforcement | none | Cross-tenant leaks likely if queries use only id | Add tenant-scoped repository rules/tests |
| Security | WebSocket tenant rooms | `NEEDS_REVIEW` | `notifications.gateway.ts` | Client can join `tenant:{tenantId}` by payload | none | Critical cross-tenant room subscription risk | Authenticated handshake and server-derived tenant |
| Data | Prisma schema | `PARTIALLY_IMPLEMENTED` | `apps/api/prisma/schema.prisma` | Foundation entities exist | generate/build passed | Missing shipment, options, tracking, services, rate tables | Evolve with approved migrations only |
| Data | Migrations and seed | `PARTIALLY_IMPLEMENTED` | `apps/api/prisma/migrations`, `seed.ts` | Initial migration and local seed exist | generate validated | Production migration flow not defined | Add `migrate deploy` workflow later |
| Frontend | Landing page | `PARTIALLY_IMPLEMENTED` | `apps/web/src/app/(public)/page.tsx` | Static product landing | render test | Metrics are illustrative and may look like claims | Mark/remove claims before public launch |
| Frontend | Login page | `PARTIALLY_IMPLEMENTED` | `apps/web/src/app/(auth)/login/page.tsx`, `login-form.tsx` | Visual form with Zod/RHF validation; submit is no-op | login test | No auth/session/MFA/errors | Connect after auth module |
| Frontend | Dashboard | `SCAFFOLDED` | `apps/web/src/app/(dashboard)/dashboard/page.tsx` | Static placeholder with empty state | render test | Public route, no data | Protect route after auth |
| Frontend | App shell | `PARTIALLY_IMPLEMENTED` | `app-shell.tsx` | Sidebar/topbar visual | accessibility test | All nav links target `/dashboard`; tenant not visible | Specify IA and tenant context |
| Frontend | HTTP client | `PARTIALLY_IMPLEMENTED` | `apps/web/src/services/http-client.ts` | Centralized fetch with credentials and structured errors | http-client test | Missing 204/non-JSON/session refresh behavior | Extend with auth contract |
| Infrastructure | Docker Compose | `IMPLEMENTED` | `docker-compose.yml` | API, web, MySQL, Redis, Adminer profile | `docker compose config` and local startup previously passed | Local DB/Redis ports exposed | Keep dev-only; restrict production |
| Infrastructure | Dockerfiles | `PARTIALLY_IMPLEMENTED` | `apps/api/Dockerfile`, `apps/web/Dockerfile` | Multi-stage, non-root, frozen lockfile | `docker compose build` passed | Runtime copies `/app` broadly | Optimize image layout later |
| Infrastructure | BullMQ | `SCAFFOLDED` | `queue.module.ts`, imports module | Queue registered with retry/backoff | none | No worker, DLQ, idempotency envelope | Add worker service with import module |
| Infrastructure | Redis | `PARTIALLY_IMPLEMENTED` | `redis.service.ts`, compose | Client service and health ping exist | service spec | No auth in local compose; no production plan | Managed Redis with TLS/auth for deploy |
| Observability | Structured logs | `PARTIALLY_IMPLEMENTED` | `observability.module.ts`, logging interceptor | Pino logs and redaction | basic behavior covered indirectly | No metrics/traces/alerts | Add OpenTelemetry/metrics after deploy target |
| Tests | Unit/integration | `PARTIALLY_IMPLEMENTED` | `apps/api/src/**/*.spec.ts`, `apps/web/tests` | Foundation tests exist | `pnpm test` previously passed | No tenant, auth, transaction, job tests | Add per module |
| Tests | E2E | `PARTIALLY_IMPLEMENTED` | `apps/api/test`, `apps/web/tests/e2e` | API health e2e exists; web smoke planned | API e2e passed; Playwright can need native deps | Browser deps environment-sensitive | Document setup and keep CI stable |
| Documentation | Docs/ADRs/skills/workflows | `PARTIALLY_IMPLEMENTED` | `docs`, `.cloud` | Broad foundation docs exist | static audit only | Some docs are target-state and not real-state | Keep audit current |

## Verified Contradictions

- Database and tenant-isolation docs were reviewed to align with MySQL: use `JSON`, not JSONB, and do not depend on PostgreSQL-style Row Level Security.
- Security docs correctly say tenant must not come from arbitrary headers, but current `RequestContextMiddleware` reads tenant/user/role headers. This is acceptable only as a foundation placeholder and must be replaced before private business routes.
- Realtime docs say authorization is future; current gateway is therefore not safe for production tenant rooms.

## Conclusion

The foundation is real and buildable, but the product is not functionally implemented. The next step must be an approved Identity and Access module, because every other module depends on trusted user, tenant, role, session, and audit context.
