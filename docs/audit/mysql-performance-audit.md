# MySQL Performance Audit

Date: 2026-07-25

Reviewer role: Senior MySQL Database Analyst and Performance Engineer.

## Summary

The current schema is a foundation schema, not the complete logistics platform schema. It contains tenant, branch, user, refresh token, customer, carrier, freight simulation, import job and audit log tables. It does not yet contain customer addresses, carrier services, freight rate tables, simulation options, shipments, packages, tracking events, import rows or insights.

## Findings And Changes

| Area | Finding | Change | Evidence | Status |
| --- | --- | --- | --- | --- |
| Migration compatibility | MySQL rejected the generated index name `freight_simulations_tenant_id_origin_postal_code_destination_postal_code_idx` because it exceeded the identifier limit | Renamed to `freight_simulations_tenant_route_idx` in schema and migration | `schema.prisma`, `20260718150000_init/migration.sql` | Fixed |
| Dashboard summary | The dashboard previously had no backend query and used frontend constants | Added `GET /dashboard/summary` with tenant-scoped counts using Prisma transaction | `DashboardService.getSummary` | Fixed for foundation metrics |
| Tenant isolation | All dashboard queries filter by `tenantId` | Implemented in each count/aggregate | `dashboard.service.ts` | Fixed for new endpoint |
| Refresh token lookup | Repository searches by `tokenHash`, while schema uniqueness is `(tenantId, tokenHash)` | No structural change yet | `auth.repository.ts`, `schema.prisma` | Pending |
| Seed idempotency | Core users were idempotent; operational demo data was missing | Added idempotent customer, carrier, freight simulation, import job and audit log using unique keys or fixed IDs | `seed.ts` | Improved |
| Production seed safety | Seed could run in production | Added `NODE_ENV=production` guard requiring `ALLOW_DEMO_SEED=true` | `seed.ts`, `.env.example` | Fixed |

## Index Review

Existing useful indexes:

- `branches(tenant_id, active)`
- `users(tenant_id, status)`
- `users(tenant_id, role)`
- `refresh_tokens(tenant_id, user_id, revoked_at)`
- `customers(tenant_id, active, name)`
- `carriers(tenant_id, active, name)`
- `freight_simulations(tenant_id, status, created_at)`
- `freight_simulations(tenant_id, origin_postal_code, destination_postal_code)`
- `import_jobs(tenant_id, status, created_at)`
- `audit_logs(tenant_id, action, created_at)`

No indexes were removed. One index was renamed for MySQL compatibility.

## Critical Missing Data Structures

The original challenge cannot be completed with the current schema alone. Missing models include carrier services, rate tables, freight rate versions, simulation options, shipments, shipment snapshots, tracking events, import rows, insights and MFA/OAuth/session management structures.

## Partial Migration Recovery Note

If the first migration failed after creating some tables, do not run `migrate reset` or remove volumes unless the database is explicitly disposable. For local recovery, manually create the missing tables from the corrected migration SQL and then use Prisma migrate resolve according to Prisma documentation, or start with a clean development database that has no valuable data.
