# Authentication and Security Audit

Data: 2026-07-25

Escopo: auditoria exclusiva do modulo de autenticacao e seguranca. Esta auditoria inspecionou codigo, schema, endpoints, frontend e testes existentes. Nao foram feitas alteracoes funcionais.

## Sumario Executivo

O projeto possui uma primeira implementacao funcional de autenticacao local por e-mail e senha, access token JWT, refresh token opaco, rotacao de refresh token, logout, cookies `HttpOnly`, contexto autenticado e auditoria basica de login/logout/falha.

Ainda nao existem cadastro funcional de usuario, OAuth Google/GitHub, callbacks OAuth, vinculacao de provedores externos, MFA/TOTP, recuperacao de conta, rate limiting, protecao contra brute force, bloqueio temporario, autorizacao por recurso ou testes e2e reais de autenticacao.

O RBAC e o isolamento por tenant estao parcialmente implementados: os guards existem e o contexto autenticado deriva `tenantId`, `userId` e `role` de token verificado + usuario ativo no banco, mas nao ha matriz de permissoes por acao/recurso nem testes cross-tenant.

## Endpoints De Auth Encontrados

| Endpoint | Metodo | Publico | Comportamento real |
| --- | --- | --- | --- |
| `/api/v1/auth/login` | `POST` | Sim, via `@Public()` | Valida DTO, autentica e-mail/senha, gera access token, refresh token, cookies e auditoria de login/falha. |
| `/api/v1/auth/refresh` | `POST` | Sim, via `@Public()` | Le refresh token do cookie, valida sessao, rotaciona refresh token e emite novo access token. |
| `/api/v1/auth/logout` | `POST` | Sim, via `@Public()` | Revoga refresh token atual quando presente e limpa cookies. |
| `/api/v1/auth/me` | `GET` | Nao | Usa guard privado por padrao, resolve usuario autenticado e retorna presenter seguro. |

Arquivos principais:

- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.repository.ts`
- `apps/api/src/modules/auth/auth-token.service.ts`
- `apps/api/src/modules/auth/auth-cookie.service.ts`
- `apps/api/src/modules/auth/auth-context.service.ts`
- `apps/api/src/modules/auth/password.service.ts`
- `apps/api/src/modules/audit/audit.service.ts`
- `apps/api/src/common/guards/private-by-default.guard.ts`
- `apps/api/src/common/guards/roles.guard.ts`
- `apps/api/prisma/schema.prisma`

## Matriz De Auditoria

| Item | Status | Arquivos envolvidos | Comportamento real | Endpoints | Configuracao necessaria | Testes existentes | Riscos | Pendencias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login por e-mail e senha | `IMPLEMENTED` | `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts`, `login.dto.ts`, `password.service.ts`, `schema.prisma` | Normaliza e-mail, aceita `tenantSlug` opcional, busca usuario `ACTIVE` em tenant ativo, valida senha, atualiza `lastLoginAt`, emite tokens e audita sucesso/falha. | `POST /api/v1/auth/login` | `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, expiracoes JWT, cookies/CORS. | Teste web mockado de envio; sem teste backend de login real. | Sem rate limit/brute force; login sem `tenantSlug` so funciona sem ambiguidade de e-mail; erro generico correto, mas sem bloqueio progressivo. | Criar testes unit/integration/e2e do fluxo real e definir politica de tenant no login. |
| Cadastro de usuario | `SCAFFOLDED` | `schema.prisma`, `users.module.ts`, `seed.ts` | Modelo `User` existe e seed cria admin local, mas `UsersModule` esta vazio e nao ha use case/controller de cadastro. | Nenhum. | Banco Prisma. | Nenhum teste de cadastro. | Usuarios so entram via seed/manual DB; sem convite, validacao de papel ou auditoria de criacao funcional. | Implementar convite/cadastro administrativo com tenant, role, auditoria e hash de senha. |
| Hash de senha | `IMPLEMENTED` | `password.service.ts`, `seed.ts`, `password.service.spec.ts`, `schema.prisma` | Usa `scrypt` com salt aleatorio e `timingSafeEqual`; seed grava hash para admin local. | Usado por `POST /auth/login`. | Nenhuma alem de Node `crypto`. | Unitarios para hash, verificacao e formato invalido. | Nao ha parametro de custo configuravel nem politica de migracao de algoritmo. | Documentar politica de upgrade de hash e rejeitar hashes legados em fluxo controlado. |
| JWT access token | `IMPLEMENTED` | `auth-token.service.ts`, `auth-context.service.ts`, `auth.types.ts`, `environment.ts` | Gera e valida JWT HS256 manual com `sub`, `tenantId`, `email`, `role`, `iat`, `exp`, `type=access`; aceita Bearer ou cookie. | Emitido em `login`/`refresh`; validado em rotas privadas como `/auth/me`. | `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`. | Unitario de criacao/verificacao e token malformado. | Implementacao manual nao valida `iss`, `aud`, `jti`, `kid`; access token nao e revogado no logout antes de expirar; token tambem retorna no JSON. | Avaliar biblioteca JWT padrao, claims de issuer/audience, token id e politica de revogacao curta. |
| Refresh token | `IMPLEMENTED` | `auth-token.service.ts`, `auth-cookie.service.ts`, `auth.repository.ts`, `auth.service.ts`, `schema.prisma` | Token opaco aleatorio, armazenado como HMAC SHA-256, enviado por cookie `HttpOnly`; schema tem `familyId`, `expiresAt`, `revokedAt`, `rotatedAt`. | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`. | `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `COOKIE_DOMAIN`. | Unitario cobre hash deterministico sem expor valor; nao cobre persistencia. | Lookup atual e por `tokenHash` sem filtro de tenant; ausencia de binding forte por dispositivo; sem UI de sessoes. | Testar persistencia e avaliar unicidade global ou lookup mais explicito. |
| Rotacao de refresh token | `IMPLEMENTED` | `auth.service.ts`, `auth.repository.ts` | `refresh` revoga token atual e cria novo token na mesma transacao; reutilizacao de token revogado revoga familia. | `POST /auth/refresh`. | Banco Prisma e segredo refresh. | Sem teste especifico de rotacao/reuse. | Concorrencia simultanea de refresh nao tem lock/controle otimista especifico; reuse e auditado genericamente como `AUTH_FAILURE`. | Testar concorrencia, reuse, expiracao e dead session. |
| Revogacao de sessao | `PARTIALLY_IMPLEMENTED` | `auth.service.ts`, `auth.repository.ts`, `auth-cookie.service.ts` | Logout revoga refresh token atual; reuse de refresh revogado revoga familia. | `POST /auth/logout`; indiretamente `POST /auth/refresh`. | Cookie refresh presente. | Sem testes. | Access token continua valido ate expirar; nao ha logout global, revogacao por dispositivo, troca de senha/status/role ou blacklist de access token. | Implementar gerenciamento de sessoes e invalidacao por eventos sensiveis. |
| Logout | `IMPLEMENTED` | `auth.controller.ts`, `auth.service.ts`, `auth-cookie.service.ts`, `audit.service.ts` | Rota publica revoga refresh token se presente, limpa cookies e audita logout quando encontra sessao valida. | `POST /api/v1/auth/logout` | Cookie refresh. | Frontend tem botao/logout no AppShell e teste visual; sem teste backend. | Por ser publico, depende apenas do cookie para revogar; nao audita logout sem sessao encontrada. | Testes HTTP e decisao final sobre exigir ou nao access token valido. |
| OAuth Google | `DOCUMENTED_ONLY` | `environment.ts`, `.env.example`, docs/skills | Existem variaveis `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`, mas nao ha provider, strategy, controller, callback ou persistencia. | Nenhum. | Credenciais Google futuras. | Nenhum. | Variavel pode dar falsa impressao de integracao. | Implementar fluxo OAuth completo e testes. |
| OAuth GitHub | `DOCUMENTED_ONLY` | `environment.ts`, `.env.example`, docs/skills | Existem variaveis `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`, mas nao ha provider, strategy, controller, callback ou persistencia. | Nenhum. | Credenciais GitHub futuras. | Nenhum. | Variavel pode dar falsa impressao de integracao. | Implementar fluxo OAuth completo e testes. |
| Callbacks OAuth | `NOT_IMPLEMENTED` | Nao encontrados em codigo. | Nenhuma rota callback existe. | Nenhum. | N/A. | Nenhum. | Nao ha validacao de `state`, PKCE, origem, account linking ou tratamento de erro OAuth. | Criar endpoints callback por provedor. |
| Vinculacao entre conta local e provedor externo | `NOT_IMPLEMENTED` | `schema.prisma` nao possui tabela de identidade externa. | Nao ha modelo `ExternalAccount`, `IdentityProvider` ou campo equivalente. | Nenhum. | N/A. | Nenhum. | Impossivel vincular/desvincular contas OAuth com seguranca. | Modelar identidade externa com unicidade por provider/providerAccountId e tenant/user. |
| MFA/TOTP | `DOCUMENTED_ONLY` | `environment.ts`, logs redaction, docs/skills | Ha `TOTP_ISSUER` e redaction de `totpSecret`, mas nenhum servico TOTP, segredo, recovery code ou challenge. | Nenhum. | `TOTP_ISSUER` futuro. | Nenhum. | Variavel/documentacao nao implementam MFA. | Modelar secrets, recovery codes, enrollment e validacao. |
| Ativacao/desativacao de MFA | `NOT_IMPLEMENTED` | Nao encontrados em codigo. | Nenhum fluxo de enrollment ou disable. | Nenhum. | N/A. | Nenhum. | Admins acessam sem segundo fator. | Implementar ativacao com confirmacao TOTP e desativacao auditada. |
| Validacao de codigo TOTP | `NOT_IMPLEMENTED` | Nao encontrados em codigo. | Nenhuma validacao de codigo ou janela temporal. | Nenhum. | N/A. | Nenhum. | Nao ha protecao adicional no login. | Implementar validacao com anti-replay/rate limit. |
| Recuperacao de conta | `NOT_IMPLEMENTED` | Nao encontrados em codigo. | Nao ha reset de senha, recovery code MFA, convite ou magic link. | Nenhum. | N/A. | Nenhum. | Contas sem fluxo seguro de recuperacao; risco de processo manual inseguro. | Implementar reset/recuperacao com token de uso unico e auditoria. |
| Protecao contra brute force | `DOCUMENTED_ONLY` | `docs/security/authentication.md`, `.cloud/skills/auth/SKILL.md` | Documentada como pendencia; nenhum guard/interceptor/service funcional. | Nenhum. | Redis poderia ser usado futuramente, mas nao esta integrado a auth. | Nenhum. | Login pode ser tentado indefinidamente. | Implementar rate limit por IP/e-mail/tenant e alertas. |
| Rate limiting | `NOT_IMPLEMENTED` | Nao ha `throttler`, guard, middleware ou Redis counter para auth. | Nenhum limite funcional. | Nenhum. | Redis disponivel, mas nao usado para auth rate limit. | Nenhum. | Risco de abuso, brute force e custo operacional. | Adicionar limite por endpoint sensivel e testes. |
| Bloqueio temporario | `DOCUMENTED_ONLY` | `docs/security/authentication.md` | Bloqueio progressivo e documentado, sem campos no schema ou logica no login. | Nenhum. | N/A. | Nenhum. | Falhas repetidas nao afetam a conta/IP. | Definir lockout por IP/e-mail/tenant com janela e desbloqueio auditado. |
| RBAC | `PARTIALLY_IMPLEMENTED` | `roles.guard.ts`, `roles.decorator.ts`, `app.module.ts`, `request-context.ts`, `packages/shared/src/index.ts` | `RolesGuard` compara `request.context.role` com roles declaradas via `@Roles`; guard global registrado. Nenhum endpoint de negocio usa `@Roles` ainda. | Nenhum endpoint auth usa role especifica; `/auth/me` so exige autenticacao. | Access token precisa conter role verificada. | Unitarios diretos para `PrivateByDefaultGuard`, nao para `RolesGuard`. | Sem matriz de permissao, sem autorizacao por acao/recurso/ownership, sem testes. | Implementar politicas por modulo e testes de 403. |
| Isolamento por tenant | `PARTIALLY_IMPLEMENTED` | `auth-context.service.ts`, `auth.repository.ts`, `request-context.middleware.ts`, `schema.prisma`, `CurrentTenant` decorator | Middleware nao aceita mais headers de identidade; guard resolve user/tenant por token e usuario ativo; schema tem `tenantId` em entidades principais. | Aplicado em rotas privadas, incluindo `/auth/me`. | Access token valido e usuario ativo com tenant ativo. | Unitario de guard com contexto mockado; sem teste cross-tenant real. | Sem CRUD tenant-scoped para provar filtros; refresh lookup nao filtra tenant; constantes antigas de headers ainda existem. | Criar testes de acesso cruzado e padronizar repositories tenant-scoped. |
| Auditoria de login e logout | `PARTIALLY_IMPLEMENTED` | `audit.service.ts`, `auth.service.ts`, `schema.prisma` | Login sucesso grava `LOGIN`; falha grava `AUTH_FAILURE`; logout grava `LOGOUT` quando encontra sessao valida; usa `requestId`, tenant/actor quando conhecidos e hash de IP. | `POST /auth/login`, `POST /auth/logout`; falhas de `refresh` usam `AUTH_FAILURE`. | Banco e Prisma. | Nenhum teste de auditoria. | Falha de auditoria pode quebrar login; reuse de refresh nao tem acao especifica; nao ha consulta/retencao/redaction before/after. | Testar auditoria e definir politica fail-open/fail-closed. |
| Testes unitarios | `PARTIALLY_IMPLEMENTED` | `password.service.spec.ts`, `auth-token.service.spec.ts`, `private-by-default.guard.spec.ts`, specs comuns | Cobrem senha, token, hash refresh e guard privado de forma isolada. | N/A. | Vitest. | Existem, mas em auditoria anterior `vitest` local falhou no startup com Node 18; esta auditoria nao executou testes. | Cobertura baixa de `AuthService`, `AuthRepository`, cookies, auditoria e RBAC. | Adicionar unitarios dos casos de uso de auth. |
| Testes de integracao | `NOT_IMPLEMENTED` | `apps/api/test/health.e2e-spec.ts` apenas health com doubles | Nao ha teste de auth com Nest + Prisma/test database. | N/A. | Banco de teste e Vitest/Supertest. | Apenas health e2e controlado; nao cobre auth. | Fluxos reais de banco/cookie podem quebrar sem deteccao. | Criar testes de login/refresh/logout/me com banco controlado. |
| Testes e2e | `NOT_IMPLEMENTED` | `apps/api/test/health.e2e-spec.ts`, `apps/web/tests/e2e/home.spec.ts` | E2E existente cobre health e landing publica, nao autentica usuario. | N/A. | Playwright/Supertest + ambiente de teste. | Nenhum e2e auth. | Regressao de login, cookie, rota protegida e tenant context nao seria capturada. | Criar e2e de visitante -> login -> dashboard -> refresh -> logout. |

