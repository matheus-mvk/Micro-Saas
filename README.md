# Logistics SaaS

Fundacao de uma plataforma SaaS multi-tenant para inteligencia logistica e analise de fretes.

## Stack

- Monorepo com pnpm workspaces e Turborepo.
- API NestJS, TypeScript, Prisma e MySQL.
- Web Next.js App Router, TypeScript e TanStack Query.
- Redis para cache, filas BullMQ e infraestrutura de tempo real via Socket.IO.
- Docker Compose para ambiente local.

## Inicio rapido

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

Servicos padrao:

- API: `http://localhost:3333/api/v1`
- Swagger em desenvolvimento: `http://localhost:3333/docs`
- Web: `http://localhost:3000`

## Validacao

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config
docker compose up --build
```

## Escopo atual

Implementado: fundacao compilavel, contratos compartilhados, health checks, base de seguranca, base de multi-tenancy, landing inicial, layout autenticado inicial, Docker e documentacao.

Preparado: autenticacao, RBAC, importacoes, simulacoes, auditoria, dashboard, insights e integracoes externas.

Nao implementado nesta etapa: CRUDs completos, login real, OAuth, MFA, calculo completo de frete, importacao completa e dashboard final.
