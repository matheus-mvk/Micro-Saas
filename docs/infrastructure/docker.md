# Docker

This document describes the expected Docker contract for the platform. It does not modify Dockerfiles or compose files.

## Goals

- Reproducible images built from committed source and lockfiles.
- Runtime configuration through environment variables, not baked secrets.
- Fast local dependency startup through Docker Compose.
- Production images with minimal attack surface.

## Image Expectations

Application images for the NestJS API, Next.js web app, and workers should:

- Use an explicit base image tag.
- Install dependencies from a lockfile.
- Run as a non-root user.
- Expose only required ports.
- Include a healthcheck when the runtime supports it.
- Keep build-time and runtime dependencies separated.
- Avoid copying `.env`, local caches, test output, or generated secrets.

## Compose Expectations

Local `docker-compose.yml` should define development dependencies and local application services. Recommended service groups:

- API process on port `3333`.
- Web process on port `3000`.
- MySQL database.
- Redis for cache, BullMQ queues, and Socket.IO coordination when needed.
- Worker process for BullMQ consumers.
- Optional observability tools for local debugging.

Every stateful service should use named volumes. Ports should be documented and should not conflict with common local tooling.

## Common Commands

```bash
docker compose config
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down
docker compose down -v
```

Use `docker compose down -v` only when local data can be discarded.

## Build Validation

When Dockerfiles are integrated, validate builds from a clean checkout:

```bash
docker compose config
docker compose build
docker compose up --build
```

For multi-service repositories, prefer service-specific image names and documented build contexts.

## Runtime Configuration

Do not pass secrets with command-line flags where they can appear in shell history or process lists. Prefer environment files for local development and managed secret stores in staging and production.

For multi-tenant services, confirm that environment defaults cannot silently route all requests to a single tenant in staging or production.

## Production Notes

Production containers should be immutable. Configuration changes should create a new deployment or task revision, not mutate a running container.

Recommended runtime controls:

- Read-only root filesystem where feasible.
- Memory and CPU limits.
- Liveness and readiness probes.
- Structured logs to stdout/stderr.
- Explicit graceful shutdown timeout.