## Evidencias Funcionais

### Login local

Fluxo real:

1. `AuthController.login` recebe `LoginDto`.
2. `AuthService.login` normaliza e-mail e usa `AuthRepository.findActiveLoginCandidates`.
3. O repository filtra usuario por e-mail, `UserStatus.ACTIVE` e tenant ativo.
4. `PasswordService.verify` valida hash `scrypt`.
5. `AuthTokenService.createAccessToken` gera access token.
6. `AuthTokenService.createRefreshToken` gera refresh token opaco.
7. `AuthRepository.createRefreshToken` persiste hash do refresh token.
8. `AuditService.record` grava `LOGIN`.
9. `AuthCookieService.setAuthCookies` envia cookies `nf_access_token` e `nf_refresh_token`.

### Contexto autenticado

Fluxo real:

1. `PrivateByDefaultGuard` bloqueia rotas sem `@Public()`.
2. `AuthContextService` le Bearer token ou cookie `nf_access_token`.
3. O token e validado em `AuthTokenService.verifyAccessToken`.
4. O usuario e reconsultado por `id + tenantId`, status `ACTIVE` e tenant ativo.
5. `request.context.tenantId`, `userId`, `role` e `user` sao preenchidos a partir do banco.

### Refresh rotation

Fluxo real:

