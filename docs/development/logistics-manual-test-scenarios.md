# Logistics Manual Test Scenarios

Date: 2026-07-25

These scenarios describe the manual verification expected after the implementation prompt is executed. They are not currently all executable because most logistics services are missing or scaffolded.

## Current Executable Smoke Scenarios

### Public Landing

1. Open `http://localhost:3000/`.
2. Verify brand `Nexora Freight` is visible.
3. Verify CTA to `/login`.
4. Verify page is responsive on desktop and mobile.

Expected current status: partially executable.

### Local Login

1. Ensure migrations and seed are applied.
2. Open `http://localhost:3000/login`.
3. Enter `administrador@dev.com`.
4. Enter `@DEV1512`.
5. Submit.
6. Verify redirect to `/dashboard`.
7. Verify cookies are set by backend and frontend does not use localStorage for tokens.

Expected current status: executable only if database migration and seed are healthy.

### Dashboard Summary

1. Login as admin.
2. Open `/dashboard`.
3. Verify indicators load from `/api/v1/dashboard/summary`.
4. Stop API and retry to verify error state.

Expected current status: partially executable.

## Required Final Scenarios

### Tenant Isolation

1. Login as primary tenant admin.
2. List customers, carriers, simulations, shipments, import jobs and audit logs.
3. Attempt direct access to resource IDs from secondary tenant.
4. Verify either 404 or 403 according to documented policy.
5. Verify dashboard totals exclude secondary tenant records.
6. Verify realtime import/tracking events from secondary tenant are not received.

### User Management

1. Login as ADMIN.
2. Invite a new OPERATOR.
3. Change user to MANAGER.
4. Attempt to remove the last active ADMIN and verify rejection.
5. Disable a user and verify sessions are revoked.
6. Login as OPERATOR and verify restricted actions return 403.

### Customer and Address Management

1. Create legal entity customer with CNPJ.
2. Create natural person customer with CPF.
3. Add billing, pickup and delivery addresses.
4. Fill an address by CEP and edit manually.
5. Try duplicate document in same tenant and verify validation.
6. Verify same document in another tenant follows documented policy.

### Carrier, Services and Coverage

1. Create carrier.
2. Add economic and express services.
3. Configure weight limits, cubic factor and coverage.
4. Disable service and verify it is not offered in new simulations.
5. Disable carrier and verify no new simulation option uses it.

### Freight Rate Tables

1. Create active rate table for carrier service.
2. Add weight bands and fees.
3. Attempt overlapping band and verify rejection.
4. Create a new version with future vigency.
5. Verify historical simulation keeps old version and breakdown.

### Freight Simulation

1. Select optional customer.
2. Fill origin/destination by CEP.
3. Add multiple volumes.
4. Fill cargo value and desired date.
5. Run simulation.
6. Verify real weight, cubic weight and chargeable weight.
7. Verify options, unavailable reasons, cheapest and fastest indicators.
8. Open breakdown.
9. Select an option.
10. Verify audit entry.

### Simulation History

1. Open history.
2. Filter by period, customer, user, carrier, service, origin, destination and shipment relation.
3. Open detail.
4. Verify original input, volumes, options, selected option and rule versions.

### Shipment and Tracking

1. Create shipment from selected simulation option.
2. Verify address snapshots.
3. Register tracking events in valid order.
4. Try invalid status transition and verify rejection.
5. Register a correction event and verify original event remains.
6. Verify current shipment status matches timeline.

### Imports, Async and Realtime

1. Upload valid CSV.
2. Verify pre-validation preview.
3. Confirm import.
4. Verify BullMQ job starts.
5. Watch realtime progress.
6. Verify fallback polling by disabling websocket.
7. Upload file with row errors and download error report.
8. Re-upload same file and verify idempotency rule.

### Dashboard and Insights

1. Open dashboard with demo dataset.
2. Apply period/customer/carrier/service/status filters.
3. Verify KPIs match records in database.
4. Open insights.
5. Verify insight evidence, severity, metric and contextual link.
6. Mark insight as read and dismiss allowed insight.

### Audit

1. Perform login, user edit, customer edit, carrier edit, rate table edit, simulation, shipment and tracking actions.
2. Open audit page.
3. Filter by period, user, action and resource.
4. Verify no secrets, tokens, passwords, TOTP secrets or recovery codes appear.

### Security

1. Attempt brute-force login and verify lockout/rate limit.
2. Attempt mutation without CSRF token and verify rejection.
3. Attempt WebSocket room join for another tenant and verify rejection.
4. Verify OAuth failure pages and MFA challenge states.

### Seed Idempotency

1. Run seed.
2. Capture counts for tenants, users, customers, carriers and demo operational records.
3. Run seed again.
4. Verify counts and unique records do not duplicate.

## Final Demonstration Flow

1. Open landing.
2. Login as `administrador@dev.com`.
3. Review dashboard.
4. Create customer.
5. Create carrier service and rate table.
6. Run freight simulation.
7. Select option.
8. Create shipment.
9. Register tracking.
10. Import a file.
11. Watch progress.
12. Review audit.
13. Review insight.
14. Logout.
