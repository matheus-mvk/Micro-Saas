# Insights

Status: `IN_DESIGN`

Objective: generate explainable operational insights from existing tenant data.

Scope: rule-based anomalies, cost trends, carrier performance, route risk and dismiss/read lifecycle.

Context: module exists as skeleton only; generative AI is not required.

Entities: Insight, Shipment, TrackingEvent, FreightSimulation, ImportJob.

Use Cases: compute insights, list insights, mark read, dismiss, open evidence.

Endpoints: planned `/insights`.

Validations: rule version, tenant scope, evidence existence and validity window.

Permissions: MANAGER/ADMIN view by default; OPERATOR view actionable operational insights pending approval.

Tenant: insights computed and stored per tenant.

Security: no sensitive data sent to external AI without approval.

Audit: dismiss and administrative rule changes.

Events: `insight.created`, `insight.dismissed`.

Integrations: optional AI later; start deterministic.

Tests: deterministic rules, tenant isolation, stale insight invalidation.

Errors: no data, stale projection, insight not found.

Decisions: explainability is mandatory.

Pending: approve first insight rules and thresholds.

History: refined during domain analysis.
