# Imports

Status: `IN_DESIGN`

Objective: import CSV/XLSX data through safe asynchronous jobs.

Scope: upload, validate, preview, enqueue, process rows, report progress, retry and audit.

Context: `ImportJob` and BullMQ queue exist; upload, parser, storage and worker are not implemented.

Entities: ImportJob, ImportJobRow, target module entities.

Use Cases: create import, validate file, process rows, view status, cancel/retry import.

Endpoints: planned `/imports`.

Validations: size, extension, MIME, magic bytes, row schema and CSV formula safety.

Permissions: module-specific import permissions.

Tenant: file ownership and job envelope must include trusted tenant.

Security: random filenames, non-public storage, scan future, sanitized error reports.

Audit: import created, started, completed, failed, canceled and retried.

Events: `import.progress`, `import.completed`, `import.failed`.

Integrations: storage provider future.

Tests: hostile files, tenant isolation, idempotency, partial failures, worker retries.

Errors: invalid file, invalid row, unsupported import type, processing failed.

Decisions: avoid generic imports without explicit target schema.

Pending: choose first import type and storage provider.

History: refined during domain analysis.
