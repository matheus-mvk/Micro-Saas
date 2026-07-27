# Banco de Dados

Status: arquitetura alvo.

## Escolha base

O banco transacional principal deve ser MySQL, conforme requisito do desafio, por causa de:

- integridade referencial forte;
- transacoes ACID;
- bons recursos de particionamento e indices;
- suporte a colunas `JSON` para metadados controlados;
- operacao ampla em ambientes gerenciados e containers locais.

Armazenamentos complementares podem existir para busca, cache, objetos e series temporais, mas o registro transacional autoritativo permanece no banco principal.

## Modelo multi-tenant

Modelo recomendado: banco compartilhado com tabelas particionadas logicamente por `tenant_id`.

Regras:

- Tabelas de negocio possuem `tenant_id` `NOT NULL`.
- Chaves unicas de negocio incluem `tenant_id`.
- Consultas de negocio filtram por `tenant_id` antes de qualquer filtro opcional.
- Relacionamentos entre tabelas tenant-scoped nao cruzam tenants.
- Cadastros globais devem ser poucos, nomeados explicitamente e revisados.

Exemplos de tabelas globais:

- `tenants`
- `plans`
- `global_feature_flags`
- `integration_catalog`

Exemplos de tabelas tenant-scoped:

- `users`
- `shipments`
- `stops`
- `routes`
- `vehicles`
- `drivers`
- `tracking_events`
- `alerts`
- `notification_preferences`

## Chaves

- Usar identificadores opacos, como UUID ou ULID, em recursos expostos pela API.
- Evitar ids sequenciais expostos publicamente.
- Usar constraints de unicidade compostas, como `(tenant_id, external_id, provider)`.
- Foreign keys tenant-scoped devem preservar o mesmo `tenant_id` dos registros relacionados.

## Migracoes

- Migracoes sao versionadas, pequenas e reversiveis quando viavel.
- DDL de alto impacto deve ser planejado para execucao online.
- Backfills devem rodar em lotes, com checkpoint e metricas.
- Campos obrigatorios novos seguem fluxo seguro:
  1. adicionar coluna nullable;
  2. preencher dados existentes;
  3. liberar codigo que escreve a coluna;
  4. validar consistencia;
  5. aplicar `NOT NULL` ou constraint.

## Indices

Indices devem refletir consultas reais. Para tabelas tenant-scoped, o prefixo mais comum e `tenant_id`.

Padroes:

- Listagens operacionais: `(tenant_id, status, created_at DESC)`.
- Busca por integracao externa: `(tenant_id, provider, external_id)`.
- Eventos recentes: `(tenant_id, occurred_at DESC)`.
- Jobs pendentes: `(status, scheduled_at)` com condicoes parciais quando aplicavel.
- Outbox: `(published_at, created_at)` ou indice parcial para registros nao publicados.

## Eventos logisticos e volume

Eventos de rastreamento e telemetria tendem a crescer rapidamente.

Recomendacoes:

- particionar por tempo quando a tabela atingir alto volume;
- manter retencao configuravel por tenant e plano;
- separar evento bruto de evento normalizado;
- evitar agregacoes pesadas em requisicoes sincronas;
- materializar leituras frequentes em tabelas de projecao.

## Transacoes e outbox

Toda escrita que precise disparar efeito externo deve gravar o evento em uma tabela de outbox na mesma transacao da mudanca principal.

Fluxo:

1. Caso de uso altera entidades.
2. Caso de uso grava eventos na outbox.
3. Transacao confirma.
4. Worker publica eventos no broker.
5. Worker marca eventos como publicados.

Esse padrao evita que uma escrita confirmada deixe de publicar evento ou que um evento seja publicado para uma escrita revertida.

## Integridade e concorrencia

- Preferir constraints de banco para invariantes criticas.
- Usar optimistic locking para atualizacoes concorrentes de recursos operacionais.
- Usar locks explicitos apenas em fluxos curtos e bem delimitados.
- Jobs concorrentes devem usar lease, `FOR UPDATE SKIP LOCKED` ou mecanismo equivalente.
- Reprocessamentos precisam ser idempotentes.

## Dados sensiveis

- PII e dados sensiveis devem ter classificacao explicita.
- Dados sensiveis em logs sao proibidos.
- Criptografia em repouso deve ser configurada na infraestrutura.
- Campos especialmente sensiveis podem exigir criptografia em nivel de aplicacao.
- Retencao e expurgo seguem politica por tipo de dado e requisito legal.
