# Logistics SaaS

Fundacao de uma plataforma SaaS multi-tenant para inteligencia logistica e analise de fretes.

## Stack

- Monorepo com pnpm workspaces e Turborepo.
- API NestJS, TypeScript, Prisma e MySQL.
- Web Next.js App Router, TypeScript e TanStack Query.
- Redis para cache, filas BullMQ e infraestrutura de tempo real via Socket.IO.
- Docker Compose para ambiente local.

## Inicio rapido

Requisitos minimos:

- Node.js 20 recomendado. Prisma 6.19.x exige pelo menos Node 18.18.
- pnpm 9.15.x via Corepack.
- MySQL compativel com Prisma provider `mysql`.
- Redis para cache, rate limit, filas BullMQ e realtime.

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:deploy
pnpm dev
```

Para ambiente Docker/Compose:

```bash
cp .env.example .env
docker compose config
docker compose up --build
```

No Docker Compose local, o servico `api` executa `pnpm --filter @logistics/api db:deploy` e, em ambiente nao producao, `pnpm --filter @logistics/api db:seed` antes de iniciar o NestJS. Portanto, ao subir o ambiente com Docker, as migrations sao aplicadas e os tenants/usuarios demo sao recriados automaticamente.

Contas criadas automaticamente pela seed no tenant `alpha-logistics`:

- `administrador@dev.com` — `ADMIN`;
- `admin.test@dev.com` — `ADMIN`;
- `manager.test@dev.com` — `MANAGER`;
- `operator.test@dev.com` — `OPERATOR`.

Senha padrao para todas: `@DEV1512`.

Observacao: a seed demo remove e recria os tenants demonstrativos (`alpha-logistics`, `beta-transportes`, `demo-logistics`, `satellite-logistics`). Nao use esses tenants para dados manuais que precisam ser preservados.

Servicos padrao:

- API: `http://localhost:3333/api/v1`
- Swagger em desenvolvimento: `http://localhost:3333/api/docs` ou `http://localhost:3333/docs`
- Web: `http://localhost:3000`
- MySQL interno para containers: `mysql:3306`
- MySQL externo pelo Windows/DBeaver: `localhost:3307`

Guias completos:

- Setup local, Docker, producao e TiDB: [docs/infrastructure/setup-runbook.md](docs/infrastructure/setup-runbook.md)
- Auditoria de cobertura do desafio tecnico: [docs/audit/technical-challenge-documentation-audit.md](docs/audit/technical-challenge-documentation-audit.md)
- Catalogo de funcionalidades: [docs/product/feature-catalog.md](docs/product/feature-catalog.md)
- Matriz de acesso e funcionalidades por perfil: [docs/security/access-control-matrix.md](docs/security/access-control-matrix.md)
- Contas de teste e SQL manual para TiDB: [docs/development/access-test-accounts.md](docs/development/access-test-accounts.md)
- Integracoes externas: [docs/architecture/external-integrations.md](docs/architecture/external-integrations.md)
- Regras de insights deterministicos: [docs/architecture/insight-rules.md](docs/architecture/insight-rules.md)

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

## Contas de teste por perfil

Para validar todos os tipos reais de acesso do projeto, use a senha padrão `@DEV1512` nas contas abaixo:

| Perfil | E-mail | Tenant/Fonte |
| --- | --- | --- |
| `ADMIN` | `administrador@dev.com` | Seed demo em `alpha-logistics` e SQL manual de desbloqueio |
| `ADMIN` | `admin.test@dev.com` | Seed demo em `alpha-logistics` e SQL manual de contas de teste |
| `MANAGER` | `manager.test@dev.com` | Seed demo em `alpha-logistics` e SQL manual de contas de teste |
| `OPERATOR` | `operator.test@dev.com` | Seed demo em `alpha-logistics` e SQL manual de contas de teste |

Essas contas também fazem parte da seed demo em `alpha-logistics`, então ficam disponíveis no ambiente local depois de rodar `pnpm db:seed` ou subir a API pelo Docker Compose. O SQL manual cria os pre-requisitos de chave estrangeira na ordem correta (`tenants`, `tenant_settings`, `tenant_onboarding`, `branches`, `users`) e usa hashes `scrypt` reais compativeis com o `PasswordService`. Se `administrador@dev.com` ja existir no mesmo tenant, o `INSERT` desse usuario falhara pela constraint unica de e-mail por tenant; nesse caso, use somente os usuarios faltantes ou atualize o usuario existente.

