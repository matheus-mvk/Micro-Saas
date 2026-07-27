# Operacoes Docker

Este diretorio e reservado para assets de suporte especificos de Docker, como scripts de entrypoint, exemplos auxiliares de ambiente ou arquivos operacionais somente locais quando forem integrados pelos donos da aplicacao.

Os assets Docker de runtime vivem atualmente na raiz do repositorio e nas fronteiras das aplicacoes:

- `docker-compose.yml`: orquestracao local de servicos da aplicacao e dependencias.
- `apps/api/Dockerfile`: imagem da API NestJS.
- `apps/web/Dockerfile`: imagem Next.js.
- `.env.example`: template de ambiente local consumido pelo Compose.
- `.dockerignore`: exclusoes do contexto de build.

Este README documenta o uso esperado sem alterar assets Docker de runtime. O runbook mais amplo de setup esta em `docs/infrastructure/setup-runbook.md`.

## Topologia De Servicos

Servicos atuais do Compose:

- `api`: API NestJS na porta `3333`, construida a partir de `apps/api/Dockerfile`.
- `web`: app Next.js na porta `3000`, construido a partir de `apps/web/Dockerfile`.
- `mysql`: banco local MySQL 8.4.
- `redis`: cache, armazenamento de rate limit de login, backend BullMQ e suporte de coordenacao realtime.
- `adminer`: UI opcional de banco por tras do profile `devtools`.

Nao ha servico `worker` separado no arquivo Compose atual. Hoje o processamento assincrono esta conectado pelos modulos de runtime da API. Se um worker BullMQ dedicado for introduzido, ele deve receber contexto de tenant em todo payload de job e ser documentado aqui antes do uso.

## Uso Local

A partir da raiz do repositorio:

```bash
cp .env.example .env
docker compose config
docker compose up --build
docker compose ps
docker compose logs -f
```

Para iniciar apenas dependencias durante execucao manual local da API/Web:

```bash
docker compose up -d mysql redis
```

Para a UI opcional de banco:

```bash
docker compose --profile devtools up -d adminer
```

Endpoints padrao:

- API: `http://localhost:3333/api/v1`.
- Web: `http://localhost:3000`.
- MySQL dentro da rede Docker: `mysql:3306`.
- MySQL a partir de ferramentas do host, como DBeaver: `localhost:3307`.
- Redis dentro da rede Docker: `redis:6379`.
- Redis a partir de ferramentas do host: `localhost:6379`.
- Adminer com profile `devtools`: `http://localhost:8080`.

Parar servicos locais:

```bash
docker compose down
```

Parar e remover volumes locais somente quando os dados locais puderem ser descartados:

```bash
docker compose down -v
```

## Variaveis De Ambiente

A configuracao Docker local deve ler um arquivo de ambiente exclusivo de desenvolvimento. Nao commite segredos reais.

Use `.env.example` como base para `.env`.

Variaveis obrigatorias ou importantes da API:

- `DATABASE_URL`: para containers, use `mysql://logistics:logistics_password@mysql:3306/logistics_saas`.
- `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`: valores de bootstrap do MySQL local.
- `REDIS_HOST=redis`, `REDIS_PORT=6379`, ou `REDIS_URL` ao usar endpoint Redis gerenciado.
- `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`: pelo menos 32 caracteres e nunca segredos de producao em arquivos locais.
- `COOKIE_DOMAIN`, `CORS_ORIGINS`, `API_PUBLIC_URL`, `WEB_PUBLIC_URL`: devem corresponder aos hosts locais da Web/API.
- `IMPORT_STORAGE_DIR`, `IMAGE_STORAGE_DIR`, `IMPORT_MAX_FILE_SIZE_BYTES`, `IMPORT_MAX_ROWS`: controles de upload e importacao.
- `ALLOW_DEMO_SEED`: mantenha `false`, exceto quando a seed demo for intencionalmente executada.

Variaveis do frontend:

- `NEXT_PUBLIC_API_URL`: default `http://localhost:3333/api/v1`.
- `NEXT_PUBLIC_APP_URL`: default `http://localhost:3000`.
- `NEXT_PUBLIC_API_TIMEOUT_MS`: timeout de requisicao do cliente.

Variaveis de ajuste de memoria consumidas pelo Compose:

- `MYSQL_MEM_LIMIT`
- `REDIS_MEM_LIMIT`
- `API_MEM_LIMIT`
- `WEB_MEM_LIMIT`
- `API_NODE_OPTIONS`
- `WEB_NODE_OPTIONS`

Nao coloque `DATABASE_URL`, credenciais Redis, segredos JWT, segredos OAuth ou credenciais MySQL em ambientes de hospedagem do frontend.

## Migrations E Seed

