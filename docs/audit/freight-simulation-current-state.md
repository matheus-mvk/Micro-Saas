# Freight Simulation Current State

Date: 2026-07-25

Scope: read-only audit of the freight simulation flow after the latest foundation/customer/security work. This audit does not implement functional code.

## Confirmed Implemented Foundation

The following items exist in code and should not be reimplemented from scratch by the next executor:

- Basic authentication: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- Refresh token rejects non-active users: `apps/api/src/modules/auth/auth.service.ts` checks `session.user.status !== UserStatus.ACTIVE`.
- Authenticated tenant context: `PrivateByDefaultGuard` and `AuthContextService` derive `tenantId`, `userId` and `role` from a verified access token and an active user.
- Realtime tenant isolation foundation: `NotificationsGateway` authenticates the Socket.IO handshake and joins only the tenant room derived from the authenticated token/cookie.
- Initial customers API: `apps/api/src/modules/customers/*`.
- Customer server-side pagination: `CustomersService.list()` uses `skip`, `take`, tenant filter and `count`.
- Customer CPF/CNPJ validation: implemented in `CustomersService`.
- Customer audit: `AuditAction.CUSTOMER_CHANGED` is recorded on create/update/status changes.
- Customer frontend: route `/customers`, service `apps/web/src/services/customers-service.ts`, component `CustomerManagement`.
- Dashboard summary: `GET /api/v1/dashboard/summary` counts current tenant data from MySQL.

## Known Platform Problems

- API and web tests fail before specs execute with `SyntaxError: Unexpected token '*'`.
- Web build compiles but did not finish local Next validation in the previous run.
- Lint was inconclusive locally.
- Seed is minimal and does not cover the full simulation narrative.
- E2E does not cover login to simulation to shipment.

## Freight Simulation Flow State

The full freight simulation flow is not functional. The current repository has:

- A simple `FreightSimulation` Prisma model with origin/destination postal codes, real/cubic weight fields, distance, estimated price, deadline and metadata.
- `FreightSimulationsModule` as an empty Nest module.
- One demo `freightSimulation.upsert()` in `apps/api/prisma/seed.ts` with static values.
- Dashboard aggregate that counts freight simulations and averages `estimatedPrice`.

The current repository does not have:

- simulation controller;
- simulation service/use case;
- simulation frontend page;
- multi-volume input;
- customer address model/service;
- branch CRUD;
- carrier CRUD API/UI;
- carrier transport service model;
- coverage model or route eligibility;
- freight rate tables, versions, ranges or additional charges;
- deterministic pricing engine;
- CEP lookup adapter;
- route/distance adapter;
- persisted simulation options;
- price component breakdown table;
- simulation history list/detail;
- option selection;
- shipment creation;
- tracking initialization;
- simulation-specific dashboard KPIs or insights.

## Existing Files Relevant To The Flow

Backend:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260718150000_init/migration.sql`
- `apps/api/prisma/seed.ts`
- `apps/api/src/modules/freight-simulations/freight-simulations.module.ts`
- `apps/api/src/modules/customers/*`
- `apps/api/src/modules/dashboard/dashboard.service.ts`
- `apps/api/src/modules/carriers/carriers.module.ts`
- `apps/api/src/modules/branches/branches.module.ts`
- `apps/api/src/modules/audit/audit.service.ts`
- `apps/api/src/infrastructure/realtime/notifications.gateway.ts`

Frontend:

- `apps/web/src/app/(dashboard)/customers/page.tsx`
- `apps/web/src/features/customers/customer-management.tsx`
- `apps/web/src/services/customers-service.ts`
- `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- `apps/web/src/features/dashboard/dashboard-summary.tsx`
- `apps/web/src/components/layout/app-shell.tsx`

Shared contracts:

- `packages/shared/src/index.ts`

## Existing Models

| Model | Relevance | Current state for simulation |
| --- | --- | --- |
| `Branch` | origin/operation unit candidate | Exists only as model and seed. No API/UI. No address fields. |
| `Customer` | customer selected in simulation | Exists with basic CRUD and tenant isolation. No address relation. |
| `Carrier` | transport company candidate | Exists as simple model and seed. No API/UI. No carrier services. |
| `FreightSimulation` | current simulation record | Exists but too shallow for full flow. No packages/options/components/snapshots. |
| `AuditLog` | audit support | Exists and customer/auth writes use it. No simulation-specific audit actions. |

## Missing Models From Minimum Expected Model

- `CustomerAddress`
- `CarrierService`
- `CarrierCoverage`
- `FreightRateTable`
- `FreightRateRange`
- `FreightAdditionalCharge`
- `FreightSimulationAddress`
- `FreightSimulationPackage`
- `FreightSimulationOption`
- `FreightSimulationPriceComponent`
- `Shipment`
- `ShipmentAddress`
- `ShipmentPackage`

`Branch`, `Carrier`, `FreightSimulation` and `AuditLog` exist, but need expansion or related tables.

## Existing Endpoints

Relevant existing endpoints:

- `GET /api/v1/customers`
- `GET /api/v1/customers/:id`
- `POST /api/v1/customers`
- `PATCH /api/v1/customers/:id`
- `PATCH /api/v1/customers/:id/status`
- `GET /api/v1/dashboard/summary`

Missing simulation endpoints:

- address lookup;
- branch CRUD;
- carrier CRUD;
- carrier transport service CRUD;
- coverage CRUD/test;
- freight rate table CRUD;
- rate range CRUD;
- additional charge CRUD;
- simulation create/calculate;
- simulation detail/history;
- option selection;
- shipment creation from option;
- simulation dashboard KPIs;
- simulation insights.

## Existing Pages

Relevant existing pages:

- `/login`
- `/dashboard`
- `/customers`

Missing pages:

- branch settings/origin selection;
- carrier management;
- carrier services;
- coverage management;
- freight rate tables and ranges;
- freight simulation form/results;
- freight simulation history/detail;
- shipment detail created from simulation;
- simulation dashboard details;
- simulation insights.

## Current Acceptance Position

The current code supports logging in, viewing a basic dashboard and maintaining basic customers. It does not support a complete freight simulation. A future implementation must build the missing domain and UI around the existing auth, tenant context, customer CRUD and audit foundation.
