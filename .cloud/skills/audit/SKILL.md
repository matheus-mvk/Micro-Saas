# Audit

Status: `IN_PROGRESS`

Objective: record relevant security, administrative and business actions.

Scope: auth events, user changes, permission changes, cadastros, imports, tracking manual actions and critical operations.

Context: `AuditLog` model exists; audit writer is implemented for auth events, query endpoints are not implemented.

Entities: AuditLog, User, Tenant and audited entity references.

Use Cases: append audit entry, query audit trail, export audit report.

Endpoints: planned `/audit`.

Validations: immutable append-only behavior and sanitized metadata.

Permissions: restricted to ADMIN or explicit audit permission.

Tenant: tenant recorded when applicable; global admin actions include target tenant.

Security: never store passwords, tokens, cookies, MFA codes or full sensitive payloads.

Audit: this capability is the audit source of truth.

Events: optional `audit.recorded` for SIEM export later.

Integrations: SIEM export future.

Tests: append-only, filtering, retention, tenant isolation and redaction.

Errors: audit write failure policy must be explicit for critical actions.

Decisions: audit is separate from technical logs and tracking.

Pending: retention, before/after redaction rules, audit query endpoint and failure policy for critical business actions.

History: refined during domain analysis; module 1 added audit writes for login, logout and authentication failure.
