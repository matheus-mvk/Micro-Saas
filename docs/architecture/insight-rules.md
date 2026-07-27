# Regras de Insights

Os insights da plataforma sao deterministicos. Eles nao dependem de IA generativa; sao derivados dos dados reais do tenant por geradores versionaveis no backend.

## Implementacao

Codigo principal:

- `apps/api/src/modules/insights/insights.service.ts`
- `apps/api/src/modules/insights/generators/cost-insights.generator.ts`
- `apps/api/src/modules/insights/generators/performance-insights.generator.ts`

Rotas:

- `GET /api/v1/insights`
- `GET /api/v1/insights/summary`
- `POST /api/v1/insights/refresh`
- `GET /api/v1/insights/:id`
- `PATCH /api/v1/insights/:id/read`
- `PATCH /api/v1/insights/:id/dismiss`

Web:

- `/insights`

## Periodo analisado

O backend usa uma janela corrente de 30 dias e uma janela anterior de 30 dias:

- periodo corrente: `currentEnd - 30 dias` ate `currentEnd`;
- periodo anterior: 30 dias imediatamente anteriores ao periodo corrente.

Algumas regras comparam media atual contra media anterior. Outras operam somente sobre o periodo corrente.

## Persistencia e deduplicacao

Cada insight persistido inclui:

- `tenantId`;
- `type`;
- `category`;
- `severity`;
- `status`;
- `title`;
- `description`;
- `evidence`;
- `metadata`;
- periodo analisado;
- recurso relacionado quando houver;
- `actionUrl` para contexto operacional.

A deduplicacao usa `tenantId + dedupeKey`, combinando tipo, recurso/evidencia e periodo. Quando uma regra volta a gerar o mesmo insight, o registro e atualizado e volta para `NEW`.

## Categorias e severidades

Categorias:

- `COST`
- `DEADLINE`
- `CARRIER`
- `ROUTE`
- `CUSTOMER`
- `OPERATION`
- `IMPORT`
- `DATA_QUALITY`

Severidades:

- `INFO`
- `OPPORTUNITY`
- `WARNING`
- `CRITICAL`

Status:

- `NEW`
- `READ`
- `DISMISSED`
- `RESOLVED`

## Regras de custo

| Tipo | Categoria | Severidade | Condicao | Evidencia | Contexto |
| --- | --- | --- | --- | --- | --- |
| `COST_SAVINGS_NOT_SELECTED` | `COST` | `OPPORTUNITY` | Pelo menos 2 simulacoes em que a opcao selecionada nao foi a mais barata e ha economia potencial positiva | ocorrencias, transportadora selecionada mais comum, transportadora mais barata mais comum | `/freight/history` |
| `ROUTE_COST_INCREASE` | `COST` | `INFO` ou `WARNING` | Rota com pelo menos 2 amostras no periodo atual e anterior, media atual maior e aumento >= 15% | media atual, media anterior, quantidade e rota | `/freight/history` |
| `CHEAPEST_CARRIER` | `COST` | `OPPORTUNITY` | Transportadora com menor preco medio entre grupos com pelo menos 2 opcoes | preco medio, nome da transportadora, quantidade de opcoes | `/freight/simulate` |
| `FREIGHT_PRICE_OUTLIER` | `COST` | `WARNING` | Rota com pelo menos 4 opcoes e uma ou mais acima de 135% da media | media, threshold, quantidade de outliers e rota | `/freight/history` |

## Regras de prazo, transportadora e rota

| Tipo | Categoria | Severidade | Condicao | Evidencia | Contexto |
| --- | --- | --- | --- | --- | --- |
| `FASTEST_CARRIER` | `DEADLINE` | `INFO` | Transportadora com menor prazo medio entre grupos com pelo menos 2 opcoes | prazo medio, nome da transportadora, quantidade de opcoes | `/freight/simulate` |
| `CARRIER_DEPENDENCY` | `CARRIER` | `INFO` ou `WARNING` | Pelo menos 4 opcoes selecionadas e concentracao >= 65% em uma transportadora | transportadora, quantidade selecionada, total e percentual | `/freight/history` |
| `ROUTE_NEGOTIATION_POTENTIAL` | `ROUTE` | `OPPORTUNITY` | Rota com pelo menos 3 simulacoes no periodo | rota, quantidade de simulacoes e total | `/freight/history` |

## Regras de cliente, operacao e importacao

| Tipo | Categoria | Severidade | Condicao | Evidencia | Contexto |
| --- | --- | --- | --- | --- | --- |
| `CUSTOMER_SIMULATION_VOLUME` | `CUSTOMER` | `INFO` | Cliente com pelo menos 2 simulacoes no periodo | cliente e quantidade de simulacoes | `/customers` |
| `DELAYED_SHIPMENTS` | `OPERATION` | `WARNING` ou `CRITICAL` | Shipments com previsao vencida e status nao terminal | quantidade de shipments atrasados | `/dashboard` |
| `LOW_SIMULATION_CONVERSION` | `OPERATION` | `OPPORTUNITY` | Pelo menos 3 simulacoes e conversao para shipments menor que 40% | taxa de conversao, total de shipments e simulacoes | `/freight/history` |
| `IMPORT_HIGH_ERROR_RATE` | `IMPORT` | `INFO` ou `WARNING` | Importacao com mais de 20% de linhas com erro | arquivo, total de linhas, linhas com erro e taxa | `/imports/:id` |
| `IMPORT_STALLED` | `IMPORT` | `WARNING` | Importacao em `PROCESSING` ha mais de 30 minutos sem conclusao | arquivo e data da ultima atualizacao | `/imports/:id` |

## UX de contexto

Na tela `/insights`, o usuario pode abrir o contexto antes de navegar. O painel mostra:

- explicacao do contexto;
- periodo analisado;
- recurso relacionado;
- evidencias principais;
- link secundario para a tela operacional quando `actionUrl` existe.

Essa decisao evita que o usuario seja redirecionado para uma tela sem entender o motivo do insight.

## Auditoria

Eventos registrados:

- `INSIGHT_GENERATED` ao gerar/regerar insights;
- `INSIGHT_READ` ao marcar como lido;
- `INSIGHT_DISMISSED` ao dispensar.

## Regras de evolucao

1. Toda nova regra deve gravar `type` estavel.
2. Toda evidencia deve ser suficiente para explicar a recomendacao sem consultar log tecnico.
3. Nenhuma regra deve misturar dados de tenants diferentes.
4. Regras com thresholds devem documentar o valor e a justificativa.
5. `actionUrl` deve apontar para tela que ajude a investigar o insight.
