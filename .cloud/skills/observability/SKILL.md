# Observability

Status: `IN_PROGRESS`

Objective: keep diagnostics useful and safe.

Scope: JSON logs, request id, correlation id, health, readiness, liveness, exception filter and sanitization.

Context: Pino and health endpoints are implemented.

Entities: requests, jobs, tenants and errors.

Use Cases: trace request, diagnose health and inspect failures.

Endpoints: `/health`, `/health/live`, `/health/ready`.

Validations: no sensitive fields in logs.

Permissions: public health remains limited.

Tenant: include tenant id only when safe and available.

Security: redact tokens, cookies, passwords and secrets.

Audit: not a replacement for audit logs.

Events: future traces and metrics.

Integrations: Sentry, OpenTelemetry, Prometheus and Grafana future.

Tests: request id and error contract tests.

Errors: centralized filter returns stable payload.

Decisions: ADR 0009.

Pending: external telemetry after deploy target is known.

History: initial foundation.
