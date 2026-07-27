# Modelo Relacional

Status: `IN_DESIGN`

Este documento propoe o proximo modelo relacional. Ele nao altera o schema Prisma atual.

## Estrategia De Identificadores

Recomendacao: manter UUID nas tabelas atuais para evitar churn. Antes de criar tabelas de alto volume como `tracking_events`, avaliar ULID para melhor localidade cronologica. Nao expor IDs sequenciais externamente.

## Estrategia De Tenant

Use `tenantId` em toda tabela privada de alto valor, mesmo quando o tenant puder ser herdado por relacionamentos. Isso melhora autorizacao, indexacao e revisao de query. Exemplos:

- obrigatorio: `users`, `branches`, `customers`, `customer_addresses`, `carriers`, `carrier_services`, `freight_rate_tables`, `freight_simulations`, `freight_simulation_options`, `shipments`, `shipment_addresses`, `shipment_packages`, `tracking_events`, `import_jobs`, `import_job_rows`, `audit_logs`, `insights`.
- opcional/global: `tenants`, catalogo de integracao, catalogo publico de planos.

Para foreign keys tenant-scoped, prefira constraints compostas ou validacao transacional que garanta que filho e pai compartilham o mesmo `tenantId`.

## Cardinalidades Propostas

| Relacionamento | Recomendacao |
| --- | --- |
| Tenant 1:N Branch/User/Customer/Carrier/Shipment/ImportJob/AuditLog | Valido |
| Customer 1:N CustomerAddress | Valido |
| Customer 1:N Shipment | Opcional em Shipment; shipments importados podem nao resolver cliente inicialmente |
| Carrier 1:N CarrierService | Valido |
| CarrierService 1:N FreightSimulationOption | Valido |
| CarrierService 1:N Shipment | Opcional ate shipments manuais/importados conseguirem resolver carrier service |
| FreightSimulation 1:N FreightSimulationOption | Obrigatorio para comparacao |
| FreightSimulationOption 0..1:1 Shipment | Valido se uma opcao selecionada puder criar um shipment |
| Shipment 1:N ShipmentAddress/ShipmentPackage/TrackingEvent | Valido |
| ImportJob 0..1:N Shipment/TrackingEvent | Valido por `importJobId`; nem todo registro e importado |
| User 0..1:N TrackingEvent | Ator opcional para eventos manuais/sistema/importados |
| User 1:N AuditLog | Ator opcional para acoes de sistema |

## Precisao

| Dado | Decimal |
| --- | --- |
| Dinheiro | `Decimal(12,2)` para MVP em BRL; evoluir para `Decimal(14,2)` se faturas enterprise exigirem |
| Peso kg | `Decimal(10,3)` |
| Dimensoes cm | `Decimal(10,2)` |
| Distancia km | `Decimal(10,2)` |
| Taxas percentuais | `Decimal(7,4)` |
| Fator de cubagem | `Decimal(10,4)` |
| Peso volumetrico | `Decimal(10,3)` |

## Datas

Armazene UTC em MySQL `DateTime(3)`. Timezone de exibicao vem das preferencias de tenant/usuario. Use:

- `createdAt`, `updatedAt`: timestamps tecnicos de persistencia.
- `deletedAt`: soft deletion quando aplicavel.
- `occurredAt`: quando o evento logistico ocorreu.
- `receivedAt`: quando a plataforma recebeu evento externo/importado.
- `effectiveFrom`, `effectiveTo`: validade de tabela de frete.
- `currentStatusAt`: timestamp usado para estado atual do shipment.

## Unicidade

| Entidade | Unicidade recomendada |
| --- | --- |
| User | `(tenantId, email)` para MVP; revisitar modelo de membership depois |
| Customer | `(tenantId, document)` quando document estiver presente; considerar document normalizado |
| CustomerAddress | `(tenantId, customerId, label)` se labels forem unicas por cliente |
| Carrier | `(tenantId, document)`, `(tenantId, code)` |
| CarrierService | `(tenantId, carrierId, code)` |
| FreightRateTable | `(tenantId, carrierServiceId, version)` |
| Shipment | `(tenantId, trackingCode)` quando presente; `(tenantId, source, externalReference)` quando presente |
| TrackingEvent | `(tenantId, source, externalEventId)` quando ID externo existir |
| ImportJob | `(tenantId, idempotencyKey)` para retries |

Colunas nullable unique no MySQL permitem multiplos valores `NULL`. Decida explicitamente se isso e aceitavel por campo.

## Indices

Crie indices somente para padroes de query esperados:

- `Shipment(tenantId, currentStatus, createdAt)`: listas operacionais por status.
- `Shipment(tenantId, customerId, createdAt)`: historico no detalhe do cliente.
- `Shipment(tenantId, carrierServiceId, createdAt)`: performance de transportadora.
- `Shipment(tenantId, estimatedDeliveryAt)`: monitoramento de atraso.
- `Shipment(tenantId, externalReference)`: suporte e integracoes.
- `TrackingEvent(tenantId, shipmentId, occurredAt)`: timeline.
- `TrackingEvent(tenantId, source, externalEventId)`: idempotencia.
- `FreightSimulation(tenantId, createdAt)`: historico por periodo.
- `FreightSimulationOption(tenantId, simulationId, amount)`: comparacao.
- `ImportJob(tenantId, status, createdAt)`: monitor de importacao.
- `AuditLog(tenantId, entityType, entityId, createdAt)`: auditoria de recurso.
- `Insight(tenantId, status, priority, validUntil)`: dashboard.

## Exclusao E Cascade

- Tenant: sem hard delete enquanto houver dados filhos; usar suspensao e workflows de retencao.
- User: desativar; preservar links de auditoria com `SetNull` no ator se necessario.
- Customer/Carrier/CarrierService: desativar ou soft delete; nao aplicar cascade em shipments.
- FreightSimulation/Option: historico suficientemente imutavel; sem cascade delete apos selecao de opcao.
- Shipment/TrackingEvent/AuditLog/ImportJob: sem cascade delete destrutivo.
- CustomerAddress: soft delete se referenciado por operacoes futuras; snapshots de shipment permanecem imutaveis.

## Transacoes

Casos obrigatorios de transacao:

- criar shipment a partir de opcao selecionada de simulacao;
- anexar evento de tracking que altera status e atualizar status atual do shipment;
- processar linha de importacao e atualizar contadores do job;
- alterar role/status e escrever audit log;
- criar ou rotacionar familia de refresh token;
- persistir registro de domain event/outbox junto com mudanca de estado.
