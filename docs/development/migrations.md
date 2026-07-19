# Migrations

Prisma migrations live in `apps/api/prisma/migrations`.

Use:

```bash
pnpm db:migrate
pnpm db:generate
```

Migrations must be reviewed for tenant indexes, foreign keys and decimal precision.
