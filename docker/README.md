# Docker Operations

This directory is reserved for Docker-specific supporting assets such as entrypoint scripts, helper environment examples, or local-only operational files when they are integrated by the application owners.

The runtime Docker assets currently live at the repository root and application boundaries:

- `docker-compose.yml`: local orchestration for app services and dependencies.
- `apps/api/Dockerfile`: NestJS API image.
- `apps/web/Dockerfile`: Next.js image.
- `.env.example`: local environment template consumed by Compose.
- `.dockerignore`: build context exclusions.

This README documents expected usage without changing runtime Docker assets. The broader setup runbook is available in `docs/infrastructure/setup-runbook.md`.

## Service Topology

Current Compose services:

- `api`: NestJS API on port `3333`, built from `apps/api/Dockerfile`.
- `web`: Next.js app on port `3000`, built from `apps/web/Dockerfile`.
- `mysql`: local MySQL 8.4 database.
- `redis`: cache, login rate limit storage, BullMQ backend, and realtime coordination support.
- `adminer`: optional database UI behind the `devtools` profile.

There is no separate `worker` service in the current Compose file. Async processing is wired through the API runtime modules today. If a dedicated BullMQ worker is introduced, it must receive tenant context in every job payload and be documented here before use.

## Local Usage

From the repository root:

```bash
cp .env.example .env
docker compose config
docker compose up --build
docker compose ps
docker compose logs -f
```

For dependency-only startup during local manual API/Web execution:

```bash
docker compose up -d mysql redis
```

For the optional database UI:

```bash
docker compose --profile devtools up -d adminer
```

Default endpoints:

- API: `http://localhost:3333/api/v1`.
- Web: `http://localhost:3000`.
- MySQL inside Docker network: `mysql:3306`.
- MySQL from host tools such as DBeaver: `localhost:3307`.
- Redis inside Docker network: `redis:6379`.
- Redis from host tools: `localhost:6379`.
- Adminer with profile `devtools`: `http://localhost:8080`.

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

Use `.env.example` as the baseline for `.env`.

Required or important API variables:

- `DATABASE_URL`: for containers, use `mysql://logistics:logistics_password@mysql:3306/logistics_saas`.
- `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`: local MySQL bootstrap values.
- `REDIS_HOST=redis`, `REDIS_PORT=6379`, or `REDIS_URL` when using a managed Redis endpoint.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: at least 32 characters and never production secrets in local files.
- `COOKIE_DOMAIN`, `CORS_ORIGINS`, `API_PUBLIC_URL`, `WEB_PUBLIC_URL`: must match local Web/API hosts.
- `IMPORT_STORAGE_DIR`, `IMAGE_STORAGE_DIR`, `IMPORT_MAX_FILE_SIZE_BYTES`, `IMPORT_MAX_ROWS`: upload and import controls.
- `ALLOW_DEMO_SEED`: keep `false` unless intentionally seeding demo data.

Frontend variables:

- `NEXT_PUBLIC_API_URL`: default `http://localhost:3333/api/v1`.
- `NEXT_PUBLIC_APP_URL`: default `http://localhost:3000`.
- `NEXT_PUBLIC_API_TIMEOUT_MS`: client request timeout.

Memory tuning variables consumed by Compose:

- `MYSQL_MEM_LIMIT`
- `REDIS_MEM_LIMIT`
- `API_MEM_LIMIT`
- `WEB_MEM_LIMIT`
- `API_NODE_OPTIONS`
- `WEB_NODE_OPTIONS`

Do not put `DATABASE_URL`, Redis credentials, JWT secrets, OAuth secrets, or MySQL credentials in frontend hosting environments.

## Migrations And Seed

For local development with Node installed on the host:

```bash
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

For Docker-first execution, run these commands from an API container after services are healthy:

```bash
docker compose run --rm api pnpm --filter @logistics/api db:generate
docker compose run --rm api pnpm --filter @logistics/api db:deploy
docker compose run --rm api pnpm --filter @logistics/api db:seed
```

The local `api` service also runs `db:deploy` and the demo seed before starting the NestJS process. This makes the default Docker environment include all demo users, including `administrador@dev.com`, `admin.test@dev.com`, `manager.test@dev.com`, and `operator.test@dev.com`.

Production-like environments should use `db:deploy`, not `db:migrate`. The demo seed is blocked in `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true`.

If the host machine is stuck on an old Node 18 version, prefer Docker because both application Dockerfiles use `node:20-alpine`. Prisma 6.19.x requires Node `>=18.18`.

## Multi-Tenant Validation

Local Docker data should include multiple tenants. After startup, validate that:

- API requests are resolved to the intended tenant.
- Database records are scoped by tenant.
- Cache keys do not collide across tenants.
- Workers include tenant ID in every job payload.
- Imports created by an `OPERATOR` are not visible to another operator.
- `ADMIN`, `MANAGER`, and `OPERATOR` accounts exercise the access matrix in `docs/security/access-control-matrix.md`.

The demo seed creates multiple tenants and user roles. Test account SQL and manual TiDB fallback commands are documented in `docs/development/access-test-accounts.md`.

## Image Guidance

Application Dockerfiles are present. Continue preserving these expectations:

- Lockfile-based dependency install.
- Multi-stage builds.
- Non-root runtime user.
- Explicit exposed ports.
- Healthcheck command.
- Minimal runtime image.

Current service roles:

- `api`: NestJS API on port `3333`.
- `web`: Next.js app on port `3000`.
- `mysql`: local MySQL database.
- `redis`: cache, BullMQ backend, and realtime coordination support.
- `adminer`: optional local database UI.
- `worker`: future dedicated async job consumer, not currently declared in Compose.

## Health And Logs

Compose healthchecks:

- `mysql`: `mysqladmin ping`.
- `redis`: `redis-cli ping`.
- `api`: HTTP check against `/api/v1/health/live`.
- `web`: HTTP check against `/`.

Useful log commands:

```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f mysql
docker compose logs -f redis
```

Use `docker compose ps` to confirm health status before debugging the application layer.

## Troubleshooting

Prisma or install fails on host:

- Use Docker with Node 20.
- Or upgrade host Node to `>=18.18`; Node 20 is recommended.

API cannot connect to database:

- Inside containers, `DATABASE_URL` must point to `mysql:3306`.
- From host tools, use `localhost:3307`.
- Confirm `docker compose ps mysql` is healthy.

API cannot connect to Redis:

- Inside containers, use `REDIS_HOST=redis` and `REDIS_PORT=6379`.
- From host tools, use `localhost:6379`.
- Confirm `docker compose logs -f redis`.

Web cannot call API:

- Confirm `NEXT_PUBLIC_API_URL` was provided at build time.
- Confirm `CORS_ORIGINS` includes `http://localhost:3000`.
- Rebuild `web` after changing public frontend variables.

Build fails in `web` or `api`:

- Re-run the failing filtered command outside Docker when possible to get shorter logs.
- Check `pnpm-lock.yaml` changes and Node/Prisma compatibility.
- Do not bypass TypeScript or Next.js build errors in Dockerfiles.

## CI Integration

The CI workflow should validate Docker Compose syntax when compose files are present at the repository root:

```bash
docker compose config
```

Recommended next checks:

- Build `api` and `web` images from a clean checkout.
- Run vulnerability scanning on built images.
- Run migrations against an ephemeral MySQL-compatible database.
- Validate healthchecks after `docker compose up --build`.
