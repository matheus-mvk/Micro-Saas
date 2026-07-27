# Implementation Sequence

Status: `IN_DESIGN`

This is a dependency-ordered sequence, not a calendar.

## 1. Identity and Access

Prerequisites: approve auth decisions, cookie policy, tenant resolution, role model.

Backend: login, refresh rotation, logout, session revocation, `/me`, auth guard deriving context from verified credentials.

Frontend: login mutation, session provider, protected dashboard, MFA/OAuth placeholders by contract.

Security: anti-enumeration, rate limiting, HttpOnly cookies, CSRF, audit.

Tests: auth success/failure, refresh reuse, logout, disabled user, tenant disabled.

Skill: update `auth` and `security`.

ADR: authentication details if decisions change.

Done when: no private route trusts user/tenant/role headers.

## 2. Tenant and Authorization

Prerequisites: identity context.

Backend: tenant context, branch scope, permission checks by action/resource.

Frontend: visible tenant context and forbidden states.

Tests: cross-tenant denial and RBAC matrix.

Done when: tenant-scoped repository conventions are proven by tests.

## 3. Users

Prerequisites: auth and authorization.

Backend: invite/list/update/deactivate/change role use cases.

Frontend: user table, invite flow, role change confirmation.

Security: audit every role/status change.

Done when: ADMIN can manage tenant users without cross-tenant leaks.

## 4. Customers and Addresses

Prerequisites: tenant-scoped repositories and audit.

Backend: customer/address use cases with pagination, filters, soft deactivate.

Frontend: customer list/detail/form, address management.

Integrations: optional ViaCEP/BrasilAPI lookup.

Done when: customer data supports future shipment snapshots.

## 5. Carriers and Carrier Services

Prerequisites: customers patterns reused only where real.

Backend: carrier and service use cases.

Frontend: carrier/service list and edit flows.

Done when: carrier service can be referenced by pricing/simulation.

## 6. Freight Pricing

Prerequisites: carrier services and approved rate model.

Backend: rate table draft/publish/version, calculation service.

Frontend: rate table upload/manual screens as approved.

Tests: decimals, validity, min freight, tenant isolation.

Done when: pricing engine returns explainable calculations for MVP scenarios.

## 7. Freight Simulation and Options

Prerequisites: pricing, customers, carriers.

Backend: create simulation, calculate options, persist rule versions.

Frontend: simulation form and comparison matrix.

Integrations: route distance provider with fallback.

Done when: user can compare options without creating shipment automatically.

## 8. Shipments

Prerequisites: simulation option model or manual creation decision.

Backend: create shipment from option/manual/import, address/package snapshots.

Frontend: shipment list/detail.

Tests: transaction from selected option and tenant isolation.

Done when: shipment is operationally separate from simulation.

## 9. Tracking

Prerequisites: shipment, status machine, audit, realtime auth.

Backend: append events, update current status transactionally, idempotency.

Frontend: timeline and manual event form.

Tests: invalid transition, duplicate, out-of-order, correction, WebSocket.

Done when: tracking timeline is immutable and current status is consistent.

## 10. Imports and Workers

Prerequisites: target modules and storage decision.

Backend: upload validation, ImportJob, row processing workers.

Frontend: import wizard and progress view.

Infrastructure: dedicated worker service.

Done when: one approved import type runs safely end to end.

## 11. Realtime

Prerequisites: auth/session and resource authorization.

Backend: authenticated Socket.IO handshake, resource rooms, versioned events.

Frontend: import/tracking subscriptions and polling fallback.

Done when: client cannot join arbitrary tenant rooms.

## 12. Dashboard

Prerequisites: simulations, shipments, tracking, imports.

Backend: tenant-scoped aggregations by period.

Frontend: filters, KPIs, priority lists, drill-down.

Done when: all numbers come from real data and show source/period.

## 13. Insights

Prerequisites: dashboard metrics and historical data.

Backend: deterministic rules, insight lifecycle, dismiss/read.

Frontend: explainable insight panels.

Done when: insight shows rule, source, confidence/relevance, and action.

## 14. Audit Querying

Prerequisites: audit writes across modules.

Backend: query/export audit trail with filters.

Frontend: audit table and entity audit drawer.

Done when: sensitive actions are traceable without exposing secrets.

## 15. Landing Final, Observability, Deploy, Hardening

Prerequisites: product claims backed by implemented modules.

Work: final landing content, metrics/tracing, image slimming, CI image build, migration deploy, backups, smoke tests, production secret handling.

Done when: public deployment and operational runbook are approved.
