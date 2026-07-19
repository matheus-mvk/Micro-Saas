# Data Model

The initial Prisma schema contains Tenant, Branch, User, RefreshToken, Customer, Carrier, FreightSimulation, ImportJob and AuditLog.

Tenant-scoped tables include `tenantId`, compound unique constraints where needed and indexes for common filters. Monetary, weight and dimension values use Prisma Decimal mapped to MySQL decimals.
