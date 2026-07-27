# Authentication

## Objetivo

Garantir que toda identidade usada na plataforma seja verificavel, rastreavel e limitada ao tenant ou escopo operacional correto.

## Regras obrigatorias

1. Endpoints privados devem exigir autenticacao antes de qualquer regra de negocio.
2. A identidade autenticada deve incluir `actor_id`, tenant ativo, metodo de login, papeis efetivos e tempo de autenticacao.
3. Tokens e sessoes nao devem carregar permissoes como fonte unica de verdade quando permissoes puderem ser revogadas durante a sessao.
4. Contas internas e contas de tenant devem ter dominios de permissao separados.
5. Login administrativo deve exigir MFA quando houver acesso a dados de multiplos tenants, billing, permissoes, exportacoes ou configuracao global.
6. Reset de senha, convites e magic links devem expirar rapidamente e ser de uso unico.
7. Erros de login nao devem indicar se email, tenant ou usuario existem.
8. Tokens de API e chaves de integracao devem ser tratados como credenciais independentes, com dono, tenant, escopo, expiracao e rotacao.

## Sessoes e tokens

- Preferir cookies `HttpOnly`, `Secure` e `SameSite=Lax` ou `Strict` para sessoes web.
- Tokens bearer devem ter vida curta e nunca ser salvos em storage acessivel por JavaScript quando houver alternativa segura.
- Refresh tokens devem ser rotacionados e invalidados em logout, troca de senha, revogacao de usuario e suspeita de abuso.
- Mudancas de papel, tenant, status de conta ou MFA devem invalidar sessoes afetadas.
- Tokens devem ser assinados com algoritmo forte e chave gerenciada em cofre.

## Multi-tenant authentication

- O tenant ativo deve ser resolvido por fonte confiavel: subdominio validado, membership do usuario, selecao server-side ou claim verificada.
- O cliente pode sugerir tenant, mas o backend deve confirmar membership antes de aceitar.
- Usuarios com acesso a multiplos tenants devem alternar contexto por fluxo explicito e auditavel.
- Convites devem ser vinculados a tenant, papel maximo permitido e email de destino.

## Protecoes contra abuso

- Rate limit por IP, usuario, email normalizado, tenant e endpoint sensivel.
- Bloqueio progressivo ou desafio adicional apos falhas repetidas.
- Deteccao de login impossivel, troca de dispositivo incomum e uso anormal de token.
- Protecao CSRF para fluxos baseados em cookie.
- Validacao de origem em callbacks OAuth e webhooks de identidade.

## Eventos de auditoria

Registrar, sem segredos:

- login bem-sucedido e falho;
- logout;
- refresh token reutilizado;
- criacao, aceitacao, expiracao e revogacao de convite;
- reset de senha solicitado e concluido;
- MFA ativado, removido ou usado;
- criacao, rotacao e revogacao de token de API;
- troca de tenant ativo.

## Implementacao Atual Do Modulo 1

Status: parcialmente implementado em codigo, pendente de validacao completa de testes/build no ambiente local.

Rotas implementadas:

- `POST /api/v1/auth/login`: rota publica, valida e-mail e senha, exige usuario `ACTIVE` e tenant ativo, gera access token curto e refresh token opaco.
- `POST /api/v1/auth/refresh`: rota publica, le refresh token via cookie `HttpOnly`, rotaciona o token e revoga o token anterior.
- `POST /api/v1/auth/logout`: rota publica por decisao explicita para permitir encerramento mesmo com access token expirado; revoga o refresh token do cookie presente e limpa cookies.
- `GET /api/v1/auth/me`: rota privada, retorna somente dados seguros do usuario autenticado.
- `GET /api/v1/auth/oauth/:provider/start`: inicia login, registro ou vinculacao OAuth com state de uso unico.
- `GET /api/v1/auth/oauth/:provider/callback`: valida callback Google/GitHub e aplica linking, MFA ou bloqueio de aprovacao.
- `POST /api/v1/auth/oauth/complete-registration`: vincula usuario OAuth `INCOMPLETE` a um tenant existente e muda o status para `PENDING`.
- `POST /api/v1/auth/mfa/setup`, `/confirm`, `/login/verify`: cobrem ativacao TOTP, codigos de recuperacao e desafio de login.

Decisoes atuais:

- Senhas usam hash `scrypt` com salt aleatorio via `node:crypto`.
- Refresh tokens sao opacos, armazenados somente como HMAC SHA-256.
- Access token usa JWT HS256 de curta duracao e tambem e enviado em cookie `HttpOnly`.
- `tenantId`, `userId` e `role` sao derivados do token verificado e do usuario ativo no banco.
- Headers `x-tenant-id`, `x-user-id` e `x-user-role` nao sao mais fonte de identidade.
- Erro de login e generico para reduzir enumeracao.
- Usuarios `INCOMPLETE`, `PENDING`, `BLOCKED`, `DISABLED` e `DELETED` nao recebem JWT final.
- OAuth publico cria cadastro incompleto e exige aprovacao administrativa antes do acesso ao tenant.
- Usuarios com MFA ativo recebem token temporario de desafio; a sessao final so e emitida apos TOTP ou codigo de recuperacao valido.

Pendencias:

- CSRF dedicado para mutacoes baseadas em cookie.
- Invalidacao automatica de sessoes em troca de senha, papel, status ou MFA.
- Validacao externa real depende das credenciais OAuth configuradas por ambiente.
