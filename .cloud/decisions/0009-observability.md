# ADR 0009 - Observability

Status: accepted

Decision: start with Pino JSON logs, request ID, correlation ID, structured errors and health endpoints.

Options: no observability, full OpenTelemetry stack now, lightweight foundation.

Rationale: the foundation needs useful diagnostics without overbuilding external telemetry.

Consequences: future Sentry, OpenTelemetry, Prometheus and Grafana integrations are documented but not installed.
