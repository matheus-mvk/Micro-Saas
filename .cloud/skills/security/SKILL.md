# Security

Status: `IN_PROGRESS`

Objective: keep the platform secure by default.

Scope: threat model, auth, authorization, tenant isolation, uploads, secrets, logs, queues and realtime.

Context: multi-tenant SaaS with future external integrations and file processing.

Entities: users, sessions, tenants, jobs, files and audit logs.

Use Cases: login, refresh, logout, role changes, import and admin operations.

Endpoints: all private unless `@Public()`.

Validations: OWASP checklist and cross-tenant tests.

Permissions: ADMIN, MANAGER and OPERATOR matrix to be defined per module.

Tenant: never trust client-provided tenant ids.

Security: HttpOnly refresh cookie, short access token, MFA/TOTP and OAuth planned.

Audit: auth and critical admin actions.

Events: no sensitive data in queue/realtime payloads.

Integrations: OAuth and external APIs require secret rotation policy.

Tests: auth, RBAC and cross-tenant isolation before functional release.

Errors: generic for unauthorized access to another tenant.

Decisions: ADR 0005 and security docs.

Pending: rate limiting, CSRF, MFA, OAuth, authorization by resource and full validation in Node 20+.

History: initial security review; module 1 removed trusted identity headers and introduced token/cookie based auth context.
