# Revisao De Banco Da Simulacao De Frete

Data: 2026-07-25

Escopo: revisao MySQL/Prisma para o futuro fluxo completo de simulacao de frete.

## Resumo Do Schema Atual

O schema atual relacionado a simulacao e minimo:

- `branches`
- `customers`
- `carriers`
- `freight_simulations`
- `audit_logs`

`freight_simulations` atualmente armazena uma unica linha achatada semelhante a simulacao:

- `tenant_id`
- `customer_id` opcional
- `carrier_id` opcional
- postal codes de origem/destino
- peso real/cubado
- length/width/height
- valor da carga
- distancia
- preco estimado
- prazo estimado
- status
- metadata JSON

Esse formato e insuficiente para uma simulacao comparativa real porque nao consegue persistir multiplos pacotes, multiplas opcoes de transportadora/servico, componentes de preco, versoes de tabela, snapshots de endereco, opcao selecionada ou relacao com shipment.

## Indices Uteis Existentes

Indices atuais relevantes para simulacao:

- `branches`: unique `(tenant_id, code)`, index `(tenant_id, active)`.
- `customers`: unique `(tenant_id, document)`, index `(tenant_id, active, name)`.
- `carriers`: unique `(tenant_id, document)`, unique `(tenant_id, code)`, index `(tenant_id, active, name)`.
- `freight_simulations`: index `(tenant_id, status, created_at)`, index `(tenant_id, origin_postal_code, destination_postal_code)`.
- `audit_logs`: index `(tenant_id, action, created_at)`, index `(actor_id, created_at)`.

Esses indices sao um bom ponto de partida, mas nao cobrem os joins futuros obrigatorios porque as tabelas exigidas ainda nao existem.

## Adicoes Obrigatorias De Modelo

Modelos relacionais minimos para o executor:

| Modelo | Finalidade | Constraints/indices obrigatorios |
| --- | --- | --- |
| `CustomerAddress` | Multiplos enderecos por cliente. | `(tenantId, customerId)`, `(tenantId, postalCode)`, politica de um endereco principal. |
| `CarrierService` | Servicos/modalidades sob cada transportadora. | unique `(tenantId, carrierId, code)`, `(tenantId, carrierId, active)`, `(tenantId, active, modality)`. |
| `CarrierCoverage` | Regras de cobertura para servico de transportadora. | `(tenantId, carrierServiceId, active)`, indices para state/city/postal range de origem/destino. |
| `FreightRateTable` | Tabela de precificacao versionada. | unique `(tenantId, carrierServiceId, version)`, `(tenantId, carrierServiceId, active, startsAt, endsAt)`. |
| `FreightRateRange` | Faixas/ranges de peso. | `(tenantId, freightRateTableId, minWeightKg, maxWeightKg)`, sobreposicao validada no service e em testes. |
| `FreightAdditionalCharge` | Configuracao de taxas. | `(tenantId, freightRateTableId, type, active)`. |
| `FreightSimulationAddress` | Snapshots imutaveis de origem/destino. | `(tenantId, freightSimulationId, type)`. |
| `FreightSimulationPackage` | Multiplos pacotes/volumes. | `(tenantId, freightSimulationId)`. |
| `FreightSimulationOption` | Resultado de opcao por transportadora/servico. | `(tenantId, freightSimulationId, totalPrice)`, `(tenantId, freightSimulationId, deadlineDays)`, regra unica de opcao selecionada se modelada por flag. |
| `FreightSimulationPriceComponent` | Linhas de breakdown. | `(tenantId, freightSimulationOptionId, type)`. |
| `Shipment` | Operacao criada a partir de opcao. | `(tenantId, trackingCode)`, `(tenantId, externalReference)`, `(tenantId, status, estimatedDeliveryAt)`, `(tenantId, customerId, createdAt)`. |
| `ShipmentAddress` | Snapshots imutaveis de shipment. | `(tenantId, shipmentId, type)`. |
| `ShipmentPackage` | Pacotes do shipment. | `(tenantId, shipmentId)`. |

Snapshots podem usar JSON somente para payloads de origem imutaveis ou metadata, nao para evitar modelagem de relacionamentos, filtros, ranges, status, componentes de preco ou pacotes.

## Requisitos De Decimal E Precisao

Use Prisma `Decimal`/MySQL `DECIMAL`, nao ponto flutuante, para:

- valores monetarios: `DECIMAL(12,2)` ou maior se necessario;
- percentuais: `DECIMAL(8,4)`;
- peso kg: `DECIMAL(10,3)`;
- dimensoes cm: `DECIMAL(10,2)`;
- volume m3: `DECIMAL(12,6)`;
- distancia km: `DECIMAL(10,2)`.

O motor de precificacao deve centralizar arredondamento:

- dinheiro arredondado para 2 casas decimais apos cada calculo final de componente;
- calculos internos de peso e volume mantem pelo menos 3 casas decimais;
- total final igual a soma dos componentes de preco persistidos.

