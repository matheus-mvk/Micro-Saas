# Multi-Tenancy

Status: arquitetura alvo.

## Modelo

O modelo recomendado e multi-tenant pooled: uma infraestrutura compartilhada atende multiplos tenants, com isolamento logico forte em aplicacao, banco, cache, filas, realtime, storage e observabilidade.

Esse modelo reduz custo operacional e simplifica evolucao inicial. Se algum tenant exigir isolamento dedicado por contrato, compliance ou escala, a arquitetura deve permitir mover esse tenant para banco ou ambiente dedicado sem mudar os contratos de dominio.

## Tenant context

O `TenantContext` e criado no inicio da requisicao, job ou conexao realtime e acompanha toda a execucao.

Campos minimos:

- `tenant_id`
- `tenant_slug`
- `plan`
- `region`
- `actor_id`
- `actor_type`
- `permissions`
- `request_id`
- `correlation_id`

Fontes validas para resolucao de tenant:

- claim assinada no token;
- dominio ou subdominio verificado;
- credencial de servico vinculada a tenant;
- parametro administrativo somente em rotas globais protegidas.

Fontes invalidas:

- `tenant_id` no corpo da requisicao comum;
- header arbitrario sem assinatura ou validacao;
- filtro opcional enviado pelo cliente final.

## Isolamento por camada

API:

- Middlewares constroem tenant context antes do handler.
- Handlers nao aceitam tenant arbitrario do payload.
- DTOs nao expoem dados de outros tenants.

Aplicacao:

- Casos de uso recebem tenant context explicitamente.
- Repositorios tenant-scoped exigem tenant context.
- Autorizacao considera tenant, recurso e acao.

Banco:

- Tabelas de negocio possuem `tenant_id`.
- Queries tenant-scoped sempre filtram por `tenant_id`.
- Row-level security pode ser usada como defesa adicional.
- Constraints unicas incluem `tenant_id` quando representam regras por tenant.

Cache:

- Chaves incluem prefixo de tenant.
- Invalidacao nunca usa padrao amplo sem tenant.
- Feature flags e configuracoes sao avaliadas por tenant.

Filas:

- Mensagens carregam `tenant_id` e `correlation_id`.
- Consumidores reconstroem tenant context antes de executar.
- DLQ mantem identificacao de tenant para suporte e auditoria.

Storage:

- Objetos usam prefixo ou bucket segregado por tenant.
- URLs assinadas respeitam permissao e tempo curto de expiracao.
- Metadados de objeto incluem tenant.

Realtime:

- Canais incluem tenant e escopo de recurso.
- Conexoes validam permissao na entrada e em inscricoes.
- Broadcast cross-tenant e proibido por padrao.

Observabilidade:

- Logs, metricas e traces carregam tenant.
- Dashboards permitem visao global e visao por tenant.
- Dados sensiveis nao entram em spans ou logs.

## Provisionamento

Criacao de tenant:

1. criar registro global do tenant;
2. criar configuracoes padrao;
3. criar papeis e permissoes iniciais;
4. criar usuario owner ou convite inicial;
5. preparar integracoes opcionais;
6. emitir evento `tenant.created`;
7. registrar auditoria.

Suspensao:

- bloquear login e tokens novos;
- manter jobs criticos de retencao e billing quando necessario;
- pausar ingestao externa configuravel;
- impedir alteracoes de negocio.

Exclusao:

- aplicar soft delete inicial;
- enfileirar expurgo conforme politica de retencao;
- revogar credenciais e webhooks;
- remover objetos e caches;
- registrar auditoria final.

## Administracao global

Acesso global deve ser excepcional.

Regras:

- exigir permissao administrativa separada;
- registrar motivo;
- registrar tenant alvo;
- registrar antes e depois para mudancas sensiveis;
- limitar acoes por principio de menor privilegio.

## Testes obrigatorios

- Repositorios nao retornam dados de outro tenant.
- Constraints impedem duplicidades indevidas dentro do tenant.
- Cache nao vaza entradas entre tenants.
- Jobs processam mensagens com tenant context correto.
- Canais realtime recusam inscricao sem permissao.
- Rotas administrativas rejeitam uso sem escopo global.
