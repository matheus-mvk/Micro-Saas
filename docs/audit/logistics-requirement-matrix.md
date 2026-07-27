# Matriz De Requisitos Logisticos

Data: 2026-07-25

Valores de classificacao: `IMPLEMENTED_AND_VERIFIED`, `IMPLEMENTED_WITHOUT_TESTS`, `PARTIALLY_IMPLEMENTED`, `SCAFFOLDED`, `VISUAL_ONLY`, `DOCUMENTED_ONLY`, `NOT_IMPLEMENTED`, `BROKEN`, `NEEDS_REVIEW`, `BLOCKED_BY_EXTERNAL_CONFIGURATION`.

| Requisito | Modulo | Backend | Frontend | Database | Testes | Seguranca/Tenant | Status | Evidencia | Trabalho obrigatorio |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API Node.js/NestJS/TypeScript | Fundacao | App inicia conceitualmente; controllers de health/auth/dashboard | N/A | Prisma configurado | Alguns testes unitarios, inicializacao de testes quebrada | Guards/filter/middleware existem | PARTIALLY_IMPLEMENTED | `apps/api/src/app.module.ts` | Corrigir test runner e adicionar modulos de dominio. |
| Frontend Next.js | Fundacao | N/A | 3 rotas reais | N/A | Testes basicos, inicializacao quebrada | Usa credentials include | PARTIALLY_IMPLEMENTED | `apps/web/src/app` | Adicionar paginas admin e e2e. |
| Prisma/MySQL | Database | PrismaService e schema | N/A | 9 tabelas | Sem testes de integracao DB | TenantId existe em alguns modelos | PARTIALLY_IMPLEMENTED | `schema.prisma` | Adicionar schema logistico completo, constraints e indices. |
| Docker Compose | Infraestrutura | Servico API | Servico Web | Servicos MySQL/Redis | `docker compose config` passou | Defaults dev expostos | PARTIALLY_IMPLEMENTED | `docker-compose.yml` | Docs/hardening de producao e servico worker. |
| Redis | Infraestrutura | RedisService e health ping | N/A | N/A | Unit de Redis existe, mas testes falham na inicializacao | Helper de chave por tenant existe | PARTIALLY_IMPLEMENTED | `redis.service.ts` | Usar em cache/jobs/rate-limit com testes. |
| BullMQ | Async | Fila registrada | N/A | N/A | Nenhum | Sem enforcement de tenant no payload | SCAFFOLDED | `queue.module.ts` | Adicionar processors/workers e APIs de job. |
| Socket.IO | Realtime | Gateway existe, mas entrada de tenant e insegura | Sem fluxo client | N/A | Nenhum | Cliente pode escolher tenant | BROKEN | `notifications.gateway.ts` | Handshake auth e salas tenant-scoped. |
| Landing page | Web publica | N/A | Existe com conteudo comercial estatico | N/A | Testes basicos de landing falham na inicializacao | Publica | PARTIALLY_IMPLEMENTED | pagina `/` | Completar secoes exigidas, SEO e ajustes a11y. |
| Login local | Auth | Endpoint real de login | Form real de login | Users/refresh/audit | Sem integration/e2e de auth | Protecoes basicas e auditoria | PARTIALLY_IMPLEMENTED | `/auth/login` | Adicionar CSRF, e2e, ciclo de sessao e checagem de refresh de usuario inativo. |
| OAuth Google | Auth | Nenhum | Nenhum | Sem tabela de identidade | Nenhum | N/A | NOT_IMPLEMENTED | Apenas env vars | Fluxo completo de provider, state, callback, linking e auditoria. |
| OAuth GitHub | Auth | Nenhum | Nenhum | Sem tabela de identidade | Nenhum | N/A | NOT_IMPLEMENTED | Apenas env vars | Fluxo completo de provider incluindo API de e-mail verificado. |
| MFA/TOTP | Auth | Nenhum | Nenhum | Sem tabelas de secret/recovery | Nenhum | N/A | NOT_IMPLEMENTED | Apenas `TOTP_ISSUER` | Enrollment, desafio, recovery codes e auditoria. |
| Recuperacao de senha | Auth | Nenhum | Nenhum | Sem tabela de reset token | Nenhum | N/A | NOT_IMPLEMENTED | Sem rotas | Fluxo seguro de token e adapter de e-mail/dev. |
| Sessoes | Auth | Refresh tokens persistem | Sem pagina de sessoes | `refresh_tokens` | Sem testes de integracao | Revogacao parcial | PARTIALLY_IMPLEMENTED | `/auth/refresh`, `/auth/logout` | Listar/revogar sessoes, logout global e testes de reuso. |
| RBAC | Seguranca | Apenas guard/decorator | Itens de menu desabilitados | Role enum | Apenas teste de guard | Sem matriz | SCAFFOLDED | `roles.guard.ts` | Matriz de permissao backend e testes. |
| Tenants | Multi-tenancy | Apenas contexto auth e seed | Sem UI de tenant | `tenants` | Sem testes cross-tenant | Parcial | PARTIALLY_IMPLEMENTED | modelo `Tenant` | Servico/configuracoes de tenant e testes de isolamento. |
| Filiais | Organizacao | Modulo vazio | Sem UI | `branches` | Nenhum | TenantId na tabela | SCAFFOLDED | `BranchesModule` | CRUD, endereco/contato/filial principal e filtros. |
| Usuarios | Admin | Modulo vazio | Sem UI | `users` | Sem testes CRUD | Sem enforcement de matriz | SCAFFOLDED | `UsersModule` | Gestao completa de usuarios e auditoria. |
| Clientes | Cadastro logistico | Modulo vazio | Sem UI | `customers` | Nenhum | TenantId e document unico | SCAFFOLDED | `CustomersModule` | CRUD, enderecos e validacao de documento. |
| Enderecos | Cadastro logistico | Nenhum | Nenhum | Nenhum | Nenhum | N/A | NOT_IMPLEMENTED | Sem modelo | Servico de endereco, integracao CEP e snapshots. |
| Transportadoras | Cadastro logistico | Modulo vazio | Sem UI | `carriers` | Nenhum | TenantId e document/code unicos | SCAFFOLDED | `CarriersModule` | CRUD e links de performance. |
| Servicos de transportadora | Cadastro logistico | Nenhum | Nenhum | Nenhum | Nenhum | N/A | NOT_IMPLEMENTED | Sem modelo | Modelo/API/UI de servico. |
| Cobertura | Regras logisticas | Nenhum | Nenhum | Nenhum | Nenhum | N/A | NOT_IMPLEMENTED | Sem modelo | Regras de cobertura e testes de elegibilidade. |
| Tabelas de frete | Precificacao | Nenhum | Nenhum | Nenhum | Nenhum | N/A | DOCUMENTED_ONLY | Docs de precificacao | Tabelas/faixas/taxas versionadas. |
| Motor de precificacao | Precificacao | Nenhum | Nenhum | Nenhum | Nenhum | N/A | NOT_IMPLEMENTED | Sem servico | Motor deterministico e testes. |
| Jornada de simulacao | Frete | Sem endpoint | Sem pagina | Uma tabela simples | Nenhum | TenantId existe | PARTIALLY_IMPLEMENTED | `freight_simulations` | Criacao/calculo/resultados/historico completos. |
| Historico de simulacao | Frete | Nenhum | Nenhum | Mesma tabela simples | Nenhum | N/A | NOT_IMPLEMENTED | Sem endpoint/pagina | Filtros de listagem/detalhe e opcoes. |
| Shipments | Operacoes | Nenhum | Nenhum | Nenhum | Nenhum | N/A | NOT_IMPLEMENTED | Sem modelo | Modelo/API/UI de shipment. |
| Tracking | Operacoes | Nenhum | Nenhum | Nenhum | Nenhum | N/A | DOCUMENTED_ONLY | Docs de tracking | Timeline imutavel/maquina de status. |
| Upload import | Importacoes | Sem endpoint/worker | Sem pagina | Apenas `import_jobs` | Nenhum | TenantId parcial | SCAFFOLDED | `ImportsModule` | Upload CSV/XLSX, worker, erros e realtime. |
| Dashboard | Inteligencia | Endpoint summary | Cards summary | Conta tabelas reais | Sem testes de dashboard | Filtro de tenant | IMPLEMENTED_WITHOUT_TESTS | `/dashboard/summary` | KPIs completos, filtros, graficos e testes. |
| Insights | Inteligencia | Modulo vazio | Sem UI | Nenhum | Nenhum | N/A | NOT_IMPLEMENTED | `InsightsModule` | Modelo/gerador/UI de insight deterministico. |
| Auditoria | Governanca | Apenas service de escrita | Sem UI | `audit_logs` | Nenhum | Campos de tenant parciais | PARTIALLY_IMPLEMENTED | `AuditService` | API/UI de consulta, cobertura de eventos e before/after. |
| Observabilidade | Operacoes | Health/logging existem | N/A | N/A | Health e2e existe, mas nao executado | Logs parcialmente sanitizados | PARTIALLY_IMPLEMENTED | `health.controller.ts` | Metricas e health de fila/worker/integracao. |
| Dados demo | Demo | Seed existe | Dashboard pode mostrar dados minimos | Dados minimos | Sem testes de seed | Dois tenants criados | PARTIALLY_IMPLEMENTED | `seed.ts` | Dataset coerente completo e testes de idempotencia. |
| Testes automatizados | Qualidade | Varias specs unitarias | Varias specs UI | Sem testes DB | Inicializacao do Vitest falha com `npx pnpm`; sandbox mais restrita tambem bloqueia escritas de cache do Vitest | Sem cobertura cross-tenant/e2e | BROKEN | Saida de comando de teste e sandbox QA | Corrigir estrategia runtime/cache e adicionar cobertura obrigatoria. |

## Resultado Final Dos Requisitos

Nenhum requisito deve ser marcado como `IMPLEMENTED_AND_VERIFIED` a partir desta auditoria porque o test runner falhou para testes existentes, `prisma validate` ficou inconclusivo na execucao principal e os fluxos centrais de dominio estao incompletos. A superficie implementada mais avancada e auth local com resumo de dashboard, mas mesmo esses itens precisam de cobertura integration/e2e/security antes da conclusao final.
