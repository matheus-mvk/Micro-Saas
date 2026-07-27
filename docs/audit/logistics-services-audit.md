# Auditoria Dos Servicos Logisticos

Data: 2026-07-25

Escopo: auditoria funcional read-only da plataforma logistics SaaS. Nenhum arquivo funcional de codigo, schema, migration, seed ou infraestrutura foi alterado nesta execucao.

## Resumo Executivo

O repositorio e uma fundacao tecnica utilizavel, nao uma plataforma completa de inteligencia logistica. Ele contem:

- Fundacao de API NestJS com guard global private-by-default, contexto de requisicao, erros estruturados, health checks, servico Redis, registro de fila BullMQ, gateway Socket.IO, autenticacao local, escritas de auditoria para eventos de auth e endpoint basico de resumo do dashboard.
- Frontend Next.js com landing page publica, pagina de login, layout autenticado, shell administrativo e resumo de dashboard conectado a endpoint backend real.
- Schema Prisma/MySQL com 9 tabelas: `tenants`, `branches`, `users`, `refresh_tokens`, `customers`, `carriers`, `freight_simulations`, `import_jobs`, `audit_logs`.
- Seed para admin demo, dois tenants, usuarios, um cliente, uma transportadora, uma simulacao de frete, um import job e um audit log.

Os servicos logisticos centrais exigidos pelo desafio estao ausentes ou apenas estruturados: servicos de transportadora, cobertura, tabelas de frete, faixas de peso, motor deterministico de precificacao, opcoes de simulacao, detalhe de historico, shipments, tracking, processamento de upload/importacao, workers, fluxo realtime seguro, insights, UI de auditoria, CRUDs de usuarios/clientes/transportadoras, OAuth, MFA, recuperacao de senha e testes cross-tenant.

## Linha De Base De Evidencias

Rotas frontend encontradas:

- `/`: `apps/web/src/app/(public)/page.tsx`
- `/login`: `apps/web/src/app/(auth)/login/page.tsx`
- `/dashboard`: `apps/web/src/app/(dashboard)/dashboard/page.tsx`

