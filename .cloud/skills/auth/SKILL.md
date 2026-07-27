# Auth

Status: `IN_PROGRESS`

Objective: implement secure access with email/password, OAuth, MFA and session management.

Scope: login, refresh, logout, device sessions, revocation and audit.

Context: routes are private by default; `@Public()` exists for approved auth endpoints.

Entities: User and RefreshToken.

Use Cases: authenticate, refresh token, revoke session, logout global, reset password, manage MFA.

Endpoints: implemented `/auth/login`, `/auth/refresh`, `/auth/logout` and `/auth/me`; OAuth callbacks and MFA endpoints remain planned.

Validations: anti-enumeration, brute-force protection and strong credential handling.

Permissions: authenticated user context carries role.

Tenant: tenant is resolved from verified identity, not request body.

Security: HttpOnly Secure cookies in production and refresh rotation.

Audit: login, logout, failure, refresh reuse and MFA events.

Events: security notifications future.

Integrations: Google and GitHub OAuth.

Tests: auth flows, replay, revocation and cross-tenant context.

Errors: generic auth failure messages.

Decisions: ADR 0005.

Pending: rate limiting, CSRF hardening, OAuth, MFA, logout global, session management UI and successful Vitest/build validation on Node 20+.

History: planned during foundation; module 1 implementation added email/password login, refresh rotation, logout, trusted tenant context and audit writes.
