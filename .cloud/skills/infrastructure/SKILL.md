# Infrastructure

Status: `IN_PROGRESS`

Objective: keep local and CI execution reproducible.

Scope: Dockerfiles, Compose, CI, env examples, health checks and runtime scripts.

Context: Node, pnpm, Docker, MySQL and Redis.

Entities: containers, volumes, networks and secrets.

Use Cases: local start, validation, migration and future deployment.

Endpoints: health checks for API and web.

Validations: `docker compose config`, build and up.

Permissions: production services are not exposed without approval.

Tenant: storage, cache and queues must preserve tenant boundaries.

Security: no secrets in images or repository.

Audit: deployment actions future.

Events: workers and realtime depend on Redis.

Integrations: external API secrets via environment only.

Tests: Compose validation and service health.

Errors: document startup failures.

Decisions: ADR 0011.

Pending: validate with Docker available.

History: initial infrastructure docs and assets.
