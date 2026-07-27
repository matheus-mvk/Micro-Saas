# Local Environment

This document defines the local development baseline for the SaaS platform.

## Prerequisites

Install these tools locally:

- Git.
- Node.js LTS compatible with the application runtime.
- `pnpm` through Corepack. The root manifest currently declares `pnpm@9.15.4`.
- Docker Engine and Docker Compose v2.
- A MySQL client.
- Optional Redis CLI for cache and queue diagnostics.

The repository is a pnpm workspace with Turborepo. When `pnpm-lock.yaml` is present, use frozen installs:

```bash
corepack enable
pnpm install --frozen-lockfile
```

Until the lockfile is integrated, use:

```bash
corepack enable
pnpm install
```

## Environment Files

Use a checked-in example file when available, such as `.env.example`, and create a local `.env` from it. Do not commit local secret values.

Recommended variable groups:

- Application: `NODE_ENV`, `API_PORT`, `WEB_PORT`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`.
- Database: `DATABASE_URL`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`.
- Cache and queue: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- Auth: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, token expiration, OAuth client settings, `TOTP_ISSUER`.
- Browser access: `COOKIE_DOMAIN`, `CORS_ORIGINS`.
- Observability: `LOG_LEVEL` and future trace exporter settings.

## Startup Flow

Use the repository scripts:

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm dev
```

Default local endpoints:

- API: `http://localhost:3333/api/v1`.
- Swagger in development: `http://localhost:3333/api/docs` or `http://localhost:3333/docs`.
- Web: `http://localhost:3000`.
- MySQL inside Docker network: `mysql:3306`.
- MySQL from Windows or DBeaver: `localhost:3307`.

## Local Services

Start external dependencies through Docker Compose when available:

```bash
docker compose up -d
docker compose ps
docker compose logs -f
```

Run migrations and seed data only through repository-owned scripts:

```bash
pnpm db:migrate
pnpm db:seed
```

When the API runs as a container, keep `DATABASE_URL` pointing to the internal Docker service:

```bash
mysql://logistics:logistics_password@mysql:3306/logistics_saas
```

For external tools on Windows, such as DBeaver, use host `localhost`, port `3307`, database `logistics_saas`, user `logistics`, and password `logistics_password`.

Local seed data should include at least two tenants so cross-tenant access bugs are visible during development.

## Multi-Tenant Local Checks

Before opening a pull request that touches tenant-aware behavior, validate:

- Requests for tenant A cannot read or mutate tenant B records.
- Background jobs carry tenant context explicitly.
- Cache keys include tenant scope where data is tenant-specific.
- Webhook handlers resolve tenant context before side effects.
- Admin or support impersonation is audited and time-limited.

## Local Data Hygiene

- Keep local databases disposable.
- Avoid using production data locally.
- If realistic data is required, use anonymized fixtures.
- Reset local volumes when migration history or seed data changes incompatibly.
