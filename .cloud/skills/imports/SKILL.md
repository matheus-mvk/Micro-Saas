# Imports

Status: `PLANNED`

Objective: import CSV and XLSX data through safe asynchronous jobs.

Scope: upload, validate, enqueue, process, report progress and audit.

Context: BullMQ and Redis are prepared; parser is not implemented.

Entities: ImportJob and future file metadata.

Use Cases: create import, process rows and view status.

Endpoints: planned `/imports`.

Validations: size, extension, MIME, magic bytes and spreadsheet formula safety.

Permissions: matrix pending.

Tenant: file ownership and jobs scoped by tenant.

Security: store outside public root and use random names.

Audit: import created, failed and completed.

Events: realtime progress via tenant room.

Integrations: storage provider future.

Tests: hostile files and tenant isolation.

Errors: safe rejection without leaking parser internals.

Decisions: BullMQ for async processing.

Pending: upload specification.

History: planned during foundation.
