# Users

Status: `PLANNED`

Objective: manage tenant users and roles.

Scope: create, list, edit, deactivate, permission changes and audit.

Context: no CRUD implemented in foundation.

Entities: User, Tenant, Branch and AuditLog.

Use Cases: invite user, update profile, deactivate user and change role.

Endpoints: planned `/users`.

Validations: unique email per tenant and status transitions.

Permissions: ADMIN manages roles; matrix pending.

Tenant: all operations filter by tenant id.

Security: password hash only; no secrets returned.

Audit: creation, update and role changes.

Events: future user notifications.

Integrations: OAuth identity linking future.

Tests: tenant isolation and RBAC.

Errors: no cross-tenant existence leaks.

Decisions: Prisma schema foundation.

Pending: module specification.

History: planned during foundation.
