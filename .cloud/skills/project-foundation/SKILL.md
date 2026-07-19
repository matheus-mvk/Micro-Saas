# Project Foundation

Status: `IN_PROGRESS`

Objective: maintain the monorepo, scripts, shared contracts, Docker, documentation and validation baseline.

Scope: root configuration, package orchestration, quality gates and integration review.

Context: first execution creates foundation only.

Entities: Tenant, Branch, User, RefreshToken, Customer, Carrier, FreightSimulation, ImportJob, AuditLog.

Use Cases: bootstrap, validate, document and prepare modules.

Endpoints: public health endpoints only.

Validations: lint, typecheck, tests, build, Prisma generate and Docker checks.

Permissions: no business permissions implemented yet.

Tenant: shared schema with tenant id.

Security: deny by default in API.

Audit: policies documented; persistence model created.

Events: future import progress and notifications.

Integrations: future ViaCEP/BrasilAPI and route provider.

Tests: foundation tests for health, env, request id, error contract, UI rendering and HTTP client.

Errors: structured API error contract.

Decisions: see ADRs 0001 through 0011.

Pending: validate after pnpm and Docker are available.

History: created during foundation execution.