1. `AuthController.refresh` le `nf_refresh_token`.
2. `AuthService.getValidRefreshSession` busca refresh token por hash.
3. Se token estiver revogado, chama `revokeRefreshTokenFamily`.
4. Se valido, `AuthRepository.rotateRefreshToken` revoga o token atual e cria novo token na mesma transacao.
5. Novos cookies sao emitidos.

## O Que E Apenas Visual

- Login page e formulario existem no frontend, mas dependem da API e nao provam backend funcionando sozinhos.
- Dashboard protegido no frontend usa `/auth/me`, mas protecao de seguranca real esta na API.
- Nao ha botoes ou telas funcionais de OAuth, MFA, cadastro, recuperacao ou gerenciamento de sessoes.

## O Que E Apenas Estrutura

- `UsersModule` existe, mas esta vazio.
- Variaveis `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` existem, mas sem implementacao OAuth.
- `TOTP_ISSUER` existe, mas sem implementacao TOTP.
- `RolesGuard` e `@Roles()` existem, mas nenhum endpoint de negocio usa uma matriz real de permissoes.
- Modelos `User`, `RefreshToken` e `AuditLog` existem e sustentam parte do modulo; nao sustentam OAuth/MFA/recuperacao.

## Principais Riscos

1. Sem rate limiting e brute force protection no login.
2. Sem CSRF dedicado para mutacoes autenticadas por cookie.
3. Sem e2e de autenticação real.
4. Access token continua valido ate expirar apos logout.
5. JWT e implementado manualmente e nao possui `iss`, `aud`, `jti` ou rotacao de chave.
6. Sem OAuth/MFA/recuperacao de conta, apesar de variaveis e documentacao existirem.
7. RBAC ainda e role-only e nao cobre recurso, acao, filial ou ownership.
8. Auditoria existe para auth basico, mas nao tem testes nem politica clara quando a escrita de auditoria falha.

## Ordem Recomendada De Implementacao

1. Criar testes de integracao/e2e de auth atual antes de expandir o modulo.
2. Implementar rate limiting e protecao contra brute force usando Redis.
3. Adicionar CSRF para mutacoes baseadas em cookie.
4. Implementar cadastro/convite de usuario com auditoria e politicas RBAC.
5. Endurecer JWT e sessao: `iss`, `aud`, `jti`, gerenciamento de dispositivos, logout global e invalidacao por mudanca de senha/role/status.
6. Implementar recuperacao de conta.
7. Implementar MFA/TOTP com ativacao, validacao, desativacao e recovery codes.
8. Implementar OAuth Google e GitHub com callbacks, `state`, PKCE quando aplicavel e vinculacao de conta externa.
9. Expandir RBAC para politicas por recurso e testes cross-tenant.