Endpoints HTTP backend encontrados por busca estatica:

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/dashboard/summary`

Handlers realtime encontrados:

- namespace Socket.IO `/realtime`
- mensagem `tenant:join` em `apps/api/src/infrastructure/realtime/notifications.gateway.ts`

Comandos de validacao executados nesta auditoria:

- `npx pnpm --filter @logistics/api typecheck`: passou.
- `npx pnpm --filter @logistics/web typecheck`: passou.
- `npx pnpm --filter @logistics/api test`: falhou na inicializacao do Vitest com `SyntaxError: Unexpected token '*'`.
- `npx pnpm --filter @logistics/web test`: falhou na inicializacao do Vitest com `SyntaxError: Unexpected token '*'`.
- `docker compose config`: passou e imprimiu a configuracao efetiva de desenvolvimento.
- `npx pnpm --filter @logistics/api exec prisma validate`: iniciou, exibiu aviso do pacote Prisma, nao concluiu dentro das janelas observadas e foi interrompido com codigo 130.

Validacao por subagente de QA em sandbox read-only mais restrito tambem encontrou:

- `node -v`: `v18.19.1`.
- `pnpm -v`: falhou porque `pnpm` nao estava disponivel diretamente no PATH.
- `tsc` local ao pacote para API e web: passou.
- Vitest local ao pacote para API e web: falhou porque Vitest tentou escrever `node_modules/.vite/vitest/results.json` em sandbox read-only.
- `prisma validate` local ao pacote: falhou porque `DATABASE_URL` estava ausente nesse sandbox.
- `docker compose config`: falhou nesse sandbox porque Docker estava indisponivel.

## Classificacao Dos Servicos

| Servico | Status | Comportamento atual | Evidencia | Principais lacunas | Criterios de aceite |
| --- | --- | --- | --- | --- | --- |
| Tenants e empresas | PARTIALLY_IMPLEMENTED | Modelo `Tenant`, seed com dois tenants, contexto de auth deriva tenant de token/usuario. Sem CRUD ou configuracoes de tenant. | `schema.prisma`, `TenantsModule` vazio, `AuthContextService` | Sem servico de tenant, operacoes admin, configuracoes, ciclo de vida e testes cross-tenant. | CRUD/configuracoes de tenant, queries tenant-scoped, testes provando ausencia de vazamento em leitura/escrita/listagem/agregacao/realtime/importacao. |
| Filiais | SCAFFOLDED | Modelo `Branch`, seed cria filiais, usuario pode ter `branchId`. Sem endpoints. | `schema.prisma`, `BranchesModule` vazio | Sem CRUD de filial, endereco/contato/filial principal, filtros de dashboard/simulacao e permissoes por filial. | CRUD de filiais, isolamento de tenant, associacao de usuario, decisao de filial opcional/obrigatoria documentada e testada. |
| Autenticacao | PARTIALLY_IMPLEMENTED | Login local, hash de senha, access token, refresh token rotativo, cookies, logout, `/me`, auditoria e limitacao de tentativas de login. | `auth.controller.ts`, `auth.service.ts`, `auth-login-attempt.service.ts` | Sem OAuth Google/GitHub, MFA/TOTP, recuperacao de senha, UI/API de gestao de sessoes, CSRF e e2e completo. Refresh nao verifica status do usuario antes de emitir novos tokens. | Fluxos completos de identidade com testes, cookies seguros, CSRF, revogacao, lista/revogacao de sessoes, recuperacao, OAuth, MFA e auditoria. |
| Usuarios e RBAC | SCAFFOLDED | Modelo `User` e roles existem. `RolesGuard` existe, mas nenhum endpoint de negocio usa matriz de permissoes. | `users.module.ts` vazio, `roles.guard.ts` | Sem CRUD/convite/status/perfil/redefinicao MFA/sessoes de usuario, sem enforcement de matriz. | Gestao admin de usuarios, matriz RBAC no backend, regra de ultimo admin, revogacao de sessao, auditoria e testes por role. |
| Clientes | SCAFFOLDED | Modelo `Customer` e cliente demo na seed. Sem API ou UI. | `customers.module.ts` vazio, modelo `Customer` | Ausentes tipo de pessoa, razao social, validacao CPF/CNPJ, enderecos, CRUD, filtros, paginacao e referencias historicas. | CRUD completo de clientes com enderecos, unicidade de documento por tenant, paginacao server-side, auditoria e testes. |
| Enderecos | NOT_IMPLEMENTED | Sem modelo ou servico de endereco. | Nenhum modelo `Address` encontrado | Sem multiplos enderecos, consulta de CEP, snapshots, geocoding e historico de endereco de cliente/shipment. | Modelo/servico de endereco, integracao ViaCEP/BrasilAPI, snapshots para simulacoes/shipments e testes. |
| Transportadoras | SCAFFOLDED | Modelo `Carrier` e transportadora demo na seed. Sem API ou UI. | `carriers.module.ts` vazio, modelo `Carrier` | Ausentes CRUD de transportadora, workflow de status, lista de servicos, performance e segredos de integracao. | CRUD completo de transportadoras, unicidade de CNPJ por tenant, auditoria, referencias preservando historico e testes. |
| Servicos/modalidades de transportadora | NOT_IMPLEMENTED | Sem modelo, endpoint, UI, seed ou testes. | Nenhum modelo `CarrierService` | Sem codigo/nome/modal/fator/pesos/status/cobertura/associacao com precificacao. | Modelo, CRUD, codigo unico por transportadora, filtro de ativos em simulacoes e testes. |
| Cobertura | NOT_IMPLEMENTED | Sem modelo ou logica deterministica de elegibilidade. | Sem tabelas de cobertura | Sem zonas de origem/destino, ranges postais, regioes, excecoes e teste de rota. | Modelo de cobertura, validacao de sobreposicao, elegibilidade deterministica de servico, motivos de indisponibilidade e testes. |
| Tabelas de frete | DOCUMENTED_ONLY | Docs de arquitetura mencionam precificacao, mas nao ha schema ou API. | `docs/architecture/freight-pricing.md` | Sem tabelas/versionamento/vigencia/regras/taxas/faixas. | Tabelas versionadas, restricoes, auditoria, logica de data valida e snapshots historicos. |
| Faixas de peso e precos | NOT_IMPLEMENTED | Sem modelo ou caso de uso de calculo. | Nenhum modelo `FreightRateBand` | Sem validacao de peso min/max, protecao contra sobreposicao e regras de arredondamento decimal. | Modelo de faixa Decimal-safe, checagens de sobreposicao e testes de precificacao nos limites. |
| Motor de precificacao | NOT_IMPLEMENTED | Sem servico deterministico de dominio. Seed atual armazena valores estimados diretamente. | Sem arquivos de servico de precificacao | Sem cubagem, peso taxavel, breakdown de taxas, reprodutibilidade e testes unitarios. | Motor puro deterministico, precisao decimal, breakdown explicavel e testes unitarios. |
| Simulacao de frete | PARTIALLY_IMPLEMENTED | Modelo `FreightSimulation` existe e seed cria uma linha calculada. Sem endpoint ou jornada frontend. | Modelo `FreightSimulation`, seed | Sem create/list/detail/calculate, multi-volume, opcoes, regras de precificacao, selecao e UI de historico. | Fluxo de simulacao de ponta a ponta com entrada/opcoes/versoes de regra persistidas e testes. |
| Historico de simulacao | NOT_IMPLEMENTED | Sem endpoints de listagem/detalhe ou pagina. | Sem controller/page | Sem filtros, paginacao, detalhes de opcao, opcao selecionada e relacao com shipment. | Listagem/detalhe tenant-scoped de historico, filtros, paginacao server-side e testes. |
| Selecao de opcao | NOT_IMPLEMENTED | Sem modelo de opcao de simulacao. | Nenhum modelo `FreightSimulationOption` | Nao e possivel selecionar opcao, auditar selecao ou criar shipment a partir dela. | Transacao com uma unica opcao selecionada, auditoria, protecao cross-tenant e testes. |
| Shipments | DOCUMENTED_ONLY | Docs de arquitetura mencionam shipments. Sem modelo/codigo. | `docs/architecture/recommended-domain-model.md` | Sem entidade operacional de shipment, snapshots, volumes, status e fluxos de criacao. | Modelo/API/UI de shipment, criacao por simulacao/manual/importacao, snapshots, auditoria e testes. |
| Tracking | DOCUMENTED_ONLY | Threat model/docs existem, mas sem tabelas/API/UI. | `docs/architecture/tracking.md` | Sem eventos imutaveis, maquina de status, idempotencia, timeline e atualizacoes realtime. | Maquina de status, eventos de tracking imutaveis, transacao com status do shipment, realtime e testes. |
| Upload/importacao | SCAFFOLDED | Modelo `ImportJob` e registro de fila BullMQ existem. Sem endpoint de upload/worker. | `imports.module.ts`, `queue.module.ts`, modelo `ImportJob` | Sem parser CSV/XLSX, validacao, armazenamento, preview, linhas, erros, worker, relatorio e idempotencia. | Ao menos um fluxo completo de importacao com worker, progresso, relatorio de erros, isolamento de tenant e testes. |
| Processamento async | PARTIALLY_IMPLEMENTED | BullMQ root e fila `imports` configurados com retry/backoff. | `QueueModule` | Sem processor, processo worker, health, metricas e validacao de payload de job. | Worker real, saude de fila, retries, idempotencia, tenant/correlation ID e testes. |
| Realtime | BROKEN | Socket entra na sala do tenant a partir de `tenantId` enviado pelo cliente sem auth. | `notifications.gateway.ts` | Risco de vazamento de eventos entre tenants; sem client realtime no frontend. | Handshake autenticado, tenant derivado pelo servidor, salas autorizadas, fallback por polling e testes. |
| Dashboard | PARTIALLY_IMPLEMENTED | `/dashboard/summary` real conta registros basicos tenant-scoped. Frontend consome. | `dashboard.service.ts`, `dashboard-summary.tsx` | Faltam KPIs exigidos, filtros, graficos, shipments, atraso/sucesso, qualidade de importacao e testes. | KPIs e graficos completos do DB, filtros, queries otimizadas e testes. |
| Insights | NOT_IMPLEMENTED | Modulo vazio, sem schema. | `insights.module.ts` | Sem geracao deterministica, armazenamento e estado read/dismiss. | Modelo/gerador/UI de insight, evidencias/limites e testes. |
| Auditoria | PARTIALLY_IMPLEMENTED | Servico de auditoria escreve eventos de auth/seed. Sem endpoints/UI de auditoria. | `audit.service.ts`, modelo `AuditLog` | Sem consulta/filtro/detalhe, before/after, cobertura ampla de eventos e testes. | Auditar todas as acoes relevantes, payloads sanitizados, UI/API de consulta e testes. |
| Observabilidade | PARTIALLY_IMPLEMENTED | Pino, request ID, exception filter, liveness/readiness para MySQL/Redis. | `main.ts`, `health.controller.ts` | Sem endpoint de metricas, health de worker/fila, metricas de integracao e visibilidade de query lenta. | Logs, health, checagens de fila/worker, metricas e erros seguros. |
| Landing page | PARTIALLY_IMPLEMENTED | Pagina publica profissional com preview estatico e CTA. | `apps/web/src/app/(public)/page.tsx` | Faltam varias secoes exigidas, anchor nav, menu responsivo, profundidade SEO/OpenGraph e disclaimers de numeros demo. | Landing comercial completa com secoes exigidas, testes de acessibilidade/performance/SEO. |
| UI Admin | PARTIALLY_IMPLEMENTED | Login, layout autenticado, dashboard e shell existem. Outros itens de menu desabilitados. | `app-shell.tsx`, arquivos de dashboard | Sem paginas de users/customers/carriers/freight/imports/insights/audit/settings. | Todas as paginas administrativas integradas ao backend e DB, estados completos e testes. |
| Dados demo | PARTIALLY_IMPLEMENTED | Admin demo e seed minima. | `prisma/seed.ts` | Falta a maior parte do dataset operacional exigido: servicos, cobertura, tabelas, opcoes, shipments, tracking, insights e erros de importacao. | Dataset coerente de dois tenants cobrindo toda tela e workflow, idempotente e testado. |
| Testes | BROKEN | Arquivos unit/test existem, mas inicializacao do Vitest falha no ambiente atual. Cobertura estreita. | `*.spec.ts`, `apps/web/tests/*` | Sem testes de dominio para logistica, tenant, RBAC e fluxos e2e; test runner falhando. | Corrigir ambiente de teste, adicionar cobertura unit/integration/e2e para todos os fluxos principais. |

## Riscos Criticos

1. Realtime inseguro: um cliente pode solicitar `tenant:join` com qualquer `tenantId`.
2. Dominio logistico exigido esta majoritariamente ausente: sem servicos de transportadora, cobertura, tabelas de frete, motor de precificacao, opcoes de simulacao, shipments, tracking ou insights.
3. Auth esta incompleto para o desafio: faltam OAuth, MFA, recuperacao de senha e UI/API de sessoes.
4. Mutations autenticadas por cookies nao possuem protecao CSRF dedicada.
5. Dashboard e real, mas estreito demais e sem teste backend.
6. Login demo pode falhar em banco onde a migration inicial tenha falhado anteriormente, porque tabelas ausentes podem quebrar escritas de auditoria/sessao.
7. Testes nao executam no ambiente observado por erro de inicializacao do Vitest.
8. Execucao de testes e sensivel ao ambiente: a sandbox de QA mais restrita tambem bloqueia escritas de cache do Vitest.

## Entrada Obrigatoria Para Prompt

O prompt executor deve exigir implementacao, nao conclusao apenas documental. Uma funcionalidade nao deve ser marcada como completa sem modelo/migration quando necessario, backend, autorizacao, isolamento de tenant, integracao frontend, estados, testes, dados demo e documentacao.
