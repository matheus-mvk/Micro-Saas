# Prompt Completo De Implementacao Da Plataforma Logistica

Voce e o Codex trabalhando no repositorio `/mnt/c/projetos/micro-saas`.

Sua tarefa e implementar, integrar, testar e documentar a plataforma SaaS completa de inteligencia logistica multi-tenant. Esta e uma execucao de implementacao, nao outra auditoria. Voce deve alterar codigo, schema, migrations, frontend, backend, testes, seed e documentacao conforme necessario, respeitando as regras do repositorio.

## Regras Do Repositorio

- Trabalhe somente dentro deste repositorio.
- Nao use codigo proprietario ou snippets nao verificados.
- Nao invente funcionalidades sem registrar a hipotese.
- Nao altere ADRs silenciosamente.
- Nao sobrescreva trabalho de outro agente sem revisao final.
- Nao crie codigo morto ou abstracoes sem caso de uso real.
- Nao ignore erros, nao enfraqueca seguranca e nao commite segredos.
- Mantenha documentacao, codigo, scripts e decisoes alinhados.
- Nao use `docker compose down -v`, `prisma migrate reset`, apague volumes, apague migrations indiscriminadamente ou execute comandos destrutivos de producao.
- Use banco limpo descartavel para validacao destrutiva somente depois de coordenacao explicita.

## Material Fonte Para Ler Primeiro

Leia estes arquivos antes da implementacao:

- `README.md`
- `AGENTS.md`
- `docs/audit/logistics-services-audit.md`
- `docs/audit/logistics-simulation-gap-analysis.md`
- `docs/audit/logistics-requirement-matrix.md`
- `docs/audit/authentication-audit.md`
- `docs/audit/final-requirement-review.md` se existir
- `docs/audit/mysql-performance-audit.md` se existir
- `docs/development/logistics-implementation-plan.md`
- `docs/development/logistics-manual-test-scenarios.md`
- `apps/api/prisma/schema.prisma`
- todas as migrations Prisma
- todos os modulos backend em `apps/api/src`
- todas as paginas e services frontend em `apps/web/src`
- `.cloud/agents`
- `.cloud/skills`

O objetivo original do produto e uma plataforma SaaS multi-tenant de inteligencia logistica e analise de fretes, nao apenas uma calculadora de frete.

## Estado Auditado Atual

