# Challenge Compliance Matrix

Status: `IN_DESIGN`

| Requirement | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Monorepo with pnpm workspaces and Turborepo | `IMPLEMENTED` | `package.json`, `pnpm-workspace.yaml`, `turbo.json` | Scripts exist and were used in prior validation |
| Backend NestJS TypeScript | `IMPLEMENTED` | `apps/api/src/main.ts`, `app.module.ts` | Business routes not implemented |
| Frontend Next.js TypeScript | `IMPLEMENTED` | `apps/web/src/app`, `next.config.ts` | Functional flows are placeholders |
| Shared package | `PARTIALLY_IMPLEMENTED` | `packages/shared/src/index.ts` | Generic contracts only |
| Prisma with MySQL | `PARTIALLY_IMPLEMENTED` | `apps/api/prisma/schema.prisma` | Foundation schema exists; domain model incomplete |
| MySQL and Redis in Docker Compose | `IMPLEMENTED` | `docker-compose.yml` | MySQL host mapping is `localhost:3307`; internal is `mysql:3306` |
| Dockerfiles | `PARTIALLY_IMPLEMENTED` | `apps/api/Dockerfile`, `apps/web/Dockerfile` | Build works; runtime images need slimming later |
| Health checks | `IMPLEMENTED` | `HealthController`, Compose healthchecks | Readiness checks DB/Redis |
| Structured logs | `PARTIALLY_IMPLEMENTED` | `ObservabilityModule`, interceptor | No metrics/tracing/exporters yet |
| Request ID | `IMPLEMENTED` | `RequestContextMiddleware` | Also carries temporary spoofable auth context |
| Error contract | `PARTIALLY_IMPLEMENTED` | `HttpExceptionFilter`, shared error type | Needs public detail allowlist |
| Private by default | `PARTIALLY_IMPLEMENTED` | global `APP_GUARD` | Context is not authenticated yet |
| `@Public()` | `IMPLEMENTED` | `public.decorator.ts`, health controller | Used for health |
| RBAC base | `PARTIALLY_IMPLEMENTED` | `RolesGuard`, `roles.decorator.ts` | No permission matrix |
| Multi-tenancy | `PARTIALLY_IMPLEMENTED` | `tenantId` in schema, docs | No enforced query layer or tests |
| Authentication | `SCAFFOLDED` | `AuthModule`, docs, login visual | No JWT/session/OAuth/MFA |
| OAuth Google/GitHub | `DOCUMENTED_ONLY` | env vars and docs | No implementation |
| MFA/TOTP | `DOCUMENTED_ONLY` | env vars and docs | No implementation |
| Users | `SCAFFOLDED` | Prisma `User`, module, skill | No use cases/endpoints |
| Customers | `SCAFFOLDED` | Prisma `Customer`, module, feature README | No addresses/use cases/endpoints |
| Carriers | `SCAFFOLDED` | Prisma `Carrier`, module, feature README | No services/rate tables |
| Freight simulation | `PARTIALLY_IMPLEMENTED` | Prisma `FreightSimulation`, skill | No options/calculation/history endpoints |
| Shipments | `NOT_IMPLEMENTED` | none | Required before tracking/dashboard logistics |
| Tracking | `NOT_IMPLEMENTED` | none | WebSocket only generic notification skeleton |
| Imports | `SCAFFOLDED` | `ImportJob`, `ImportsModule`, BullMQ queue | No upload/parser/worker |
| Dashboard | `SCAFFOLDED` | Web placeholder, skill | No API aggregations |
| Insights | `SCAFFOLDED` | empty module, skill | No rules/storage |
| Audit | `SCAFFOLDED` | `AuditLog`, empty module, skill | No writer/query |
| Realtime | `SCAFFOLDED` | `NotificationsGateway` | Unsafe until auth handshake exists |
| Asynchronous processing | `SCAFFOLDED` | BullMQ root queue config | No worker |
| External APIs | `DOCUMENTED_ONLY` | docs/skills mention candidates | No clients |
| Upload CSV/XLSX | `DOCUMENTED_ONLY` | security docs and imports skill | No parser/storage |
| CI | `PARTIALLY_IMPLEMENTED` | `.github/workflows/ci.yml` | No image build/smoke with services |
| Deploy público | `NOT_IMPLEMENTED` | docs only | Out of current scope |
| IA artifacts | `PARTIALLY_IMPLEMENTED` | `.cloud/agents`, skills, workflows | Need update after each module |

## Compliance Summary

The repository meets the foundation intent but does not yet meet functional product requirements. The strongest implemented areas are project structure, API/web bootstrap, Docker local stack, health, logging foundation, and documentation. The weakest areas are real authentication, tenant enforcement at query time, business modules, shipments/tracking, worker execution, and production hardening.
