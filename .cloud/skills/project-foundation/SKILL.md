# Project Foundation

Status: `IN_DESIGN`

Objective: maintain the monorepo, scripts, shared contracts, Docker, documentation and validation baseline while product modules are specified.

Scope: root configuration, package orchestration, quality gates, API/web bootstrap, Docker, documentation and integration review.

Context: foundation exists; current stage is formal audit and domain planning.

Entities: Tenant, Branch, User, RefreshToken, Customer, Carrier, FreightSimulation, ImportJob, AuditLog and proposed future logistics entities.

Use Cases: bootstrap, validate, document, audit and prepare modules.

Endpoints: public health endpoints and Swagger in non-production.

Validations: lint, typecheck, tests, build, Compose config and non-destructive static checks.

Permissions: no business permission matrix implemented.

Tenant: shared schema with tenant id; runtime enforcement still needs auth and repositories.

Security: deny-by-default guard exists, but current auth context is placeholder.

Audit: policies and model exist; writer is not implemented.

Events: future import progress, tracking, notifications and outbox.

Integrations: future address and route providers.

Tests: foundation tests exist; functional isolation tests pending.

Errors: structured API error contract exists.

Decisions: see ADRs and `docs/audit/open-decisions.md`.

Pending: approve first functional module.

History: foundation created and then audited during planning stage.
