# Database Optimization Decisions

Date: 2026-07-25

## Decisions

1. Use `prisma migrate deploy` for Docker/CI/demo environments.
   - Reason: `migrate dev` requires a shadow database and failed with the limited MySQL user.
   - Evidence: local Docker error `P3014`.

2. Keep tenant equality as the leading column for business indexes.
   - Reason: all business reads must be tenant-scoped.
   - Evidence: current schema indexes use `tenant_id` first.

3. Rename long generated indexes explicitly.
   - Reason: MySQL identifier limit is 64 characters.
   - Evidence: migration error `1059`.

4. Aggregate dashboard counters in the API using database counts/aggregate queries.
   - Reason: avoid loading rows into Node.js or computing dashboard numbers in the frontend.
   - Evidence: `DashboardService.getSummary`.

5. Do not add broad indexes for unimplemented queries.
   - Reason: indexes should match real endpoint filters and ordering.
   - Evidence: most domain endpoints are not implemented yet.