Para desenvolvimento local com Node instalado no host:

```bash
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

Para execucao Docker-first, rode estes comandos a partir de um container da API depois que os servicos estiverem saudaveis:

```bash
docker compose run --rm api pnpm --filter @logistics/api db:generate
docker compose run --rm api pnpm --filter @logistics/api db:deploy
docker compose run --rm api pnpm --filter @logistics/api db:seed
```

O servico local `api` tambem roda `db:deploy` e a seed demo antes de iniciar o processo NestJS. Isso faz o ambiente Docker padrao incluir todos os usuarios demo, incluindo `administrador@dev.com`, `admin.test@dev.com`, `manager.test@dev.com` e `operator.test@dev.com`.

Ambientes semelhantes a producao devem usar `db:deploy`, nao `db:migrate`. A seed demo e bloqueada em `NODE_ENV=production`, exceto quando `ALLOW_DEMO_SEED=true`.

Se a maquina host estiver presa em uma versao antiga do Node 18, prefira Docker porque os dois Dockerfiles da aplicacao usam `node:20-alpine`. Prisma 6.19.x exige Node `>=18.18`.

## Validacao Multi-Tenant

Dados Docker locais devem incluir multiplos tenants. Depois da inicializacao, valide que:

- Requisicoes da API sao resolvidas para o tenant esperado.
- Registros do banco sao escopados por tenant.
- Chaves de cache nao colidem entre tenants.
- Workers incluem tenant ID em todo payload de job.
- Imports criados por um `OPERATOR` nao sao visiveis para outro operador.
- Contas `ADMIN`, `MANAGER` e `OPERATOR` exercitam a matriz de acesso em `docs/security/access-control-matrix.md`.

A seed demo cria multiplos tenants e roles de usuario. SQL de contas de teste e comandos manuais de fallback para TiDB estao documentados em `docs/development/access-test-accounts.md`.

## Orientacao De Imagem

Dockerfiles da aplicacao estao presentes. Continue preservando estas expectativas:

- Instalacao de dependencias baseada em lockfile.
- Builds multi-stage.
- Usuario de runtime nao root.
- Portas expostas explicitamente.
- Comando de healthcheck.
- Imagem minima de runtime.

Papeis atuais dos servicos:

- `api`: API NestJS na porta `3333`.
- `web`: app Next.js na porta `3000`.
- `mysql`: banco MySQL local.
- `redis`: cache, backend BullMQ e suporte de coordenacao realtime.
- `adminer`: UI local opcional de banco.
- `worker`: consumidor futuro dedicado de jobs assincronos, ainda nao declarado no Compose.

## Health E Logs

Healthchecks do Compose:

- `mysql`: `mysqladmin ping`.
- `redis`: `redis-cli ping`.
- `api`: verificacao HTTP contra `/api/v1/health/live`.
- `web`: verificacao HTTP contra `/`.

Comandos uteis de log:

```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f mysql
docker compose logs -f redis
```

Use `docker compose ps` para confirmar o status de saude antes de depurar a camada da aplicacao.

## Troubleshooting

Prisma ou instalacao falha no host:

- Use Docker com Node 20.
- Ou atualize o Node do host para `>=18.18`; Node 20 e recomendado.

API nao conecta ao banco:

- Dentro dos containers, `DATABASE_URL` deve apontar para `mysql:3306`.
- A partir de ferramentas do host, use `localhost:3307`.
- Confirme que `docker compose ps mysql` esta saudavel.

API nao conecta ao Redis:

- Dentro dos containers, use `REDIS_HOST=redis` e `REDIS_PORT=6379`.
- A partir de ferramentas do host, use `localhost:6379`.
- Confirme `docker compose logs -f redis`.

Web nao consegue chamar a API:

- Confirme que `NEXT_PUBLIC_API_URL` foi fornecido no build.
- Confirme que `CORS_ORIGINS` inclui `http://localhost:3000`.
- Rebuild `web` depois de alterar variaveis publicas do frontend.

Build falha em `web` ou `api`:

- Reexecute o comando filtrado que falhou fora do Docker quando possivel para obter logs menores.
- Verifique mudancas em `pnpm-lock.yaml` e compatibilidade Node/Prisma.
- Nao contorne erros de build TypeScript ou Next.js nos Dockerfiles.

## Integracao Com CI

O workflow de CI deve validar a sintaxe Docker Compose quando arquivos Compose estiverem presentes na raiz do repositorio:

```bash
docker compose config
```

Proximas verificacoes recomendadas:

- Construir imagens `api` e `web` a partir de um checkout limpo.
- Rodar scan de vulnerabilidades nas imagens construidas.
- Rodar migrations contra um banco efemero compativel com MySQL.
- Validar healthchecks apos `docker compose up --build`.
