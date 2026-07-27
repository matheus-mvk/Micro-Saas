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

Para ambiente Docker/Compose, aplique migrations com deploy:

```bash
pnpm db:deploy
pnpm db:seed
```

Servicos padrao:

- API: `http://localhost:3333/api/v1`
- Swagger em desenvolvimento: `http://localhost:3333/api/docs` ou `http://localhost:3333/docs`
- Web: `http://localhost:3000`
- MySQL interno para containers: `mysql:3306`
- MySQL externo pelo Windows/DBeaver: `localhost:3307`

## Validacao

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config
docker compose up --build
```

## Login de demonstração

Depois de aplicar migrations e seed, use:

- E-mail: `administrador@dev.com`
- Senha: `@DEV1512`
- Perfil: `ADMIN`
- Tenant: `alpha-logistics`

O seed também cria usuários `ADMIN`, `MANAGER` e `OPERATOR`, incluindo supervisor, operador, analista, visualizador, usuário desativado e o segundo tenant `beta-transportes` para cenários de isolamento. A documentação completa da base de homologação está em [docs/development/demo-seed.md](docs/development/demo-seed.md).

## Escopo atual

Implementado: fundacao compilavel, contratos compartilhados, health checks, base de seguranca, base de multi-tenancy, landing inicial, login local, layout autenticado, dashboard resumido com dados do banco, cadastro/listagem basica de clientes tenant-scoped, enderecos de clientes, cadastros iniciais de filiais, transportadoras, servicos, coberturas, tabelas de frete, motor deterministico de precificacao, simulacao de frete com opcoes persistidas, historico, selecao de opcao, geracao de Shipment a partir da opcao selecionada, seed narrativo e Docker/documentacao.

Implementado parcialmente: autenticacao por e-mail e senha com cookies HttpOnly, access token, refresh token rotativo, logout, `/auth/me`, auditoria de login/falha/logout, bloqueio temporario por tentativas usando Redis, refresh recusando usuario nao ativo, realtime com sala derivada da autenticacao, `/dashboard/summary` com isolamento por tenant, `/customers` com persistencia real no MySQL, `/freight/simulate` e `/freight/history` integradas ao backend.

Preparado: RBAC, importacoes, auditoria consultavel, dashboard completo, insights, tracking completo e integracoes externas configuraveis.

Nao implementado nesta etapa: OAuth, MFA, recuperacao de senha, importacao completa, tracking completo, insights finais e dashboard final com todos os indicadores. A integracao de CEP usa ViaCEP com fallback; a distancia usa calculo deterministico local quando nao ha coordenadas/chave externa configurada.

## Decisão de segurança do Prisma

O Prisma está configurado somente no backend NestJS em `apps/api/prisma` e `apps/api/src/infrastructure/database`. O frontend em `apps/web` não importa `@prisma/client`, não lê `DATABASE_URL` e acessa dados apenas por HTTP via `NEXT_PUBLIC_API_URL`. Essa decisão impede exposição de usuário, senha e host do MySQL no bundle entregue ao navegador.

## Deploy gratuito descentralizado

A arquitetura de produção recomendada separa os limites de memória por serviço:

- Frontend `apps/web`: Vercel, com Root Directory na raiz do monorepo, Install Command `pnpm install --frozen-lockfile`, Build Command `pnpm --filter @logistics/shared build && pnpm --filter @logistics/web build` e Output Directory `apps/web/.next`.
- Backend `apps/api`: Render Web Service Docker usando `render.yaml`.
- MySQL: serviço gerenciado externo, configurado apenas no Render via `DATABASE_URL`.
- Redis: serviço gerenciado externo, preferencialmente `REDIS_URL=rediss://...` no Render.

Use `.env.production.example` como checklist. Variáveis `DATABASE_URL`, `REDIS_URL`, `JWT_*`, OAuth secrets e credenciais de banco nunca devem ser configuradas na Vercel.