## Revisao De Queries E Indices Para Caminhos Criticos

### Servicos De Transportadora Ativos

Query esperada:

- igualdade de tenant;
- transportadora ativa;
- servico ativo;
- filtros opcionais de transportadora/servico.

Indices obrigatorios:

- `Carrier`: `(tenantId, active, name)`.
- `CarrierService`: `(tenantId, active, carrierId)`.

### Busca De Cobertura

Query esperada:

- igualdade de tenant;
- igualdade de carrierServiceId;
- igualdade de active;
- origem/destino por estado/cidade ou postal ranges.

Obrigatorio:

- index `(tenantId, carrierServiceId, active)`;
- indices separados range-aware para a estrategia escolhida de prefixo/range postal;
- query plan documentado. Evitar consultas amplas `%contains%` para CEP.

### Tabela De Frete Vigente

Query esperada:

- igualdade de tenant;
- igualdade de carrierServiceId;
- igualdade de active;
- `startsAt <= simulationDate`;
- `endsAt IS NULL OR endsAt >= simulationDate`;
- ordenar por versao/data efetiva.

Indice obrigatorio:

- `(tenantId, carrierServiceId, active, startsAt, endsAt)`.

### Busca De Faixa De Peso

Query esperada:

- igualdade de tenant;
- igualdade de freightRateTableId;
- `minWeightKg <= chargeableWeight`;
- `maxWeightKg IS NULL OR maxWeightKg >= chargeableWeight`;
- ordenar por priority/minWeight.

Indice obrigatorio:

- `(tenantId, freightRateTableId, minWeightKg, maxWeightKg)`.

O service deve validar faixas nao sobrepostas porque MySQL nao consegue expressar essa constraint diretamente com um unique index simples.

### Listagem De Historico

Filtros obrigatorios de listagem:

- periodo;
- cliente;
- usuario;
- transportadora;
- servico;
- origem/destino;
- opcao selecionada;
- relacao com shipment.

Indices obrigatorios:

- `FreightSimulation`: `(tenantId, createdAt)`, `(tenantId, customerId, createdAt)`, `(tenantId, createdById, createdAt)` apos adicionar `createdById`.
- `FreightSimulationOption`: `(tenantId, freightSimulationId)`, `(tenantId, carrierId, createdAt)`, `(tenantId, carrierServiceId, createdAt)`.
- `Shipment`: `(tenantId, simulationId)` ou `(tenantId, selectedOptionId)`.

### Dashboard

Dashboard deve evitar carregar todas as linhas no Node.js. Use aggregate queries ou SQL bruto agrupado quando Prisma aggregate nao for expressivo o suficiente. Adicione indices para:

- `(tenantId, createdAt)`;
- `(tenantId, status, createdAt)`;
- `(tenantId, carrierId, createdAt)`;
- `(tenantId, carrierServiceId, createdAt)`;
- `(tenantId, estimatedDeliveryAt)`.

### Auditoria

Filtros de auditoria de simulacao exigem:

- `(tenantId, action, createdAt)`;
- `(tenantId, entityType, entityId, createdAt)` se detalhes linkarem por recurso.

## Requisitos De Transacao

Use transacoes para:

- criar simulacao com enderecos/pacotes/opcoes/componentes;
- selecionar opcao e limpar selecao anterior;
- criar shipment a partir de opcao selecionada com snapshots de endereco/pacote e evento inicial de tracking;
- mudancas de versao de tabela de frete que afetem multiplas linhas;
- setup de seed para dados demo coerentes quando viavel.

Nao inclua chamadas de API externa dentro de transacoes de DB. Busque dados de CEP/rota antes de abrir a transacao ou use dados em cache.

## Requisitos De Concorrencia

Constraints devem ser a defesa final para:

- codigo unico de servico por transportadora e tenant;
- versao unica de tabela de frete por servico e tenant;
- criacao idempotente de shipment a partir de opcao selecionada;
- tracking code unico dentro do tenant;
- IDs/upserts idempotentes da seed.

Para selecao de opcao, use uma transacao e uma destas alternativas:

- um unico campo de opcao selecionada em `FreightSimulation`, ou
- estrategia de unique constraint que impeça multiplas opcoes selecionadas para uma simulacao.

## Riscos Atuais De Banco

- `FreightSimulation` atualmente nao tem relacao de usuario `createdBy`, relacao de filial ou relacao de opcao selecionada.
- `metadata` JSON armazena contexto demo e pode virar deposito generico se nao for controlado.
- `Customer` nao possui enderecos; historico de endereco nao pode ser preservado.
- `Carrier` nao possui servicos; precificacao nao consegue distinguir economico/expresso/same day/etc.
- Nao ha representacao relacional para componentes de preco, tornando dashboard/insights impossiveis sem parsear JSON.
- Nenhum teste executavel de DB atualmente prova isolamento cross-tenant ou idempotencia da seed.
