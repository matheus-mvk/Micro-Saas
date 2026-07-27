# Manual Test Scenarios

Date: 2026-07-25

## Local Demo Smoke

1. Build the API image after schema/migration changes.
2. Start MySQL, Redis, API and Web with Docker Compose.
3. Apply migrations with `prisma migrate deploy`.
4. Run `db:seed` twice.
5. Open `http://localhost:3000`.
6. Navigate to login.
7. Login with `administrador@dev.com` and `@DEV1512`.
8. Confirm redirect to `/dashboard`.
9. Confirm dashboard counters are not hard-coded and load from `/api/v1/dashboard/summary`.
10. Logout and confirm private dashboard requires session again.

## Negative Auth

1. Submit invalid password.
2. Expected: `401`, generic message, no user enumeration.
3. Repeat invalid attempts until lockout.
4. Expected: `429`, audit failure and no password in logs.

## Current Partial Migration Recovery

If the first migration failed on the long freight simulation index, rebuild the API image with the corrected migration. If the database has valuable data, do not reset it; manually apply the missing table SQL from the corrected migration and resolve migration state with Prisma. If the database is disposable, use a fresh development database.

## Deferred Journeys

User CRUD, customer CRUD, carrier services, freight rules, simulation, history, shipment, tracking, upload, realtime, MFA and audit UI cannot be manually validated yet because the routes/endpoints are not implemented.
