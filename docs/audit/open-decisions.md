# Open Decisions

Status: `IN_DESIGN`

## Decisions Recommended For Approval

| Decision | Recommendation | Rationale | Reversibility |
| --- | --- | --- | --- |
| First functional module | Identity and Access | All private routes, tenant context, RBAC, WebSocket, queues, and audit depend on trusted identity | Medium |
| Tenant model | Shared database, shared schema, mandatory `tenantId` on business tables | Matches current foundation and keeps MVP operational cost low | Medium |
| User tenancy | One tenant per user for MVP; design future memberships explicitly | Simpler auth, fewer edge cases; future membership can be added with migration | Medium |
| User email uniqueness | Unique by `(tenantId, email)` for MVP | Allows same email in different companies; aligns current schema | Medium |
| Identifiers | Keep UUID for current schema; evaluate ULID before adding high-volume tables | Avoids churn now; ULID improves chronological locality later | Medium |
| Freight pricing | Start with relational normalized rate tables plus limited validated JSON for fee breakdown only | Queryable, auditable, versioned, easier to test than arbitrary rule JSON | Medium |
| Shipment status | Store `Shipment.currentStatus` and append immutable `TrackingEvent` in same transaction | Fast operational reads and auditable timeline | Low |
| Tracking event model | Immutable append-only events with idempotency by source/externalEventId | Required for imports/webhooks/retries | Low |
| Realtime | Socket.IO rooms derived from authenticated server context | Prevents client-selected tenant rooms | Low |
| Imports | Specific import types, not one generic untyped importer | Prevents unvalidatable data flows | Medium |
| External APIs | ViaCEP or BrasilAPI for address enrichment plus OpenRouteService for distance/route estimation | Useful to freight simulation MVP with manageable integration risk | Medium |

## Decisions Still Open

| Topic | Options | Recommendation | Human Approval Needed |
| --- | --- | --- | --- |
| Platform superadmin | Separate global admin domain or tenant role extension | Separate internal role namespace | Yes |
| Branch scoping | Optional branch on users/resources or membership table | Keep branch optional until concrete use cases | Yes |
| OAuth tenant resolution | Email domain, invitation, explicit tenant selection, or membership | Invitation/membership first | Yes |
| MFA enforcement | Admin-only initially or all users | Admin/manager first, tenant policy later | Yes |
| Storage provider | Local volume, S3-compatible, cloud-specific blob store | S3-compatible abstraction after imports spec | Yes |
| Rate table complexity | Pure relational, hybrid JSON, code strategy, rules engine | Relational MVP with versioning | Yes |
| Tracking corrections | Admin-only correction event or edit with audit | Correction event, no mutation | Yes |
| Data retention | Fixed defaults or tenant plan configurable | Defaults now, plan configurable later | Yes |
| Redis exposure local | Keep host port or bind localhost only | Bind localhost in future hardening | No, low impact |
| CI runtime | Node 20 matching Docker or Node 22 matching current CI | Align versions before production | No, low impact |

## Decisions Rejected For Now

- Generic base repository for every model: adds ceremony before real access patterns exist.
- CQRS framework: useful only if read/write models diverge materially.
- Event sourcing for shipments: tracking events are append-only, but the system does not need full event sourcing.
- Rules engine for freight pricing in MVP: high complexity before tariff variability is proven.
- JSON-only freight rules: hard to validate, index, audit, and compare.
- Client-selected tenant for WebSocket rooms: unsafe.
