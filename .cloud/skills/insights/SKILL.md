# Insights

Status: `PLANNED`

Objective: generate automatic operational insights from existing data.

Scope: anomaly detection, cost trend notes, route observations and carrier comparison.

Context: generative AI is not required for initial insights.

Entities: FreightSimulation, Carrier, Customer and AuditLog.

Use Cases: list insights, dismiss insight and track impact.

Endpoints: planned `/insights`.

Validations: explainability and tenant scope.

Permissions: matrix pending.

Tenant: insights computed per tenant.

Security: no sensitive data sent to external AI without approval.

Audit: insight dismissal and administrative changes.

Events: new insight notifications future.

Integrations: optional AI or analytics services future.

Tests: deterministic rules and tenant boundaries.

Errors: unavailable insights shown as empty state.

Decisions: start with non-generative rules.

Pending: rules specification.

History: planned during foundation.
