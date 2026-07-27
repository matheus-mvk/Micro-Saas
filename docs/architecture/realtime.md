# Realtime

Status: `IN_DESIGN`

Socket.IO is currently prepared as infrastructure. This design describes the safe future behavior.

## Events

| Event | Direction | Payload |
| --- | --- | --- |
| `shipment.updated.v1` | server to client | `tenantId`, `shipmentId`, `version`, `currentStatus`, `currentStatusAt` |
| `tracking.event_created.v1` | server to client | `tenantId`, `shipmentId`, `trackingEventId`, `occurredAt`, `eventType` |
| `import.progress.v1` | server to client | `tenantId`, `importJobId`, `status`, `processedRows`, `totalRows`, `errorCount` |
| `import.completed.v1` | server to client | `tenantId`, `importJobId`, `status`, `summary` |
| `dashboard.updated.v1` | server to client | `tenantId`, `period`, `affectedKpis` |
| `notification.created.v1` | server to client | `tenantId`, `notificationId`, `severity`, `resource` |

## Room Strategy

```mermaid
flowchart TD
  Handshake[Authenticated handshake] --> Session[Resolve user tenant and permissions]
  Session --> TenantRoom[tenant:{tenantId}]
  Session --> ResourceRoom[tenant:{tenantId}:shipment:{shipmentId}]
  ServerEvent[Server domain event] --> Authorize[Authorize room subscription]
  Authorize --> Emit[Emit versioned event]
```

Candidate rooms:

- `tenant:{tenantId}`
- `tenant:{tenantId}:shipment:{shipmentId}`
- `tenant:{tenantId}:import:{importJobId}`
- `tenant:{tenantId}:dashboard`

The client cannot choose tenant arbitrarily. Tenant must be derived from authenticated session and membership.

## Security

- Authenticate Socket.IO handshake with secure cookie or short-lived token.
- Validate origin against the same CORS allowlist as HTTP.
- Authorize room subscription per resource.
- Do not include sensitive payloads; emit IDs and summary fields.
- Disconnect users whose session is revoked.

## Reliability

- Reconnect with last seen version/timestamp.
- Provide polling fallback for imports and tracking timeline.
- Use Redis adapter if API has more than one replica.
- Version event names and payloads.
- Track connection count, join failures, emitted events, and delivery errors.
