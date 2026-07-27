# Estado Atual Da Simulacao De Frete

Data: 2026-07-25

Escopo: auditoria read-only do fluxo de simulacao de frete apos o ultimo trabalho de fundacao/clientes/seguranca. Esta auditoria nao implementa codigo funcional.

## Fundacao Implementada Confirmada

Os itens abaixo existem no codigo e nao devem ser reimplementados do zero pelo proximo executor:

- Autenticacao basica: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- Refresh token rejeita usuarios nao ativos: `apps/api/src/modules/auth/auth.service.ts` verifica `session.user.status !== UserStatus.ACTIVE`.
- Contexto autenticado de tenant: `PrivateByDefaultGuard` e `AuthContextService` derivam `tenantId`, `userId` e `role` de access token verificado e usuario ativo.
- Fundacao de isolamento realtime de tenant: `NotificationsGateway` autentica o handshake Socket.IO e entra somente na sala de tenant derivada do token/cookie autenticado.
- API inicial de customers: `apps/api/src/modules/customers/*`.
- Paginacao server-side de customers: `CustomersService.list()` usa `skip`, `take`, filtro de tenant e `count`.
- Validacao CPF/CNPJ de customer: implementada em `CustomersService`.
- Auditoria de customer: `AuditAction.CUSTOMER_CHANGED` e registrada em mudancas de create/update/status.
- Frontend de customer: rota `/customers`, service `apps/web/src/services/customers-service.ts`, componente `CustomerManagement`.
- Resumo do dashboard: `GET /api/v1/dashboard/summary` conta dados do tenant atual a partir do MySQL.

## Problemas Conhecidos Da Plataforma

- Testes da API e web falham antes das specs com `SyntaxError: Unexpected token '*'`.
- Build Web compila, mas nao concluiu a validacao local do Next na execucao anterior.
- Lint ficou inconclusivo localmente.
- Seed e minima e nao cobre a narrativa completa de simulacao.
- E2E nao cobre login ate simulacao ate shipment.

## Estado Do Fluxo De Simulacao De Frete

O fluxo completo de simulacao de frete nao e funcional. O repositorio atual possui:

- Um modelo Prisma simples `FreightSimulation` com postal codes de origem/destino, campos de peso real/cubado, distancia, preco estimado, prazo e metadata.
- `FreightSimulationsModule` como modulo Nest vazio.
- Um `freightSimulation.upsert()` demo em `apps/api/prisma/seed.ts` com valores estaticos.
- Agregado de dashboard que conta freight simulations e calcula media de `estimatedPrice`.

O repositorio atual nao possui:

- controller de simulacao;
- service/use case de simulacao;
- pagina frontend de simulacao;
- entrada multi-volume;
- modelo/servico de endereco de cliente;
- CRUD de filiais;
- API/UI de CRUD de transportadora;
- modelo de servico de transporte de transportadora;
- modelo de cobertura ou elegibilidade de rota;
- tabelas de frete, versoes, ranges ou cobrancas adicionais;
- motor deterministico de precificacao;
- adapter de consulta CEP;
- adapter de rota/distancia;
- opcoes de simulacao persistidas;
- tabela de breakdown de componentes de preco;
- listagem/detalhe de historico de simulacao;
- selecao de opcao;
- criacao de shipment;
- inicializacao de tracking;
- KPIs ou insights especificos de simulacao no dashboard.

## Arquivos Existentes Relevantes Ao Fluxo

Backend:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260718150000_init/migration.sql`
- `apps/api/prisma/seed.ts`
- `apps/api/src/modules/freight-simulations/freight-simulations.module.ts`
- `apps/api/src/modules/customers/*`
- `apps/api/src/modules/dashboard/dashboard.service.ts`
- `apps/api/src/modules/carriers/carriers.module.ts`
- `apps/api/src/modules/branches/branches.module.ts`
- `apps/api/src/modules/audit/audit.service.ts`
- `apps/api/src/infrastructure/realtime/notifications.gateway.ts`

Frontend:

- `apps/web/src/app/(dashboard)/customers/page.tsx`
- `apps/web/src/features/customers/customer-management.tsx`
- `apps/web/src/services/customers-service.ts`
- `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- `apps/web/src/features/dashboard/dashboard-summary.tsx`
- `apps/web/src/components/layout/app-shell.tsx`

Contratos compartilhados:

- `packages/shared/src/index.ts`

## Modelos Existentes

| Modelo | Relevancia | Estado atual para simulacao |
| --- | --- | --- |
| `Branch` | candidata a origem/unidade operacional | Existe apenas como modelo e seed. Sem API/UI. Sem campos de endereco. |
| `Customer` | cliente selecionado na simulacao | Existe com CRUD basico e isolamento de tenant. Sem relacao de endereco. |
| `Carrier` | candidata a empresa de transporte | Existe como modelo simples e seed. Sem API/UI. Sem carrier services. |
| `FreightSimulation` | registro atual de simulacao | Existe, mas raso demais para o fluxo completo. Sem packages/options/components/snapshots. |
| `AuditLog` | suporte de auditoria | Existe e escritas de customer/auth o usam. Sem acoes de auditoria especificas de simulacao. |

## Modelos Ausentes Do Modelo Minimo Esperado

- `CustomerAddress`
- `CarrierService`
- `CarrierCoverage`
- `FreightRateTable`
- `FreightRateRange`
- `FreightAdditionalCharge`
- `FreightSimulationAddress`
- `FreightSimulationPackage`
- `FreightSimulationOption`
- `FreightSimulationPriceComponent`
- `Shipment`
- `ShipmentAddress`
- `ShipmentPackage`

`Branch`, `Carrier`, `FreightSimulation` e `AuditLog` existem, mas precisam de expansao ou tabelas relacionadas.

## Endpoints Existentes

Endpoints existentes relevantes:

- `GET /api/v1/customers`
- `GET /api/v1/customers/:id`
- `POST /api/v1/customers`
- `PATCH /api/v1/customers/:id`
- `PATCH /api/v1/customers/:id/status`
- `GET /api/v1/dashboard/summary`

Endpoints de simulacao ausentes:

- consulta de endereco;
- CRUD de filial;
- CRUD de transportadora;
- CRUD de servico de transporte de transportadora;
- CRUD/teste de cobertura;
- CRUD de tabela de frete;
- CRUD de range de frete;
- CRUD de cobranca adicional;
- criacao/calculo de simulacao;
- detalhe/historico de simulacao;
- selecao de opcao;
- criacao de shipment a partir de opcao;
- KPIs de dashboard de simulacao;
- insights de simulacao.

## Paginas Existentes

Paginas existentes relevantes:

- `/login`
- `/dashboard`
- `/customers`

Paginas ausentes:

- configuracoes de filial/selecao de origem;
- gestao de transportadoras;
- servicos de transportadora;
- gestao de cobertura;
- tabelas de frete e ranges;
- formulario/resultados de simulacao de frete;
- historico/detalhe de simulacao de frete;
- detalhe de shipment criado a partir de simulacao;
- detalhes de dashboard de simulacao;
- insights de simulacao.

## Posicao Atual De Aceite

O codigo atual suporta login, visualizacao de dashboard basico e manutencao basica de clientes. Ele nao suporta uma simulacao de frete completa. Uma implementacao futura deve construir o dominio e a UI ausentes ao redor da fundacao existente de auth, contexto de tenant, CRUD de clientes e auditoria.
