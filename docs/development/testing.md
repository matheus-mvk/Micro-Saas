# Estrategia de Testes

Este documento define a estrategia de testes automatizados e validacoes manuais para a Plataforma de Inteligencia Logistica.

## Objetivos

Os testes devem proteger:

- autenticacao, sessao e MFA;
- isolamento multi-tenant;
- autorizacao por perfil;
- calculo deterministico de frete;
- imports assincronos;
- dashboard e insights;
- estados de erro do frontend;
- acessibilidade basica e experiencia responsiva;
- contratos compartilhados entre API e Web.

## Comandos principais

Na raiz do monorepo:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Por pacote:

```bash
pnpm --filter @logistics/api test
pnpm --filter @logistics/api test:e2e
pnpm --filter @logistics/api typecheck
pnpm --filter @logistics/api build

pnpm --filter @logistics/web test
pnpm --filter @logistics/web test:e2e
pnpm --filter @logistics/web typecheck
pnpm --filter @logistics/web build

pnpm --filter @logistics/shared build
```

Validacao Docker:

```bash
docker compose config
docker compose up --build
docker compose ps
docker compose logs -f api
docker compose logs -f web
```

## Backend

Ferramentas:

- Vitest;
- Nest testing utilities;
- Supertest para e2e HTTP;
- Prisma Client gerado a partir de `apps/api/prisma/schema.prisma`.

Testes existentes:

- filtros de excecao HTTP;
- guard privado por padrao;
- middleware de request context;
- validacao de environment;
- cache Redis tenant-scoped;
- gateway realtime;
- tentativas de login e bloqueio;
- token service;
- auth service;
- password service;
- motor de precificacao de frete.

Arquivos principais:

- `apps/api/src/common/filters/http-exception.filter.spec.ts`
- `apps/api/src/common/guards/private-by-default.guard.spec.ts`
- `apps/api/src/common/middleware/request-context.middleware.spec.ts`
- `apps/api/src/config/environment.spec.ts`
- `apps/api/src/infrastructure/cache/redis.service.spec.ts`
- `apps/api/src/infrastructure/realtime/notifications.gateway.spec.ts`
- `apps/api/src/modules/auth/*.spec.ts`
- `apps/api/src/modules/freight-simulations/pricing/freight-pricing.engine.spec.ts`

## Frontend

Ferramentas:

- Vitest;
- Testing Library;
- jsdom;
- Playwright para e2e browser.

Testes existentes:

- cliente HTTP;
- estados de erro;
- provider React Query;
- acessibilidade basica;
- landing page;
- login page;
- e2e home.

Arquivos principais:

- `apps/web/tests/http-client.test.ts`
- `apps/web/tests/error-state.test.tsx`
- `apps/web/tests/provider.test.tsx`
- `apps/web/tests/accessibility.test.tsx`
- `apps/web/tests/landing-page.test.tsx`
- `apps/web/tests/login-page.test.tsx`
- `apps/web/tests/e2e/home.spec.ts`

## Testes obrigatorios por requisito

| Requisito | Tipo minimo | Evidencia esperada |
| --- | --- | --- |
| Login e refresh | unit/integration | senha invalida, usuario bloqueado, tenant inativo, refresh rotativo |
| OAuth Google/GitHub | integration/manual prod | status configurado, state invalido recusado, callback valido |
| MFA/TOTP | unit/integration/manual | setup, confirmacao, desafio, recovery code, disable |
| RBAC | unit/integration | role sem permissao recebe 403 |
| Multi-tenant | integration/e2e | tenant A nao le nem altera dados do tenant B |
| Frete | unit/integration | calculo deterministico, breakdown, selecao de opcao |
| Imports | integration/e2e | preview, enqueue, processamento, cancelamento, retry, errors.csv |
| Realtime | unit/e2e | join em sala tenant, refresh de dashboard/imports/tracking |
| Insights | unit/integration | geracao, dedupe, read, dismiss e filtros |
| Auditoria | integration | eventos sensiveis gravados sem segredos |
| Landing | frontend/e2e | responsividade, CTAs e ausencia de erro visual grave |

## Smoke manual de demonstracao

1. Subir ambiente:

```bash
docker compose up --build
```

2. Login:

```text
administrador@dev.com / @DEV1512
```

3. Validar:

- `/dashboard` carrega indicadores;
- `/customers` lista dados tenant-scoped;
- `/carriers` lista transportadoras e servicos;
- `/freight/simulate` gera opcoes;
- `/freight/history` mostra historico;
- uma opcao selecionada pode virar Shipment;
- `/shipments` mostra status em portugues;
- `/imports` aceita fluxo de planilha;
- `/insights` gera e exibe contexto;
- `/audit` mostra eventos relevantes para `ADMIN`.

## Regras de qualidade

- Testes nao devem depender de dados de producao.
- Testes multi-tenant devem criar pelo menos dois tenants.
- Secrets, tokens e cookies completos nao devem aparecer em snapshots.
- Testes de upload devem cobrir extensao, MIME type, tamanho e tenant.
- Testes de async devem validar idempotencia e retry quando aplicavel.
- Testes de UI devem validar estado de loading, empty, error e sucesso.

## Bloqueios conhecidos

- Builds Next dentro do WSL podem falhar se `node_modules` foi instalado no Windows, por binario SWC com `invalid ELF header`. Reinstale dependencias no mesmo ambiente usado para build ou use Docker/CI.
- Prisma CLI requer Node `>=18.18`; Node 20 e o caminho recomendado.
- Testes e builds que usam Docker dependem do Docker Desktop ativo no Windows.

## Checklist antes da entrega

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config
docker compose up --build
```

Quando algum comando nao puder ser executado localmente, registre o motivo e o ambiente alternativo usado em `docs/development/final-validation-report.md`.
