# Modelo De Dados

O schema Prisma inicial contem Tenant, Branch, User, RefreshToken, Customer, Carrier, FreightSimulation, ImportJob e AuditLog.

Tabelas tenant-scoped incluem `tenantId`, constraints unicas compostas quando necessario e indices para filtros comuns. Valores monetarios, pesos e dimensoes usam Prisma Decimal mapeado para decimals do MySQL.
