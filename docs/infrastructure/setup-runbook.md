# Runbook de Setup Local, Docker e Producao

Este runbook complementa o README com os caminhos suportados de execucao e os bloqueios conhecidos de dependencias.

## Dependencias

Obrigatorias:

- Node.js compativel com o lockfile. Recomendado: Node 20.
- Prisma 6.19.x exige Node `>=18.18`.
- pnpm `9.15.x` via Corepack.
- MySQL compativel com Prisma provider `mysql`; TiDB Cloud e suportado como alvo SQL/MySQL gerenciado.
- Redis para cache, rate limit de login, BullMQ e realtime.

O projeto usa imagens Docker `node:20-alpine`, portanto Docker e o caminho recomendado quando a maquina local esta presa em Node antigo.

## Variaveis Obrigatorias Da API

Minimo para subir API:

```text
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
```

Variaveis importantes com default no backend:

```text
NODE_ENV
API_PORT
REDIS_URL
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN
AUTH_LOGIN_MAX_ATTEMPTS
AUTH_LOGIN_WINDOW_SECONDS
COOKIE_DOMAIN
CORS_ORIGINS
API_PUBLIC_URL
WEB_PUBLIC_URL
TOTP_ISSUER
ADDRESS_LOOKUP_PROVIDER
ROUTE_DISTANCE_PROVIDER
LOGISTICS_INTEGRATION_TIMEOUT_MS
IMPORT_STORAGE_DIR
IMAGE_STORAGE_DIR
IMPORT_MAX_FILE_SIZE_BYTES
IMPORT_MAX_ROWS
LOG_LEVEL
```

Variaveis opcionais de integracoes:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
OPENROUTE_API_KEY
```

Variaveis publicas do frontend:

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_API_TIMEOUT_MS
```

## Setup Local Manual

Use quando a maquina local tiver Node compativel:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:generate
pnpm db:deploy
pnpm dev
```

Para banco local via Compose acessado pela API local fora do container, ajuste `DATABASE_URL` para host publicado:

```text
DATABASE_URL=mysql://logistics:logistics_password@localhost:3307/logistics_saas
REDIS_HOST=localhost
REDIS_PORT=6379
```

Para API rodando dentro do Docker, use os hosts internos da rede Compose:

```text
DATABASE_URL=mysql://logistics:logistics_password@mysql:3306/logistics_saas
REDIS_HOST=redis
REDIS_PORT=6379
```

## Setup Docker Compose

Use quando quiser ambiente completo ou quando Node local estiver bloqueado:

```bash
cp .env.example .env
docker compose config
docker compose up --build
```

O servico local `api` executa `db:deploy` e a seed demo antes de iniciar o NestJS. Com isso, o ambiente Docker padrao ja sobe com os usuarios de demonstracao e teste por perfil.

Servicos padrao:

- Web: `http://localhost:3000`.
- API: `http://localhost:3333/api/v1`.
- Swagger em desenvolvimento: `http://localhost:3333/api/docs` ou `http://localhost:3333/docs`.
- MySQL interno: `mysql:3306`.
- MySQL publicado no host: `localhost:3307`.
- Redis interno/publicado: `redis:6379` ou `localhost:6379`.

Comandos uteis:

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f web
docker compose logs -f mysql
docker compose logs -f redis
docker compose down
```

Use `docker compose down -v` somente quando os dados locais puderem ser descartados.

## Migrations e Seed

Desenvolvimento:

```bash
pnpm db:migrate
pnpm db:seed
```

Ambientes compartilhados/producao:

```bash
pnpm db:deploy
```

Seed demo:

```bash
ALLOW_DEMO_SEED=true pnpm db:seed
```

Regra:

- `db:migrate` usa `prisma migrate dev` e e destinado a desenvolvimento.
- `db:deploy` usa `prisma migrate deploy` e e o caminho correto para staging/producao.
- `db:seed` cria dados demonstrativos e e bloqueado em `NODE_ENV=production` sem `ALLOW_DEMO_SEED=true`.
- No Docker Compose local, `db:deploy` e `db:seed` rodam automaticamente no startup do `api`.

## TiDB Cloud

Para TiDB Cloud:

1. Configure `DATABASE_URL` somente no backend/ambiente de execucao.
2. Garanta Node 20 ou Node `>=18.18` para rodar Prisma CLI.
3. Rode `pnpm db:deploy` a partir de CI, Docker ou maquina compativel.
4. Se o Prisma CLI local estiver bloqueado, use Docker/CI com Node 20.
5. Para desbloqueio administrativo sem seed local, use o SQL revisado em `docs/development/access-test-accounts.md`.

Nao configure `DATABASE_URL` no frontend. O frontend deve acessar dados somente via `NEXT_PUBLIC_API_URL`.

## Troubleshooting

### Prisma falha por versao do Node

Sintoma: Prisma CLI nao roda em Node 18 antigo.

Causa: `prisma@6.19.x` exige Node `>=18.18`.

Correcoes:

- Usar Node 20.
- Usar Docker Compose, que usa `node:20-alpine`.
- Rodar migrations por CI com Node compativel.
- Aplicar SQL manual apenas para dados operacionais revisados, nunca para substituir migrations estruturais sem revisao.

### API sobe, mas login falha

Verifique:

- `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` com pelo menos 32 caracteres.
- `DATABASE_URL` apontando para o banco correto.
- Usuario com `status = ACTIVE`.
- Tenant com `active = true`.
- Hash no formato `scrypt$salt$key`.
- `CORS_ORIGINS` e `COOKIE_DOMAIN` coerentes com Web/API.

### Filas/imports nao processam

Verifique:

- Redis acessivel por `REDIS_URL` ou `REDIS_HOST`/`REDIS_PORT`.
- Healthcheck de Redis no Compose.
- `IMPORT_STORAGE_DIR` gravavel pelo processo da API.
- Limites `IMPORT_MAX_FILE_SIZE_BYTES` e `IMPORT_MAX_ROWS`.

### Web nao chama API correta

Verifique:

- `NEXT_PUBLIC_API_URL` no build da Web.
- Build args do Dockerfile Web.
- `CORS_ORIGINS` na API.
- `API_PUBLIC_URL` e `WEB_PUBLIC_URL` para callbacks OAuth.
