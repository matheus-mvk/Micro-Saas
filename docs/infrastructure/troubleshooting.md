# Troubleshooting

Use this guide for local, CI, Docker, and deployment failures.

## Local Install Fails

Check the package manager and lockfile:

```bash
ls
node --version
corepack --version
pnpm --version
```

Then install with the matching command:

```bash
pnpm install --frozen-lockfile
pnpm install
```

Use `pnpm install --frozen-lockfile` when `pnpm-lock.yaml` exists. Use plain `pnpm install` only while the lockfile is not yet integrated.

## Docker Compose Fails

Validate compose syntax:

```bash
docker compose config
docker compose ps
docker compose logs -f
```

Common causes:

- Required environment variable is missing.
- Host port is already in use.
- Named volume contains data from an incompatible schema.
- Service healthcheck has not completed.
- Container cannot resolve another service name.

If Windows already has a local MySQL listening on `localhost:3306`, keep it running and use the container database through `localhost:3307` from Windows tools. Do not change the internal container URL `mysql:3306`.

For disposable local data, reset volumes:

```bash
docker compose down -v
docker compose up -d
```

## CI Fails On Install

Check:

- Lockfile matches the package manager.
- `package.json` and lockfile were committed together.
- Private registry tokens are configured only when needed.
- Postinstall scripts do not require unavailable local services.

## CI Fails On Tests

Check whether the failing test assumes:

- A fixed timezone.
- Shared global state.
- A specific test execution order.
- A tenant fixture that was not created.
- A database or cache service that is not started in CI.

Tests for tenant isolation should create their own tenants and records instead of relying on pre-existing local data.

## Database Connection Fails

Check:

- Connection string value.
- DNS or container service name.
- Port exposure.
- SSL mode requirements.
- Database user permissions.
- Migration state.

For local Docker, the default database URL points to the `mysql` compose service:

```bash
mysql://logistics:logistics_password@mysql:3306/logistics_saas
```

This URL is for containers on the Docker network. For DBeaver or another Windows client, use:

```text
Host: localhost
Port: 3307
Database: logistics_saas
User: logistics
Password: logistics_password
```

In staging and production, avoid manual schema changes. Use the migration process owned by the application.

## Tenant Leakage Suspected

Immediate checks:

- Identify request ID, tenant ID, user ID, and endpoint.
- Confirm tenant context resolution from auth token, host, or request metadata.
- Inspect queries for missing tenant predicates.
- Inspect cache keys for missing tenant scope.
- Check background job payloads for tenant context.

Containment actions:

- Disable affected feature flag if available.
- Stop affected worker queue if leakage is async.
- Preserve logs and audit records.
- Patch tests to reproduce the leakage before release.

## Production Incident Checklist

- Confirm whether the issue is global or tenant-specific.
- Check error rate, latency, saturation, and queue depth.
- Compare current deployment version with last known good version.
- Review recent migrations and configuration changes.
- Decide between rollback, feature flag disablement, or forward fix.
- Record timeline and follow-up actions after recovery.
