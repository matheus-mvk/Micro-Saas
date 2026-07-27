# Ambiente Local

Este documento define a base de desenvolvimento local para a plataforma SaaS.

## Pre-requisitos

Instale estas ferramentas localmente:

- Git.
- Node.js LTS compativel com o runtime da aplicacao.
- `pnpm` via Corepack. O manifesto raiz declara atualmente `pnpm@9.15.4`.
- Docker Engine and Docker Compose v2.
- Um cliente MySQL.
- Redis CLI opcional para diagnostico de cache e filas.

O repositorio e um workspace pnpm com Turborepo. Quando `pnpm-lock.yaml` estiver presente, use instalacoes congeladas:

```bash
corepack enable
pnpm install --frozen-lockfile
```

Enquanto o lockfile nao estiver integrado, use:

```bash
corepack enable
pnpm install
```

## Arquivos de Ambiente

Use um arquivo de exemplo versionado quando disponivel, como `.env.example`, e crie um `.env` local a partir dele. Nao commite valores locais de segredos.

Grupos de variaveis recomendados:

- Aplicacao: `NODE_ENV`, `API_PORT`, `WEB_PORT`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`.
- Banco de dados: `DATABASE_URL`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`.
- Cache e fila: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- Auth: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, expiracao de tokens, configuracoes de cliente OAuth, `TOTP_ISSUER`.
- Acesso pelo navegador: `COOKIE_DOMAIN`, `CORS_ORIGINS`.
- Observabilidade: `LOG_LEVEL` e configuracoes futuras de exportador de traces.

## Fluxo de Inicializacao

Use os scripts do repositorio:

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm dev
```

Endpoints locais padrao:

- API: `http://localhost:3333/api/v1`.
- Swagger em desenvolvimento: `http://localhost:3333/api/docs` ou `http://localhost:3333/docs`.
- Web: `http://localhost:3000`.
- MySQL dentro da rede Docker: `mysql:3306`.
- MySQL a partir do Windows ou DBeaver: `localhost:3307`.

## Servicos Locais

Inicie dependencias externas via Docker Compose quando disponivel:

```bash
docker compose up -d
docker compose ps
docker compose logs -f
```

Rode migrations e seed somente pelos scripts do proprio repositorio:

```bash
pnpm db:migrate
pnpm db:seed
```

Quando a API roda como container, mantenha `DATABASE_URL` apontando para o servico Docker interno:

```bash
mysql://logistics:logistics_password@mysql:3306/logistics_saas
```

Para ferramentas externas no Windows, como DBeaver, use host `localhost`, porta `3307`, banco `logistics_saas`, usuario `logistics` e senha `logistics_password`.

Dados locais de seed devem incluir pelo menos dois tenants para que falhas de acesso cross-tenant fiquem visiveis durante o desenvolvimento.

## Verificacoes Locais Multi-Tenant

Antes de abrir um pull request que altera comportamento sensivel a tenant, valide:

- Requisicoes do tenant A nao conseguem ler nem alterar registros do tenant B.
- Jobs em background carregam contexto de tenant explicitamente.
- Chaves de cache incluem escopo de tenant quando o dado e especifico de tenant.
- Handlers de webhook resolvem contexto de tenant antes de efeitos colaterais.
- Impersonacao administrativa ou de suporte e auditada e limitada por tempo.

## Higiene de Dados Locais

- Mantenha bancos locais descartaveis.
- Evite usar dados de producao localmente.
- Se dados realistas forem necessarios, use fixtures anonimizadas.
- Reinicie volumes locais quando o historico de migrations ou os dados de seed mudarem de forma incompativel.
