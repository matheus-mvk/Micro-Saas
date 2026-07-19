# ADR 0008 - Prisma Backend Only

Status: accepted

Decision: Prisma Client is a server-side dependency inside `apps/api`.

Options: expose Prisma to shared packages, direct frontend database access, backend-only Prisma.

Rationale: database credentials must never reach the browser and persistence belongs to API infrastructure.

Consequences: frontend consumes documented API contracts only.
