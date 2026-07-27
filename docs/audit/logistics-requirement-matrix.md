# Logistics Requirement Matrix

Date: 2026-07-25

Classification values: `IMPLEMENTED_AND_VERIFIED`, `IMPLEMENTED_WITHOUT_TESTS`, `PARTIALLY_IMPLEMENTED`, `SCAFFOLDED`, `VISUAL_ONLY`, `DOCUMENTED_ONLY`, `NOT_IMPLEMENTED`, `BROKEN`, `NEEDS_REVIEW`, `BLOCKED_BY_EXTERNAL_CONFIGURATION`.

| Requirement | Module | Backend | Frontend | Database | Tests | Security/Tenant | Status | Evidence | Required work |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Node.js/NestJS/TypeScript API | Foundation | App boots conceptually; controllers for health/auth/dashboard | N/A | Prisma configured | Some unit tests, test startup broken | Guards/filter/middleware exist | PARTIALLY_IMPLEMENTED | `apps/api/src/app.module.ts` | Fix test runner, add domain modules. |
| Next.js frontend | Foundation | N/A | 3 real routes | N/A | Basic tests, startup broken | Uses credentials include | PARTIALLY_IMPLEMENTED | `apps/web/src/app` | Add admin pages and e2e. |
| Prisma/MySQL | Database | PrismaService and schema | N/A | 9 tables | No DB integration tests | TenantId exists in some models | PARTIALLY_IMPLEMENTED | `schema.prisma` | Add full logistics schema, constraints and indexes. |
| Docker Compose | Infrastructure | API service | Web service | MySQL/Redis services | `docker compose config` passed | Dev defaults exposed | PARTIALLY_IMPLEMENTED | `docker-compose.yml` | Production docs/hardening and worker service. |
| Redis | Infrastructure | RedisService and health ping | N/A | N/A | Redis service unit exists but tests fail startup | Tenant key helper exists | PARTIALLY_IMPLEMENTED | `redis.service.ts` | Use in cache/jobs/rate-limit with tests. |
| BullMQ | Async | Queue registered | N/A | N/A | None | No tenant payload enforcement | SCAFFOLDED | `queue.module.ts` | Add processors/workers and job APIs. |
| Socket.IO | Realtime | Gateway exists but unsafe tenant join | No client flow | N/A | None | Client can choose tenant | BROKEN | `notifications.gateway.ts` | Auth handshake and tenant-scoped rooms. |
| Landing page | Public web | N/A | Exists with static commercial content | N/A | Basic landing tests fail startup | Public | PARTIALLY_IMPLEMENTED | `/` page | Complete required sections, SEO, a11y fixes. |
| Login local | Auth | Real login endpoint | Real login form | Users/refresh/audit | No auth integration/e2e | Basic protections and audit | PARTIALLY_IMPLEMENTED | `/auth/login` | Add CSRF, e2e, session lifecycle, inactive user refresh check. |
| OAuth Google | Auth | None | None | No identity table | None | N/A | NOT_IMPLEMENTED | Env vars only | Full provider flow, state, callback, linking, audit. |
| OAuth GitHub | Auth | None | None | No identity table | None | N/A | NOT_IMPLEMENTED | Env vars only | Full provider flow including verified email API. |
| MFA/TOTP | Auth | None | None | No secret/recovery tables | None | N/A | NOT_IMPLEMENTED | `TOTP_ISSUER` only | Enrollment, challenge, recovery codes, audit. |
| Password recovery | Auth | None | None | No reset token table | None | N/A | NOT_IMPLEMENTED | No routes | Secure token flow and email/dev adapter. |
| Sessions | Auth | Refresh tokens persist | No sessions page | `refresh_tokens` | No integration tests | Partial revocation | PARTIALLY_IMPLEMENTED | `/auth/refresh`, `/auth/logout` | List/revoke sessions, global logout, reuse tests. |
| RBAC | Security | Guard/decorator only | Disabled menu items | Role enum | Guard test only | No matrix | SCAFFOLDED | `roles.guard.ts` | Backend permission matrix and tests. |
| Tenants | Multi-tenancy | Auth context and seed only | No tenant UI | `tenants` | No cross-tenant tests | Partial | PARTIALLY_IMPLEMENTED | `Tenant` model | Tenant service/settings and isolation tests. |
| Branches | Organization | Empty module | No UI | `branches` | None | TenantId in table | SCAFFOLDED | `BranchesModule` | CRUD, address/contact/main branch, filters. |
| Users | Admin | Empty module | No UI | `users` | No CRUD tests | No matrix enforcement | SCAFFOLDED | `UsersModule` | Full user management and audit. |
| Customers | Logistics master data | Empty module | No UI | `customers` | None | TenantId and unique document | SCAFFOLDED | `CustomersModule` | CRUD, addresses, document validation. |
| Addresses | Logistics master data | None | None | None | None | N/A | NOT_IMPLEMENTED | No model | Address service, CEP integration, snapshots. |
| Carriers | Logistics master data | Empty module | No UI | `carriers` | None | TenantId and unique document/code | SCAFFOLDED | `CarriersModule` | CRUD and performance links. |
| Carrier services | Logistics master data | None | None | None | None | N/A | NOT_IMPLEMENTED | No model | Service model/API/UI. |
| Coverage | Logistics rules | None | None | None | None | N/A | NOT_IMPLEMENTED | No model | Coverage rules and eligibility tests. |
| Freight tables | Pricing | None | None | None | None | N/A | DOCUMENTED_ONLY | Pricing docs | Versioned tables/bands/fees. |
| Pricing engine | Pricing | None | None | None | None | N/A | NOT_IMPLEMENTED | No service | Deterministic engine and tests. |
| Simulation journey | Freight | No endpoint | No page | One simple table | None | TenantId exists | PARTIALLY_IMPLEMENTED | `freight_simulations` | Full create/calculate/results/history. |
| Simulation history | Freight | None | None | Same simple table | None | N/A | NOT_IMPLEMENTED | No endpoint/page | List/detail filters and options. |
| Shipments | Operations | None | None | None | None | N/A | NOT_IMPLEMENTED | No model | Shipment model/API/UI. |
| Tracking | Operations | None | None | None | None | N/A | DOCUMENTED_ONLY | Tracking docs | Immutable timeline/status machine. |
| Upload import | Imports | No endpoint/worker | No page | `import_jobs` only | None | Partial tenantId | SCAFFOLDED | `ImportsModule` | CSV/XLSX upload, worker, errors, realtime. |
| Dashboard | Intelligence | Summary endpoint | Summary cards | Counts real tables | No dashboard tests | Tenant filtered | IMPLEMENTED_WITHOUT_TESTS | `/dashboard/summary` | Full KPIs, filters, charts, tests. |
| Insights | Intelligence | Empty module | No UI | None | None | N/A | NOT_IMPLEMENTED | `InsightsModule` | Deterministic insight model/generator/UI. |
| Audit | Governance | Write service only | No UI | `audit_logs` | None | Partial tenant fields | PARTIALLY_IMPLEMENTED | `AuditService` | Query API/UI, event coverage, before/after. |
| Observability | Operations | Health/logging exist | N/A | N/A | Health e2e exists but not executed | Logs sanitized partially | PARTIALLY_IMPLEMENTED | `health.controller.ts` | Metrics, queue/worker/integration health. |
| Demo data | Demo | Seed exists | Dashboard can show minimal data | Minimal data | No seed tests | Two tenants created | PARTIALLY_IMPLEMENTED | `seed.ts` | Full coherent dataset and idempotency tests. |
| Automated tests | Quality | Several unit specs | Several UI specs | No DB tests | Vitest startup fails with `npx pnpm`; stricter sandbox also blocks Vitest cache writes | No cross-tenant/e2e coverage | BROKEN | Test command output and QA sandbox output | Fix runtime/cache strategy and add required coverage. |

## Final Requirement Result

No requirement should be marked `IMPLEMENTED_AND_VERIFIED` from this audit because the test runner failed for existing tests, `prisma validate` was inconclusive in the main run, and core domain flows are incomplete. The most advanced implemented surface is local auth plus dashboard summary, but even those need integration/e2e/security coverage before final completion.
