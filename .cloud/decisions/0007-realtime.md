# ADR 0007 - Realtime

Status: accepted

Decision: Socket.IO gateway with tenant-scoped rooms.

Options: polling, SSE, Socket.IO.

Rationale: progress events and notifications benefit from bidirectional connection management.

Consequences: room joins must be authorized after real authentication lands.
