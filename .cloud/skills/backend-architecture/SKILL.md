# Backend Architecture

Status: `IN_PROGRESS`

Objective: guide NestJS modular backend evolution.

Scope: modules, controllers, use cases, repositories, DTOs, presenters, Prisma and infrastructure services.

Context: controllers call explicit use cases; repositories own persistence.

Entities: all Prisma entities.

Use Cases: defined per module before implementation.

Endpoints: `/api/v1`, plural resources, structured errors.

Validations: class-validator DTOs and global validation pipe.

Permissions: private routes by default, RBAC decorators prepared.

Tenant: tenant context from authenticated request, never body.

Security: no database errors or secrets exposed.

Audit: relevant mutations must create audit entries.

Events: jobs and realtime events must include trusted tenant context.

Integrations: server-side only.

Tests: unit, integration and e2e per use case.

Errors: domain, application and infrastructure errors must be differentiated.

Decisions: ADR 0002 and ADR 0008.

Pending: implement real auth before protected business endpoints.

History: initial foundation.
