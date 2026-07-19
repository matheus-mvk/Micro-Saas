# Risks And Recommendations

This document captures infrastructure risks and recommended mitigations for the platform.

## Key Risks

| Risk | Impact | Recommendation |
| --- | --- | --- |
| Missing tenant predicate in data access | Cross-tenant data exposure | Enforce tenant-scoped repository helpers and test unauthorized cross-tenant access. |
| Cache keys without tenant scope | Data leakage or stale data | Prefix tenant-specific cache keys with tenant ID or tenant slug. |
| Background jobs without tenant context | Work executes against wrong tenant | Require tenant ID in job payloads and validate it before side effects. |
| Manual production migrations | Downtime or data corruption | Use versioned migrations with staging dry runs and rollback notes. |
| Missing `pnpm-lock.yaml` | Non-reproducible dependency installs | Commit the lockfile and require frozen installs in CI. |
| Long-lived secrets | Increased blast radius after exposure | Use managed secrets and rotate credentials. |
| Unbounded worker concurrency | Queue storms and database saturation | Set explicit concurrency, retries, backoff, and dead-letter handling. |
| Insufficient observability | Slow incident response | Emit structured logs with request ID, tenant ID, user ID, service, and version. |
| Unscanned container images | Known vulnerabilities in production | Add image scanning before deployment. |

## Recommendations

1. Define tenant isolation as an explicit architecture decision record.
2. Commit `pnpm-lock.yaml` and require frozen pnpm installs.
3. Add tenant isolation tests before production onboarding.
4. Build immutable container images and deploy by digest.
5. Use managed database backups with tested restore procedures.
6. Keep destructive migrations separate from application deploys.
7. Add staging smoke tests that exercise login, tenant resolution, core logistics workflows, and worker processing.
8. Add alerting for error rate, latency, queue depth, failed jobs, database saturation, and tenant-specific anomaly spikes.

## Minimum Production Readiness Checklist

- CI required on protected branches.
- Secrets stored outside the repository.
- Staging mirrors production topology.
- Database backups and restore test are documented.
- Rollback procedure is documented and tested.
- Logs include correlation IDs and tenant context.
- Health checks exist for web, API, workers, database, cache, and queues.
- Incident response ownership is defined.
