# Auditoria Da Implementacao Atual

Status: `IN_DESIGN`

Esta auditoria se baseia na inspecao do repositorio e nas revisoes especializadas concluidas na etapa de planejamento. Ela diferencia comportamento implementado de scaffolding e documentacao.

## Legenda De Status

- `IMPLEMENTED`: comportamento executavel existe e foi validado ou esta diretamente evidente no codigo.
- `PARTIALLY_IMPLEMENTED`: existe base util, mas seguranca, fluxo de dados ou comportamento de negocio esta incompleto.
- `SCAFFOLDED`: modulo, pasta ou shell existe sem casos de uso funcionais.
- `DOCUMENTED_ONLY`: descrito em docs ou skills, nao implementado.
- `NOT_IMPLEMENTED`: nenhum artefato significativo encontrado.
- `NEEDS_REVIEW`: existe, mas possui preocupacao de design ou seguranca antes de evoluir funcionalidade.
- `BLOCKED_BY_EXTERNAL_CONFIGURATION`: depende de Docker local, segredos, dependencias de browser ou estado de ambiente.

## Matriz

| Area | Item | Status | Arquivos | Comportamento | Teste | Risco | Acao |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Backend | Bootstrap NestJS | `IMPLEMENTED` | `apps/api/src/main.ts`, `apps/api/src/app.module.ts` | API inicia, prefixo global `/api/v1`, validacao, CORS, Swagger em nao producao | build/typecheck passaram anteriormente | Caminho do Swagger e exposicao em producao precisam de politica | Manter, documentar politica de rotas |
| Backend | Endpoints de health | `IMPLEMENTED` | `apps/api/src/modules/health/*` | `GET /api/v1/health`, `/live`, `/ready`; readiness checa MySQL e Redis | API e2e health existe | Readiness publica pode revelar dependencias se exposta amplamente | Manter liveness publica, restringir readiness por ambiente se necessario |
| Backend | Modulos de negocio | `SCAFFOLDED` | `apps/api/src/modules/{auth,users,customers,carriers,...}` | Apenas classes de modulo, sem controllers/use cases/repositories | nenhum | Falsa percepcao de completude funcional | Especificar cada modulo antes da implementacao |
| Backend | Fluxo controller-use case-repository | `DOCUMENTED_ONLY` | `docs/architecture/backend.md` | Ainda nao existe use case ou repository de negocio | nenhum | Uso direto futuro de Prisma em controllers | Aplicar no primeiro modulo funcional |
| Backend | Validacao de configuracao | `IMPLEMENTED` | `apps/api/src/config/environment.ts` | Zod valida variaveis obrigatorias de runtime | `environment.spec.ts` | Segredos sao placeholders nos exemplos | Manter validacao estrita |
| Backend | Contrato de erro | `PARTIALLY_IMPLEMENTED` | `apps/api/src/common/filters/http-exception.filter.ts`, `packages/shared/src/index.ts` | Erros estruturados com requestId/timestamp/path | spec do filter existe | `ApplicationError.details` precisa de politica de allowlist publica | Adicionar classificacao de detalhes de erro antes dos CRUDs |
| Backend | Request ID e correlation ID | `IMPLEMENTED` | `request-context.middleware.ts`, `request-logging.interceptor.ts` | Gera ou propaga IDs | spec do middleware existe | Contexto tambem aceita headers spoofaveis de tenant/user | Separar contexto tecnico de requisicao do contexto auth |
| Security | Guard private-by-default | `PARTIALLY_IMPLEMENTED` | `private-by-default.guard.ts`, `public.decorator.ts` | Nega rotas nao publicas sem contexto | apenas testes indiretos | Contexto vem de headers arbitrarios | Substituir por auth guard real antes de endpoints privados |
| Security | RBAC | `PARTIALLY_IMPLEMENTED` | `roles.guard.ts`, `roles.decorator.ts`, `packages/shared/src/index.ts` | Decorator/guard de role existe | nenhum | Role pode ser falsificada por header | Derivar role de sessao/token verificado |
| Security | Autenticacao | `SCAFFOLDED` | `apps/api/src/modules/auth/auth.module.ts`, docs/security | Sem login, JWT, OAuth, MFA ou fluxo de refresh | nenhum | Ainda nao protege rotas de negocio | Implementar primeiro modulo funcional |
| Security | Isolamento de tenant em runtime | `NEEDS_REVIEW` | `schema.prisma`, `request-context.middleware.ts` | Colunas de tenant existem; sem enforcement em repositorio | nenhum | Vazamentos cross-tenant provaveis se queries usarem apenas id | Adicionar regras/testes de repositorio tenant-scoped |
| Security | Salas WebSocket por tenant | `NEEDS_REVIEW` | `notifications.gateway.ts` | Cliente pode entrar em `tenant:{tenantId}` pelo payload | nenhum | Risco critico de assinatura de sala cross-tenant | Handshake autenticado e tenant derivado pelo servidor |
| Data | Schema Prisma | `PARTIALLY_IMPLEMENTED` | `apps/api/prisma/schema.prisma` | Entidades de fundacao existem | generate/build passou | Faltam shipment, opcoes, tracking, servicos e tabelas de frete | Evoluir somente com migrations aprovadas |
| Data | Migrations e seed | `PARTIALLY_IMPLEMENTED` | `apps/api/prisma/migrations`, `seed.ts` | Migration inicial e seed local existem | generate validado | Fluxo de migration de producao nao definido | Adicionar workflow de `migrate deploy` depois |
| Frontend | Landing page | `PARTIALLY_IMPLEMENTED` | `apps/web/src/app/(public)/page.tsx` | Landing estatica de produto | teste de render | Metricas ilustrativas podem parecer claims | Marcar/remover claims antes de lancamento publico |
| Frontend | Pagina de login | `PARTIALLY_IMPLEMENTED` | `apps/web/src/app/(auth)/login/page.tsx`, `login-form.tsx` | Formulario visual com validacao Zod/RHF; submit no-op | teste de login | Sem auth/session/MFA/erros | Conectar depois do modulo auth |
| Frontend | Dashboard | `SCAFFOLDED` | `apps/web/src/app/(dashboard)/dashboard/page.tsx` | Placeholder estatico com estado vazio | teste de render | Rota publica, sem dados | Proteger rota apos auth |
| Frontend | App shell | `PARTIALLY_IMPLEMENTED` | `app-shell.tsx` | Sidebar/topbar visual | teste de acessibilidade | Todos os links nav apontam para `/dashboard`; tenant nao visivel | Especificar IA e contexto de tenant |
| Frontend | HTTP client | `PARTIALLY_IMPLEMENTED` | `apps/web/src/services/http-client.ts` | Fetch centralizado com credentials e erros estruturados | teste de http-client | Faltam comportamento para 204/non-JSON/session refresh | Estender com contrato auth |
| Infrastructure | Docker Compose | `IMPLEMENTED` | `docker-compose.yml` | API, web, MySQL, Redis, perfil Adminer | `docker compose config` e startup local passaram anteriormente | Portas locais de DB/Redis expostas | Manter dev-only; restringir producao |
| Infrastructure | Dockerfiles | `PARTIALLY_IMPLEMENTED` | `apps/api/Dockerfile`, `apps/web/Dockerfile` | Multi-stage, non-root, frozen lockfile | `docker compose build` passou | Runtime copia `/app` amplamente | Otimizar layout da imagem depois |
| Infrastructure | BullMQ | `SCAFFOLDED` | `queue.module.ts`, imports module | Fila registrada com retry/backoff | nenhum | Sem worker, DLQ ou envelope de idempotencia | Adicionar servico worker com modulo de importacao |
| Infrastructure | Redis | `PARTIALLY_IMPLEMENTED` | `redis.service.ts`, compose | Servico client e health ping existem | spec do servico | Sem auth no compose local; sem plano de producao | Redis gerenciado com TLS/auth para deploy |
| Observability | Logs estruturados | `PARTIALLY_IMPLEMENTED` | `observability.module.ts`, logging interceptor | Logs Pino e redaction | comportamento basico coberto indiretamente | Sem metricas/traces/alertas | Adicionar OpenTelemetry/metricas apos alvo de deploy |
| Tests | Unit/integration | `PARTIALLY_IMPLEMENTED` | `apps/api/src/**/*.spec.ts`, `apps/web/tests` | Testes de fundacao existem | `pnpm test` passou anteriormente | Sem testes de tenant, auth, transacao e jobs | Adicionar por modulo |
| Tests | E2E | `PARTIALLY_IMPLEMENTED` | `apps/api/test`, `apps/web/tests/e2e` | API health e2e existe; smoke web planejado | API e2e passou; Playwright pode exigir deps nativas | Dependencias de browser sensiveis ao ambiente | Documentar setup e manter CI estavel |
| Documentation | Docs/ADRs/skills/workflows | `PARTIALLY_IMPLEMENTED` | `docs`, `.cloud` | Docs amplos de fundacao existem | apenas auditoria estatica | Alguns docs descrevem estado alvo, nao estado real | Manter auditoria atualizada |

## Contradicoes Verificadas

- Docs de banco e isolamento de tenant foram revisados para alinhar com MySQL: usar `JSON`, nao JSONB, e nao depender de Row Level Security no estilo PostgreSQL.
- Docs de seguranca dizem corretamente que tenant nao deve vir de headers arbitrarios, mas o `RequestContextMiddleware` atual le headers de tenant/user/role. Isso e aceitavel somente como placeholder de fundacao e deve ser substituido antes de rotas privadas de negocio.
- Docs realtime dizem que autorizacao e futura; portanto, o gateway atual nao e seguro para salas de tenant em producao.

## Conclusao

A fundacao e real e buildavel, mas o produto nao esta funcionalmente implementado. O proximo passo deve ser um modulo aprovado de Identidade e Acesso, porque todos os outros modulos dependem de contexto confiavel de usuario, tenant, role, sessao e auditoria.
