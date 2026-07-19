# ADR 0006 - Asynchronous Processing

Status: accepted

Decision: Redis-backed BullMQ queues for imports, reports, simulations and analysis tasks.

Options: in-process jobs, database polling, BullMQ.

Rationale: BullMQ is mature in Node.js and fits Redis already required by the challenge.

Consequences: job payloads must include trusted tenant context and idempotency keys.
