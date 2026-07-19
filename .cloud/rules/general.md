# General Rules

- Security defaults are stricter than convenience defaults.
- Tenant scoped data never trusts `tenantId` from the request body.
- Prisma remains backend-only.
- Public routes require explicit `@Public()`.
- Document decisions before expanding a module.
