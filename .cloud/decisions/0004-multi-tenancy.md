# ADR 0004 - Multi-Tenancy

Status: accepted

Decision: shared database, shared schema and `tenantId` on scoped entities.

Options: database per tenant, schema per tenant, shared schema with tenant id.

Rationale: shared schema is the least operationally complex foundation for a technical test and keeps future extraction possible.

Consequences: every scoped query must filter by tenant; tests must cover cross-tenant access.
