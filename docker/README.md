# Docker Operations

This directory should contain Docker-specific assets such as Dockerfiles, compose files, entrypoint scripts, or environment examples when they are integrated by the application owners.

This README documents expected usage without changing runtime Docker assets.

## Local Usage

From the repository root:

```bash
docker compose config
docker compose up -d
docker compose ps
docker compose logs -f
```

Stop local services:

```bash
docker compose down
```

Stop and remove local volumes only when local data can be discarded:

```bash
docker compose down -v
```

## Environment Variables

Local Docker configuration should read from a development-only environment file. Do not commit real secrets.

Recommended local-only examples:

- MySQL database name, user, and password.
- Redis host, port, and password.
- Queue broker URL.
- Local auth issuer or mock auth settings.
- Tenant fixture IDs for seed scripts.

## Multi-Tenant Validation

Local Docker data should include multiple tenants. After startup, validate that:

- API requests are resolved to the intended tenant.
- Database records are scoped by tenant.
- Cache keys do not collide across tenants.
- Workers include tenant ID in every job payload.

## Image Guidance

When Dockerfiles are added, prefer:

- Lockfile-based dependency install.
- Multi-stage builds.
- Non-root runtime user.
- Explicit exposed ports.
- Healthcheck command.
- Minimal runtime image.

Expected service roles:

- `api`: NestJS API on port `3333`.
- `web`: Next.js app on port `3000`.
- `mysql`: local MySQL database.
- `redis`: cache, BullMQ backend, and realtime coordination support.
- `worker`: async job consumer.

## CI Integration

The CI workflow validates Docker Compose syntax when compose files are present at the repository root. Extend the workflow with image builds and scanning once Dockerfiles are finalized.
