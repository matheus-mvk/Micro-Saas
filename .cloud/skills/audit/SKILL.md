# Audit

Status: `PLANNED`

Objective: record relevant business and security actions.

Scope: auth events, user changes, permission changes, cadastros, imports and critical operations.

Context: AuditLog model exists; writer not implemented.

Entities: AuditLog, User and Tenant.

Use Cases: append audit entry and query audit trail.

Endpoints: planned `/audit`.

Validations: immutable append-only behavior.

Permissions: restricted to authorized roles.

Tenant: tenant recorded when applicable.

Security: metadata must be sanitized.

Audit: this is the audit capability.

Events: future security alert events.

Integrations: SIEM export future.

Tests: write path, filtering and retention behavior.

Errors: audit failures require policy decision for critical actions.

Decisions: audit is separate from technical logs.

Pending: retention and query specification.

History: planned during foundation.
