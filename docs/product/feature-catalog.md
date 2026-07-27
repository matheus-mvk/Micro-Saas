# Catalogo de Funcionalidades

Este catalogo resume as funcionalidades implementadas ou preparadas para avaliacao da Plataforma de Inteligencia Logistica. Ele conecta dominio, rotas Web, endpoints API, persistencia principal e perfis de acesso.

## Perfis

Perfis reais do projeto:

- `ADMIN`: administra tenant, usuarios, cadastros, operacoes, auditoria e configuracoes.
- `MANAGER`: opera visoes gerenciais, cadastros logisticos, simulacoes, historico, dashboard e insights.
- `OPERATOR`: executa atividades operacionais como simulacao, acompanhamento de shipments, imports e tracking conforme rota autorizada.

A matriz detalhada de acesso esta em `docs/security/access-control-matrix.md`.

## Funcionalidades

| Dominio | Web | API | Persistencia principal | Acesso | Observacoes |
| --- | --- | --- | --- | --- | --- |
| Landing page publica | `/` | N/A | N/A | Publico | Apresentacao comercial do produto, CTAs e narrativa visual. |
| Registro B2B por e-mail | `/register` | `POST /auth/register` | `tenants`, `users`, `tenant_settings`, `tenant_onboarding` | Publico | Cria tenant e primeiro usuario `ADMIN`. |
| Login e sessao | `/login` | `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` | `users`, `refresh_tokens`, `audit_logs` | Publico/Autenticado | Cookies HttpOnly, JWT curto e refresh token rotativo. |
| OAuth Google/GitHub | `/login`, `/register`, `/completar-cadastro` | `/auth/oauth/*` | `oauth_accounts`, `users`, `audit_logs` | Publico/Autenticado | Fluxo publico cria usuario incompleto e exige aprovacao. |
| MFA/TOTP | `/settings/profile` | `/auth/mfa/*` | `users`, `mfa_challenges`, `mfa_recovery_codes` | Autenticado | Setup, confirmacao, desafio de login e codigos de recuperacao. |
| Onboarding do tenant | `/onboarding` | `/auth/onboarding` | `tenant_onboarding`, `tenant_settings` | Autenticado | Marca etapas iniciais e conclui configuracao essencial. |
| Empresa/tenant | `/settings/company` | `/auth/me`, `/auth/onboarding` | `tenants`, `tenant_onboarding` | Autenticado | Exibe dados do tenant ativo e links de configuracao. |
| Usuarios e convites | `/users` | `/users`, convites e aprovacao | `users`, `user_invitations`, `audit_logs` | `ADMIN` | Controle de perfil, status e aprovacao B2B. |
| Perfil e seguranca | `/settings/profile` | `/auth/profile`, `/auth/password`, `/auth/sessions`, `/auth/oauth/profile/*` | `users`, `refresh_tokens`, `oauth_accounts` | Autenticado | Dados pessoais, senha, MFA e provedores vinculados. |
| Clientes | `/customers` | `/customers` | `customers`, `customer_addresses` | `ADMIN`, `MANAGER`, `OPERATOR` conforme matriz | Cadastro, listagem e dados tenant-scoped. |
| Filiais | `/branches`, `/branches/new`, `/branches/:id` | `/branches` | `branches` | `ADMIN`, `MANAGER` | Cadastro e manutencao das unidades do tenant. |
| Transportadoras | `/carriers`, `/carriers/new`, `/carriers/:id` | `/carriers` | `carriers`, `carrier_services` | `ADMIN`, `MANAGER` | Cadastro, servicos e logo upload. |
| Coberturas | `/coverages` | `/coverages` | `carrier_coverages` | `ADMIN`, `MANAGER` | Regra de elegibilidade de transportadoras por regiao/CEP. |
| Tabelas de frete | `/freight-tables`, `/freight-tables/new`, `/freight-tables/:id` | `/freight-rate-tables` | `freight_rate_tables`, faixas e componentes | `ADMIN`, `MANAGER` | Base configuravel para precificacao deterministica. |
| Simulacao de frete | `/freight/simulate` | `/freight-simulations` | `freight_simulations`, `freight_simulation_options`, componentes | `ADMIN`, `MANAGER`, `OPERATOR` | Origem, destino, volumes, valor da carga, opcoes elegiveis e breakdown. |
| Historico de fretes | `/freight/history` | `/freight-simulations`, detalhes e selecao | `freight_simulations`, `freight_simulation_options` | `ADMIN`, `MANAGER`, `OPERATOR` | Consulta simulacoes, opcoes e conversao em shipment. |
| Shipments/tracking | `/shipments`, `/shipments/:id` | `/shipments`, `/shipments/:id/tracking-events`, `/shipments/:id/status` | `shipments`, `tracking_events` | `ADMIN`, `MANAGER`, `OPERATOR` | Acompanhamento operacional, timeline e mudanca de status. |
| Dashboard | `/dashboard` | `/dashboard/summary` | agregacoes sobre simulacoes, shipments, imports e cadastros | `ADMIN`, `MANAGER`, `OPERATOR` | KPIs tenant-scoped para decisao operacional. |
| Insights | `/insights` | `/insights`, `/insights/summary`, `/insights/refresh`, read/dismiss | `insights`, `audit_logs` | `ADMIN`, `MANAGER`, `OPERATOR` | Regras deterministicas baseadas nos dados do tenant. |
| Imports CSV/XLSX | `/imports`, `/imports/new`, `/imports/:id` | `/imports/preview`, `/imports`, retry/cancel/errors.csv | `import_jobs`, `import_row_results` | conforme matriz | Upload, validacao, fila BullMQ e relatorio de erros. |
| Auditoria | `/audit` | `/audit-logs` | `audit_logs` | `ADMIN` | Rastreabilidade de acoes sensiveis. |
| Realtime | Dashboard/imports/tracking | Socket.IO `/realtime` | Redis/Socket.IO + eventos de dominio | Autenticado | Sala por tenant e invalidacao/refresh de visoes. |

## Dados de demonstracao

A seed cria tenants e dados para demonstracao, incluindo usuarios por perfil. A referencia completa esta em `docs/development/demo-seed.md` e `docs/development/access-test-accounts.md`.

Contas principais:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| `ADMIN` | `administrador@dev.com` | `@DEV1512` |
| `ADMIN` | `admin.test@dev.com` | `@DEV1512` |
| `MANAGER` | `manager.test@dev.com` | `@DEV1512` |
| `OPERATOR` | `operator.test@dev.com` | `@DEV1512` |

## Relacao com o desafio

Este catalogo cobre a exigencia de plataforma administrativa autenticada, separacao de niveis de acesso, funcionalidades logisticas minimas, dashboard, insights, upload, historico, auditoria, realtime e demonstracao multi-tenant.
