# Tracking

Status: `IN_DESIGN`

Objective: record immutable logistics events and maintain shipment current status.

Scope: manual events, imports, external APIs, webhooks, corrections, idempotency and realtime updates.

Context: not implemented; Socket.IO infrastructure is only scaffolded.

Entities: TrackingEvent, Shipment, AuditLog, ImportJob.

Use Cases: append event, correct event, ingest external event, view timeline.

Endpoints: planned `/shipments/{id}/tracking-events` and integration/webhook endpoints.

Validations: event type, state machine, idempotency, source and tenant ownership.

Permissions: OPERATOR append allowed events; ADMIN/MANAGER corrections pending approval.

Tenant: event and shipment must share tenant.

Security: no client-selected tenant room or cross-tenant tracking code inference.

Audit: manual events and corrections create audit entries.

Events: `tracking.event_created`, `shipment.status_changed`.

Integrations: carrier APIs and webhooks.

Tests: duplicate, out-of-order, invalid transition, terminal status, wrong tenant, WebSocket and audit.

Errors: invalid transition, duplicate event, not found, forbidden.

Decisions: correction creates new event, no mutation.

Pending: approve state machine and first tracking sources.

History: created during domain analysis.
