# Logging and Audit

## Objetivo

Gerar evidencias uteis para operacao, investigacao e conformidade sem expor dados sensiveis nem criar canal de vazamento entre tenants.

## Regras obrigatorias

1. Logs devem incluir timestamp, ambiente, servico, request id, tenant id quando aplicavel e sujeito autenticado quando seguro.
2. Logs nao devem incluir senhas, tokens, cookies, chaves de API, authorization headers, refresh tokens ou secrets.
3. Payloads completos de requisicao e resposta nao devem ser logados por padrao.
4. PII e dados comerciais sensiveis devem ser mascarados, omitidos ou agregados.
5. Logs devem ser separados por ambiente e protegidos por controle de acesso.
6. Acesso a logs de producao deve ser restrito, auditado e revisado.
7. Eventos de auditoria nao devem depender apenas de logs tecnicos volateis.
8. Retencao deve respeitar necessidade operacional, contratos e regulacao aplicavel.

## Eventos de auditoria obrigatorios

- Login, logout, falha de login e eventos de MFA.
- Criacao, alteracao, desativacao e exclusao de usuarios.
- Convites criados, aceitos, expirados e revogados.
- Alteracao de papeis e permissoes.
- Troca de tenant ativo.
- Acesso interno cross-tenant.
- Upload, importacao, exportacao, download e reprocessamento.
- Alteracao de configuracoes de tenant.
- Criacao, rotacao e revogacao de tokens de API.
- Alteracao de integracoes e webhooks.
- Exclusao ou anonimizacao de dados.

## Campos recomendados de auditoria

- `event_id`
- `event_type`
- `occurred_at`
- `actor_type`
- `actor_id`
- `tenant_id`
- `target_type`
- `target_id`
- `action`
- `result`
- `source_ip`
- `user_agent`
- `request_id`
- `reason` quando operador interno agir sobre tenant

## Dados proibidos em logs

- Senhas, hashes de senha e respostas de recuperacao.
- Tokens de sessao, refresh tokens e API keys.
- Cookies e headers de autorizacao.
- Documentos pessoais completos.
- Dados bancarios e pagamento.
- Arquivos importados ou exportados em bruto.
- Prompts e respostas de IA contendo dados privados, salvo ambiente controlado e mascarado.
- URLs assinadas completas.

## Monitoramento

Alertar para:

- muitas falhas de login;
- refresh token reutilizado;
- aumento anormal de exportacoes;
- acesso interno cross-tenant fora de janela esperada;
- volume incomum de uploads;
- erros de autorizacao cross-tenant;
- criacao excessiva de tokens de API;
- uso de integracao fora do padrao;
- consultas caras ou jobs com custo anormal.

## Auth Logging Policy

Fluxos de autenticacao nao devem registrar:

- senha;
- access token;
- refresh token;
- cookies;
- segredos OAuth;
- codigos ou seeds MFA.

Eventos de login, logout e falha sao registrados em `AuditLog` com `requestId`, tenant quando conhecido, actor quando conhecido, resultado e hash de IP quando disponivel. Logs tecnicos continuam sendo usados para observabilidade, mas nao substituem auditoria persistente.
