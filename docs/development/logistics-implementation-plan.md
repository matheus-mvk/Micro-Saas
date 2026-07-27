# Plano De Implementacao Da Plataforma Logistica

Data: 2026-07-25

Este plano deriva da auditoria read-only dos servicos. Ele e intencionalmente orientado a implementacao e deve ser usado junto com `docs/prompts/logistics-platform-complete-implementation-prompt.md`.

## Regras Nao Negociaveis

- Nao marcar uma funcionalidade como completa quando houver apenas schema, endpoint, visual, mock ou documentacao.
- Toda query operacional deve derivar `tenantId` do contexto autenticado no servidor.
- O frontend deve consumir somente contratos backend documentados.
- Funcionalidades administrativas precisam de integracao real entre frontend, backend e MySQL.
- Revisao de seguranca pode bloquear escolhas de implementacao.
- Schema, migrations, Docker, env vars e contratos compartilhados exigem revisao final de integracao.

## Onda 0 - Fundacao

Objetivos:

- corrigir falha de inicializacao do test runner;
- configurar caminhos de cache/output de testes para execucao local, Docker e CI em sandbox;
- validar schema Prisma e migration em banco limpo descartavel;
- definir modelo de dominio para entidades logisticas;
- definir DTOs compartilhados e contratos de paginacao/erro;
- documentar matriz RBAC;
- documentar estrategia de isolamento de tenant;
- adicionar estrategia CSRF para mutations autenticadas por cookie;
- corrigir entrada insegura em sala realtime por tenant antes de adicionar qualquer fluxo realtime.

Entregaveis:

- testes rodam localmente e em Docker;
- plano de migration revisado por Senior MySQL Database Analyst;
- notas finais de ERD/dominio atualizadas;
- checklist de aceite para cada servico.

## Onda 1 - Identidade E Organizacao

Implementar:

- servico e configuracoes de tenants;
- CRUD de filiais;
- CRUD/convite/status/perfil de usuarios;
- matriz RBAC explicita para `ADMIN`, `MANAGER`, `OPERATOR`;
- lista/revogacao de sessoes/logout global;
- recuperacao de senha;
- MFA/TOTP com recovery codes;
- OAuth Google e GitHub;
- testes e2e de autenticacao e isolamento entre tenants.

Correcoes criticas:

- refresh deve verificar se o usuario ainda esta `ACTIVE`;
- CSRF deve proteger mutations autenticadas por cookie;
- resposta de access token em JSON deve ser revisada e minimizada;
- auditoria deve cobrir todos os eventos de identidade.

## Onda 2 - Cadastros Mestres Logisticos

Implementar:

- CRUD de clientes com validacao CPF/CNPJ e paginacao server-side;
- enderecos de clientes com multiplos tipos e flags de principal/coleta/entrega;
- integracao de CEP via ViaCEP ou BrasilAPI com timeout/cache/mocks;
- CRUD de transportadoras;
- servicos/modalidades de transportadoras;
- regras de cobertura e testes de elegibilidade de rota.

Dados:

- seed deve incluir clientes, enderecos, transportadoras, servicos e coberturas realistas para dois tenants.

## Onda 3 - Precificacao

Implementar:

- tabelas de frete;
- versoes/vigencia;
- faixas de peso;
- valores base/minimo/por kg;
- ad valorem, GRIS, pedagio, seguro, taxas extras e descontos;
- validacao de sobreposicao;
- motor de precificacao deterministico;
- aritmetica Decimal-safe e regras de arredondamento;
- testes unitarios para cenarios de borda de precificacao.

## Onda 4 - Simulacao

Implementar:

- formulario de simulacao com multiplos volumes;
- integracao de rota/distancia, como OpenRouteService ou equivalente justificado;
- endpoint de criacao/calculo de simulacao;
- query de servicos elegiveis;
- opcoes de simulacao persistidas;
- motivos de indisponibilidade;
- classificacao de menor preco/menor prazo;
- detalhe e breakdown de opcao;
- listagem/detalhe de historico com filtros e paginacao;
- transacao de selecao de opcao e auditoria.

## Onda 5 - Operacoes

Implementar:

- shipments a partir de simulacao, criacao manual e criacao por importacao;
- snapshots de origem/destino;
- volumes de shipment;
- maquina de status de tracking;
- eventos de tracking imutaveis;
- eventos de correcao;
- UI de linha do tempo de tracking;
- atualizacoes realtime de tracking depois da correcao do realtime seguro.

## Onda 6 - Importacoes E Processamento Assincrono

Implementar primeiro ao menos um fluxo completo de importacao, preferencialmente clientes ou shipments:

- endpoint de upload;
- validacao CSV e XLSX;
- pre-validacao/preview;
- import job e tabelas de linha/erro;
- processor/worker BullMQ;
- atualizacoes de progresso;
- download de relatorio de erros;
- checksum/idempotencia;
- armazenamento seguro tenant-scoped;
- progresso realtime de importacao com fallback por polling.

## Onda 7 - Inteligencia

Implementar:

- KPIs completos de dashboard a partir do MySQL;
- filtros por periodo, filial, cliente, transportadora, servico e status;
- graficos de simulacoes, custos, performance de transportadora, distribuicao de status, rotas e qualidade de importacao;
- geracao deterministica de insights com limites e evidencias;
- lista/marcar como lido/dispensar insights;
- UI/API de consulta de auditoria.

## Onda 8 - Experiencia

Implementar:

- secoes completas da landing page exigidas pelo desafio;
- metadados SEO/OpenGraph;
- paginas administrativas responsivas para todos os modulos;
- estados de carregamento/vazio/erro/sucesso/sem permissao;
- dialogs/forms/tables acessiveis;
- paginacao, filtros e ordenacao server-side;
- remover botoes apenas visuais ou conecta-los a fluxos reais.

## Onda 9 - Demonstracao, Qualidade E Deploy

Implementar:

- dataset demo completo e coerente com dois tenants;
- idempotencia da seed e testes de guard de producao;
- cobertura unit/integration/e2e para jornadas principais;
- validacao Docker de API/web/worker;
- atualizacoes de README e documentos tecnicos;
- guia de deploy com dependencias de credenciais externas.

Validacao final:

- lint;
- typecheck;
- tests;
- build;
- Prisma validate;
- migrations em banco limpo descartavel;
- seed duas vezes sem duplicidade;
- Docker Compose config/build;
- fluxo manual de login ate shipment/tracking/dashboard/insights/logout.
