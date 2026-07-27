# Matriz Final De Conformidade

Data: 2026-07-25

| Requisito original | Modulo | Tela | Endpoint | Tabela | Testes | Seguranca | Tenant | Performance | Responsividade | Acessibilidade | Dados demo | Docs | Status | Evidencia | Limitacao |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Landing page | Web publica | `/` | nenhum | nenhum | smoke | publico | N/A | estatico | CSS responsivo | semantica basica | N/A | sim | `PARTIALLY_COMPLETED` | `page.tsx` | Faltam varias secoes obrigatorias |
| Login e-mail/senha | Auth | `/login` | `/auth/login` | `users`, `refresh_tokens`, `audit_logs` | unit parcial, web mockado | cookies/rate limit parcial | tenant resolvido pelo usuario | busca limitada | sim | labels/erros | admin seedado | sim | `PARTIALLY_COMPLETED` | arquivos auth | Nenhum teste de integracao backend executado |
| Dashboard | Dashboard | `/dashboard` | `/dashboard/summary` | tabelas atuais de fundacao | somente typecheck | privado por padrao | filtrado por tenant | aggregate/count queries | cards responsivos | loading/error/empty | seed adicionada | sim | `PARTIALLY_COMPLETED` | service/UI do dashboard | Limitado pela ausencia de modelos de dominio |
| Multi-tenancy | Shared | shell | auth/me/dashboard | tabelas tenant-scoped | faltam testes cross-tenant | contexto tenant por token | parcial | indices existem | N/A | N/A | dois tenants | sim | `PARTIALLY_COMPLETED` | schema/auth/dashboard | Sem cobertura de CRUDs de negocio |
| Usuarios | Users | nenhuma | nenhuma | `users` | nenhum | apenas role enum | tabela tem tenant | indexado | nenhuma | nenhuma | usuarios na seed | parcial | `PARTIALLY_COMPLETED` | seed/schema | Sem CRUD/convites/MFA/UI de sessoes |
| Clientes | Customers | nenhuma | nenhuma | `customers` | nenhum | nenhuma | tabela tem tenant | indexado | nenhuma | nenhuma | cliente na seed | parcial | `PARTIALLY_COMPLETED` | seed/schema | Sem enderecos/CRUD/UI |
| Transportadoras | Carriers | nenhuma | nenhuma | `carriers` | nenhum | nenhuma | tabela tem tenant | indexado | nenhuma | nenhuma | transportadora na seed | parcial | `PARTIALLY_COMPLETED` | seed/schema | Sem servicos/tabelas/UI |
| Simulacao de frete | Freight | apenas metrica no dashboard | nenhum | `freight_simulations` | nenhum | nenhuma | tabela tem tenant | indices route/status | nenhuma | nenhuma | simulacao na seed | parcial | `PARTIALLY_COMPLETED` | seed/schema | Sem calculo/opcoes/historico |
| Imports/async/realtime | Imports | nav desabilitada | nenhum | `import_jobs` | nenhum | scaffold realtime inseguro | tabela tem tenant | index status | nenhuma | nenhuma | import job na seed | parcial | `PARTIALLY_COMPLETED` | seed/schema | Sem upload, worker ou realtime |
| Shipments/tracking | Shipments/tracking | nenhuma | nenhuma | nenhuma | nenhum | nenhuma | nenhuma | nenhuma | nenhuma | nenhuma | nenhum | parcial | `NOT_COMPLETED` | modelos ausentes | Nao implementado |
| Insights | Insights | nenhuma | nenhuma | nenhuma | nenhum | nenhuma | nenhuma | nenhuma | nenhuma | nenhuma | nenhum | parcial | `NOT_COMPLETED` | modulo vazio | Nao implementado |
| OAuth/MFA/recovery | Auth | nenhuma | nenhuma | nenhuma | nenhum | nenhuma | nenhuma | nenhuma | nenhuma | nenhuma | nenhum | parcial | `NOT_COMPLETED` | sem codigo | Requer implementacao e configuracao externa |
| Deploy | Infraestrutura | N/A | health | MySQL/Redis | nao totalmente executado | somente localhost | N/A | compose health | N/A | N/A | seed | sim | `PARTIALLY_COMPLETED` | arquivos Docker | Docker nao validado a partir deste WSL |
