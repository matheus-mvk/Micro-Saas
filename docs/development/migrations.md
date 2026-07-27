# Migrations

Prisma migrations live in `apps/api/prisma/migrations`.

Use:

```bash
pnpm db:migrate
pnpm db:generate
```

For Docker, CI and demo environments, use:

```bash
pnpm db:deploy
```

`db:migrate` runs `prisma migrate dev` and may require permission to create a shadow database. `db:deploy` runs `prisma migrate deploy` and is the expected command inside Compose.

Migrations must be reviewed for tenant indexes, foreign keys and decimal precision.
