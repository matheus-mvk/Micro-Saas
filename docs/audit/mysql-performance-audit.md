# Auditoria De Performance MySQL

Data: 2026-07-25

Papel revisor: Senior MySQL Database Analyst and Performance Engineer.

## Resumo

O schema atual e um schema de fundacao, nao o schema completo da plataforma logistica. Ele contem tabelas de tenant, filial, usuario, refresh token, cliente, transportadora, simulacao de frete, import job e audit log. Ainda nao contem enderecos de clientes, servicos de transportadora, tabelas de frete, opcoes de simulacao, shipments, pacotes, eventos de tracking, linhas de importacao ou insights.

## Achados E Alteracoes

| Area | Achado | Alteracao | Evidencia | Status |
| --- | --- | --- | --- | --- |
| Compatibilidade de migration | MySQL rejeitou o nome de indice gerado `freight_simulations_tenant_id_origin_postal_code_destination_postal_code_idx` por exceder o limite de identificador | Renomeado para `freight_simulations_tenant_route_idx` no schema e na migration | `schema.prisma`, `20260718150000_init/migration.sql` | Corrigido |
| Resumo do dashboard | Dashboard anteriormente nao tinha query backend e usava constantes frontend | Adicionado `GET /dashboard/summary` com contagens tenant-scoped usando transacao Prisma | `DashboardService.getSummary` | Corrigido para metricas de fundacao |
| Isolamento de tenant | Todas as queries do dashboard filtram por `tenantId` | Implementado em cada count/aggregate | `dashboard.service.ts` | Corrigido para novo endpoint |
| Busca de refresh token | Repository busca por `tokenHash`, enquanto unicidade do schema e `(tenantId, tokenHash)` | Nenhuma alteracao estrutural ainda | `auth.repository.ts`, `schema.prisma` | Pendente |
| Idempotencia da seed | Usuarios principais eram idempotentes; dados demo operacionais estavam ausentes | Adicionados customer, carrier, freight simulation, import job e audit log idempotentes usando chaves unicas ou IDs fixos | `seed.ts` | Melhorado |
| Seguranca da seed em producao | Seed podia rodar em producao | Adicionado guard `NODE_ENV=production` exigindo `ALLOW_DEMO_SEED=true` | `seed.ts`, `.env.example` | Corrigido |

## Revisao De Indices

Indices uteis existentes:

- `branches(tenant_id, active)`
- `users(tenant_id, status)`
- `users(tenant_id, role)`
- `refresh_tokens(tenant_id, user_id, revoked_at)`
- `customers(tenant_id, active, name)`
- `carriers(tenant_id, active, name)`
- `freight_simulations(tenant_id, status, created_at)`
- `freight_simulations(tenant_id, origin_postal_code, destination_postal_code)`
- `import_jobs(tenant_id, status, created_at)`
- `audit_logs(tenant_id, action, created_at)`

Nenhum indice foi removido. Um indice foi renomeado por compatibilidade com MySQL.

## Estruturas Criticas Ausentes

O desafio original nao pode ser concluido somente com o schema atual. Modelos ausentes incluem servicos de transportadora, tabelas de frete, versoes de tabela de frete, opcoes de simulacao, shipments, snapshots de shipment, eventos de tracking, linhas de importacao, insights e estruturas de gestao MFA/OAuth/sessoes.

## Nota De Recuperacao De Migration Parcial

Se a primeira migration falhou depois de criar algumas tabelas, nao rode `migrate reset` nem remova volumes, exceto quando o banco for explicitamente descartavel. Para recuperacao local, crie manualmente as tabelas ausentes a partir do SQL de migration corrigido e depois use Prisma migrate resolve conforme a documentacao do Prisma, ou comece com um banco de desenvolvimento limpo sem dados valiosos.
