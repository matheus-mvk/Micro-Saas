# Revisao Final De Seguranca

Data: 2026-07-25

## Correcoes Realizadas

- Rate limiting de login existe via Redis com fallback local.
- Request IDs e correlation IDs agora sao limitados a um padrao seguro de 64 caracteres.
- Seed demo recusa execucao em producao, exceto com `ALLOW_DEMO_SEED=true`.
- Endpoint de dashboard e privado por padrao e tenant-scoped.

## Principais Riscos Restantes

| Risco | Evidencia | Status |
| --- | --- | --- |
| Sala WebSocket por tenant pode ser escolhida pelo cliente | `notifications.gateway.ts` | Nao corrigido |
| OAuth Google/GitHub ausente | Sem provider/callback/controller | Nao implementado |
| MFA/TOTP ausente | Sem modelo/service/controller TOTP | Nao implementado |
| Recuperacao de senha ausente | Sem modelo/service/controller de reset token | Nao implementado |
| Protecao CSRF ausente para mutations autenticadas por cookie | Cookies de auth e fetch com credentials | Nao implementado |
| Access token retornado em JSON | `AuthController.login` | Decisao pendente |
| Matriz RBAC nao aplicada a endpoints de dominio | Sem controllers de dominio | Pendente de implementacao de dominio |

## Orientacao De Demo

Execute somente em localhost com credenciais de desenvolvimento. Nao exponha esta stack publicamente ate CSRF, decisoes OAuth/MFA, auth WebSocket e segredos de producao estarem implementados.
