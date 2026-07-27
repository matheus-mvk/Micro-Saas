# Testing

Backend tests use Vitest with Nest testing utilities and Supertest for e2e health routes.

Frontend tests use Vitest, Testing Library and jsdom. Playwright is configured for future browser e2e coverage.

## Auth Module Tests

Testes adicionados/preparados nesta etapa:

- hash e verificacao de senha;
- assinatura, verificacao e rejeicao de access token invalido;
- hash deterministico de refresh token sem exposicao do token;
- guard privado por padrao usando contexto autenticado confiavel;
- cliente HTTP com `credentials: include`, erro estruturado e resposta vazia;
- login visual com validacao, envio para API e redirect;
- AppShell com usuario, tenant e logout.

Bloqueio local atual:

- `vitest` falha no startup com `SyntaxError: Unexpected token '*'` usando Node `v18.19.1` neste WSL.
- Validar novamente em Node 20+ antes de marcar as skills como `IMPLEMENTED`.
