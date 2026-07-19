# Multi-Tenancy

Status: `IN_DESIGN`

Objective: enforce tenant isolation across API, data, cache, queues, files and realtime.

Scope: shared database/shared schema with tenant id.

Context: one user belongs to one tenant in the foundation.

Entities: tenant-scoped entities except public auth metadata and global configuration.

Use Cases: every tenant-scoped read/write.

Endpoints: tenant id comes from auth context.

Validations: combine resource id with tenant id.

Permissions: role checks apply inside tenant boundary.

Tenant: namespace cache, queue payloads, rooms and file ownership.

Security: UUID is not an access control.

Audit: audit log records tenant where applicable.

Events: tenant room names must be authorized.

Integrations: external requests must be attributed to tenant.

Tests: cross-tenant access denial.

Errors: do not reveal resource existence across tenants.

Decisions: ADR 0004.

Pending: repository helpers and integration tests per module.

History: initial strategy.