Endpoints backend encontrados atualmente:

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/dashboard/summary`

Rotas frontend encontradas atualmente:

- `/`
- `/login`
- `/dashboard`

Modelos Prisma encontrados atualmente:

- `Tenant`
- `Branch`
- `User`
- `RefreshToken`
- `Customer`
- `Carrier`
- `FreightSimulation`
- `ImportJob`
- `AuditLog`

A maior parte dos servicos logisticos esta ausente, apenas estruturada ou parcial. Nao trate esses itens como completos.

## Agentes Obrigatorios

Use ou crie agentes seguindo o padrao existente em `.cloud/agents`:

- Backend Specialist
- Frontend Specialist
- UI/UX Specialist
- Security Specialist
- Infrastructure Specialist
- Testing/QA Specialist
- Senior MySQL Database Analyst
- Final Integrator and Reviewer

O Final Integrator coordena arquivos compartilhados e resolve conflitos. Schema, migrations, contratos compartilhados, auth, RBAC, Docker, env e scripts raiz exigem revisao final.

## Regra De Conclusao

Um servico esta completo somente quando possui:

1. objetivo de negocio;
2. atores e permissoes;
3. modelo/migration/constraints/indexes quando persistencia for necessaria;
4. controller/use case/service/repository backend;
5. DTOs e validacao;
6. autorizacao e isolamento de tenant;
7. eventos de auditoria;
8. tratamento de erros e Swagger;
9. pagina/componentes frontend;
10. estados de carregamento, vazio, erro, sucesso e sem permissao;
11. paginacao/filtro/ordenacao server-side quando aplicavel;
12. testes unitarios;
13. testes de integracao;
14. testes e2e relevantes;
15. dados demo;
16. cenario de teste manual;
17. documentacao;
18. lint/typecheck/test/build passando;
19. revisao do Security Specialist;
20. revisao do Senior MySQL Database Analyst;
21. revisao do Final Integrator.

Nao marque como completo quando existir somente tabela, modelo Prisma, controller vazio, tela visual, mock frontend, placeholder, dado fixo, botao sem acao, endpoint sem persistencia ou documentacao.

## Onda 0 - Fundacao

Implementar primeiro:

- Corrigir falha de inicializacao do Vitest observada como `SyntaxError: Unexpected token '*'`.
- Configurar caminhos de Vitest/cache/output para que testes nao falhem apenas porque `node_modules/.vite/vitest/results.json` nao pode ser escrito em ambientes mais restritos.
- Rodar e documentar `lint`, `typecheck`, `test`, `build`, `prisma validate`, `docker compose config`.
- Validar estrategia de migration sem reset destrutivo.
- Revisar migration inicial atual e problema anterior de identificador MySQL.
- Definir modelo relacional logistico completo com Senior MySQL Database Analyst.
- Definir DTOs compartilhados em `packages/shared`.
- Definir matriz RBAC para ADMIN, MANAGER, OPERATOR.
- Definir estrategia de isolamento de tenant para queries, jobs, cache, uploads e realtime.
- Adicionar estrategia CSRF para mutations autenticadas por cookie.
- Corrigir entrada insegura em sala Socket.IO por tenant antes de adicionar eventos realtime.
- Atualizar `.env.example` para todas as integracoes externas sem commitar segredos.

## Onda 1 - Identidade, Tenants E Usuarios

Implementar:

- servico de tenant: criar, consultar, editar, ativar, desativar, configuracoes;
- servico de filial: criar, listar, editar, ativar, desativar, endereco/contato/codigo/filial principal;
- gestao de usuarios: convidar/criar, listar/buscar/filtrar/paginar, detalhe, editar nome, editar role, ativar, desativar, remocao logica, revogar sessoes, resetar MFA, reenviar convite, status, ultimo acesso, metodos de autenticacao;
- roles: ADMIN, MANAGER, OPERATOR com matriz explicita de permissao no backend;
- impedir remocao/desativacao do ultimo ADMIN ativo;
- impedir autoelevacao sem permissao;
- revogar sessoes apos desativacao e mudancas criticas de permissao;
- lista/revogacao de sessoes/logout atual/logout global;
- testes de deteccao de reuso de refresh token;
- recuperacao de senha com token unico expiravel e adapter de e-mail de desenvolvimento;
- OAuth Google com state, callback, e-mail verificado, associacao tenant/user e pagina de erro;
- OAuth GitHub incluindo consulta de e-mail verificado quando e-mail publico estiver indisponivel;
- enrollment, desafio, desativacao, recovery codes, regeneracao e auditoria de MFA/TOTP.

Aceite:

- `administrador@dev.com` / `@DEV1512` faz login como ADMIN no tenant `demo-logistics`.
- Refresh recusa usuarios inativos e tenants inativos.
- Nenhum token/segredo sensivel e armazenado em `localStorage`.
- Backend retorna 403 para violacoes de role.

## Onda 2 - Cadastros Mestres Logisticos

Implementar:

- CRUD de clientes com tipo de pessoa, nome, razao social, CPF/CNPJ, inscricao estadual, e-mail, telefone, contato principal, observacoes, status, usuario responsavel e filial quando aplicavel;
- enderecos de clientes com multiplos tipos, CEP, rua, numero, complemento, bairro, cidade, estado, pais, coordenadas e flags principal/coleta/entrega;
- integracao ViaCEP ou BrasilAPI com timeout, cache, fallback, mocks e testes;
- CRUD de transportadoras com dados legais, contato, status e metadata de integracao sem expor segredos;
- servicos de transportadora com codigo, nome, modalidade, descricao, prazo padrao, fator cubico, peso min/max, preco minimo, cobertura e associacao de precificacao;
- regras de cobertura por pais/estado/cidade/faixa postal/regiao/origem-destino com validacao de sobreposicao e endpoint de teste de rota.

Aceite:

- CRUDs sao tenant-scoped, paginados server-side, auditados e testados.
- Transportadoras/servicos inativos sao excluidos de novas simulacoes.

## Onda 3 - Precificacao De Frete

Implementar:

- tabelas de frete associadas a transportadora/servico/cobertura;
- versionamento e vigencia;
- faixas de peso com min/max/base/por kg/excedente/prazo/prioridade;
- taxas: fixa, ad valorem, GRIS, pedagio, seguro, taxas extras, descontos;
- restricoes e moeda;
- validacao de sobreposicao;
- snapshots historicos de regra;
- motor deterministico de precificacao independente de controllers.

O motor de precificacao deve:

- normalizar unidades;
- computar peso real total;
- computar volume total;
- computar peso cubado como volume vezes fator cubico usando unidades documentadas;
- computar peso taxavel de forma deterministica;
- selecionar cobertura, tabela de frete e faixa ativas;
- calcular breakdown e total com precisao Decimal-safe;
- explicar cada componente.

Aceite:

- Testes unitarios cobrem cubagem, peso taxavel, preco minimo, faixas, taxas, arredondamento e limites de borda.

## Onda 4 - Simulacao De Frete

Implementar:

- pagina/formulario de simulacao com cliente opcional, origem/destino, consulta de CEP, cidade/estado, valor da carga, data desejada, observacoes, filtros de servico/transportadora e multiplos volumes;
- integracao de rota/distancia como OpenRouteService ou equivalente justificado com timeout, retry, cache, fallback e mocks;
- endpoint backend de criacao/calculo de simulacao;
- processamento deterministico para cada servico elegivel;
- entrada, volumes, opcoes, motivos de indisponibilidade, breakdown e versoes de regra persistidos;
- comparacao de resultados com ordenacao/filtro/detalhes;
- flags de menor preco e menor prazo;
- transacao de selecao de opcao e auditoria;
- listagem/detalhe de historico de simulacao com filtros e paginacao;
- criacao de Shipment a partir da opcao selecionada.

Aceite:

- O avaliador consegue executar o fluxo completo de simulacao de frete desde login ate historico e criacao de shipment.

## Onda 5 - Shipments E Tracking

Implementar:

- shipments criados a partir de simulacao, manualmente e por importacao;
- campos: cliente, transportadora, servico, tracking code, referencia externa, snapshots de origem/destino, volumes, peso, valor da carga, valor do frete, ETA, status atual, data de entrega, origem, usuario, tenant;
- edicoes permitidas e regras de cancelamento;
- eventos de tracking com status `CREATED`, `PICKUP_SCHEDULED`, `PICKED_UP`, `IN_TRANSIT`, `ARRIVED_AT_HUB`, `OUT_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_FAILED`, `RETURNING`, `RETURNED`, `CANCELED`;
- eventos sem status `ETA_UPDATED`, `LOCATION_UPDATED`, `NOTE_ADDED`, `EXCEPTION_REPORTED`, `CORRECTION_CREATED`;
- timeline de eventos imutavel;
- maquina de estado explicita;
- idempotencia para eventos externos;
- criacao de evento e atualizacao de status do shipment na mesma transacao;
- atualizacao realtime de tracking depois que realtime seguro estiver implementado.

Aceite:

- Transicoes de status invalidas falham.
- Correcoes nao alteram eventos originais.
- Timeline e status atual permanecem consistentes.

## Onda 6 - Importacoes, Async E Realtime

Implementar pelo menos um fluxo de importacao totalmente funcional, preferencialmente clientes ou shipments:

- upload CSV e XLSX;
- validacao de extensao, MIME, tamanho, nome do arquivo, conteudo, headers e linhas;
- preview/pre-validacao;
- modelos ImportJob e ImportJobRow/Error;
- armazenamento de arquivo tenant-scoped;
- job BullMQ com tenantId, userId, type, payload, idempotency key, attempts, timeout e correlation ID;
- processo worker, health check, retry/backoff, estado de falha, metricas e limpeza;
- persistencia de progresso;
- eventos de progresso Socket.IO usando salas de tenant autenticadas e derivadas pelo servidor;
- conexao/reconexao/fallback polling no frontend;
- relatorio de erros baixavel protegido contra formula injection.

Aceite:

- Upload de arquivo valido persiste linhas.
- Linhas invalidas geram relatorio.
- Arquivo duplicado segue regra documentada de checksum/idempotencia.
- Usuario de outro tenant nao consegue acessar arquivo/job/eventos.

## Onda 7 - Dashboard, Insights E Auditoria

Implementar:

- filtros de dashboard: periodo, filial, cliente, transportadora, servico, status;
- KPIs: total de simulacoes, frete medio, menor valor medio, economia estimada, total de shipments, em transito, atrasados, entregues, falhos, taxa de sucesso, prazos previstos e reais, contagens e erros de importacao;
- graficos: simulacoes ao longo do tempo, custos ao longo do tempo, performance de transportadora, status de shipment, rotas frequentes, prazo previsto vs real, distribuicao de custo e qualidade de importacao;
- queries SQL/Prisma otimizadas com indices e sem N+1 evitavel;
- modelo de insight e gerador deterministico com tipo, titulo, descricao, severidade, evidencia, metrica, periodo, data de geracao, validade, tenant, link de contexto, estado lido/dispensado;
- API/UI de consulta de auditoria com filtros de periodo/usuario/acao/recurso, detalhes e paginacao.

Aceite:

- Nenhum KPI ou insight usa dado fixo no frontend.
- Dashboard e insights consideram somente dados do tenant atual.

## Onda 8 - Experiencia Publica E Admin

Implementar:

- secoes completas da landing page: header, hero, problema, solucao, funcionalidades, demo de fluxo, beneficios, indicadores ilustrativos, diferenciais, seguranca, integracoes, CTA, footer;
- menu responsivo e navegacao por ancoras;
- metadados SEO, Open Graph e estrutura semantica;
- todas as paginas admin para usuarios, clientes, transportadoras, servicos, tabelas de frete, simulacoes, historico, shipments, tracking, importacoes, dashboard, insights, auditoria e configuracoes;
- forms/tables/dialogs acessiveis;
- estados de carregamento, vazio, erro, sucesso e sem permissao;
- nenhum dado frontend apenas mock.

Aceite:

- Todo botao visivel tem uma acao funcional ou esta intencionalmente ausente.
- Todas as paginas possuem integracao backend ou nao sao apresentadas como implementadas.

## Onda 9 - Dados Demo, Testes, Docs E Deploy

Implementar:

- seed completa idempotente com dois tenants, filiais, usuarios, usuario desativado, clientes, enderecos, transportadoras, servicos, cobertura, tabelas de frete, versoes, faixas, simulacoes, opcoes, opcao selecionada, shipments, volumes, tracking, importacoes, erros, auditoria, dados de dashboard, insights, sessoes e permissoes;
- guard de producao da seed e testes de concorrencia/idempotencia;
- testes unitarios para logica de dominio;
- testes de integracao para API + database;
- testes e2e para landing, login, dashboard, CRUDs, simulacao, shipment, tracking, importacao, auditoria, MFA, RBAC e isolamento de tenant;
- Docker Compose com API, web, worker, MySQL e Redis;
- README e docs tecnicas para arquitetura, setup, migrations, seed, OAuth, MFA, integracoes, filas, realtime, observabilidade e deploy.

A validacao final deve executar e reportar:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm db:generate`
- `pnpm --filter @logistics/api exec prisma validate`
- migrations em banco limpo descartavel
- seed duas vezes sem duplicidade
- `docker compose config`
- health checks de build/start Docker
- cenarios manuais de teste em `docs/development/logistics-manual-test-scenarios.md`

## Resposta Final Obrigatoria

Ao final, reportar:

1. agentes usados;
2. arquivos alterados;
3. migrations criadas;
4. indices adicionados/removidos;
5. endpoints implementados;
6. paginas implementadas;
7. testes adicionados;
8. testes executados e resultados;
9. resultado da seed duas vezes;
10. resultado do Docker;
11. resultado de teste cross-tenant;
12. configuracao externa ainda exigida;
13. limitacoes conhecidas;
14. se o login `administrador@dev.com` funciona;
15. se a plataforma esta pronta para demonstracao.

Nao declare sucesso para comandos ou fluxos que nao foram executados.