Quando o Prisma CLI local estiver bloqueado por versao de Node, use Docker/CI com Node 20 para migrations. Para desbloqueio administrativo pontual em TiDB Cloud, ha SQL manual revisado em [docs/development/access-test-accounts.md](docs/development/access-test-accounts.md).

## Escopo atual

Implementado: fundacao compilavel, contratos compartilhados, health checks, base de seguranca, base de multi-tenancy, landing inicial, login local, layout autenticado, dashboard resumido com dados do banco, cadastro/listagem basica de clientes tenant-scoped, enderecos de clientes, cadastros iniciais de filiais, transportadoras, servicos, coberturas, tabelas de frete, motor deterministico de precificacao, simulacao de frete com opcoes persistidas, historico, selecao de opcao, geracao de Shipment a partir da opcao selecionada, seed narrativo e Docker/documentacao.

Implementado parcialmente: autenticacao por e-mail e senha com cookies HttpOnly, access token, refresh token rotativo, logout, `/auth/me`, auditoria de login/falha/logout, bloqueio temporario por tentativas usando Redis, refresh recusando usuario nao ativo, OAuth Google/GitHub com state/callback/linking e fluxo B2B de aprovacao, MFA/TOTP com desafio de login, realtime com sala derivada da autenticacao, `/dashboard/summary` com isolamento por tenant, `/customers` com persistencia real no MySQL, `/freight/simulate` e `/freight/history` integradas ao backend.

Uploads usam duas estratégias: planilhas CSV/XLSX são importações assíncronas com BullMQ/Redis, enquanto imagens pequenas como logos de transportadoras usam upload síncrono via API. A decisão está documentada em `docs/architecture/uploads.md`.

Preparado: RBAC, importacoes, auditoria consultavel, dashboard completo, insights, tracking completo e integracoes externas configuraveis.

Dependencias externas: OAuth Google/GitHub exige `GOOGLE_*` e `GITHUB_*` reais nos ambientes de deploy. A integracao de CEP usa ViaCEP com fallback; a distancia usa calculo deterministico local quando nao ha coordenadas/chave externa configurada.

## Fluxo B2B de identidade

O registro publico por e-mail cria um tenant novo e transforma o primeiro usuario em `ADMIN`. O cadastro interno e convites mantem o usuario dentro do tenant autenticado. Ja o registro publico via OAuth cria primeiro um usuario `INCOMPLETE`, direciona para `/completar-cadastro`, vincula o tenant escolhido e muda o status para `PENDING`; somente um `ADMIN` do tenant pode aprovar o acesso em `/users`. Usuarios `PENDING`, `INCOMPLETE`, `BLOCKED`, `DISABLED` ou `DELETED` nao recebem JWT final.

## Decisão de segurança do Prisma

O Prisma está configurado somente no backend NestJS em `apps/api/prisma` e `apps/api/src/infrastructure/database`. O frontend em `apps/web` não importa `@prisma/client`, não lê `DATABASE_URL` e acessa dados apenas por HTTP via `NEXT_PUBLIC_API_URL`. Essa decisão impede exposição de usuário, senha e host do MySQL no bundle entregue ao navegador.

## Deploy gratuito descentralizado

A arquitetura de produção recomendada separa os limites de memória por serviço:

- Frontend `apps/web`: Vercel, com Root Directory na raiz do monorepo, Install Command `pnpm install --frozen-lockfile`, Build Command `pnpm --filter @logistics/shared build && pnpm --filter @logistics/web build` e Output Directory `apps/web/.next`.
- Backend `apps/api`: Render Web Service Docker usando `render.yaml`.
- MySQL: serviço gerenciado externo, configurado apenas no Render via `DATABASE_URL`.
- Redis: serviço gerenciado externo, preferencialmente `REDIS_URL=rediss://...` no Render.

Use `.env.production.example` como checklist. Variáveis `DATABASE_URL`, `REDIS_URL`, `JWT_*`, OAuth secrets e credenciais de banco nunca devem ser configuradas na Vercel.
