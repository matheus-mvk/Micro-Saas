# Observabilidade

Status: arquitetura alvo.

## Objetivo

Observabilidade deve permitir responder rapidamente:

- qual tenant foi afetado;
- qual usuario, servico ou job iniciou a acao;
- qual recurso logistico foi impactado;
- qual dependencia falhou;
- se o problema e isolado, regional, por tenant ou global;
- quanto o erro afeta experiencia, SLA ou faturamento.

## Contexto padrao

Todo log, metrica e trace deve carregar, quando disponivel:

- `service`
- `environment`
- `version`
- `tenant_id`
- `actor_id`
- `actor_type`
- `request_id`
- `correlation_id`
- `operation`
- `resource_type`
- `resource_id`

PII, tokens, payloads completos de integracoes e segredos nao devem ser registrados.

## Logs

Padrao:

- logs estruturados em JSON;
- nivel `INFO` para eventos operacionais importantes;
- nivel `WARN` para recuperacoes, retries e degradacoes;
- nivel `ERROR` para falhas que exigem acao ou produzem erro ao usuario;
- nivel `DEBUG` somente em ambiente controlado ou amostrado.

Eventos de log importantes:

- autenticacao recusada;
- autorizacao recusada;
- criacao, suspensao e exclusao de tenant;
- mudancas administrativas sensiveis;
- falha de integracao externa;
- entrada e saida de DLQ;
- reprocessamento manual;
- rejeicao por quota ou rate limit.

## Metricas

Metricas tecnicas:

- latencia de API por rota e status;
- taxa de erro por rota;
- throughput por endpoint;
- conexoes realtime ativas;
- mensagens realtime enviadas e descartadas;
- lag de fila;
- tempo de processamento de job;
- tentativas e DLQ por consumidor;
- saturacao de banco, cache e broker.

Metricas de negocio:

- embarques criados;
- eventos de rastreamento recebidos;
- alertas gerados;
- notificacoes entregues;
- integracoes ativas;
- uso por tenant e por plano;
- calculos de ETA executados;
- percentual de eventos atrasados ou rejeitados.

Cardinalidade:

- `tenant_id` pode ser usado em metricas quando a plataforma de observabilidade suportar cardinalidade adequada.
- Evitar labels com ids de embarque, usuario ou payload externo.
- Para recursos de alta cardinalidade, usar logs e traces em vez de labels de metricas.

## Traces

Traces distribuidos devem cobrir:

- requisicoes HTTP;
- chamadas ao banco;
- chamadas a cache;
- publicacao e consumo de mensagens;
- chamadas externas;
- execucao de jobs;
- conexoes ou mensagens realtime relevantes.

Regras:

- Propagar `trace_id` e `correlation_id` entre API, outbox, broker e workers.
- Spans externos devem registrar provedor, operacao, status e duracao.
- Payload sensivel nao entra em atributos de span.
- Amostragem pode ser maior para erros, tenants em suporte e rotas criticas.

## Auditoria

Auditoria e diferente de log tecnico. Ela deve ser consultavel, retida conforme politica e protegida contra alteracao indevida.

Eventos auditaveis:

- mudanca de permissoes;
- acesso administrativo cross-tenant;
- criacao, suspensao, reativacao e exclusao de tenant;
- alteracao de configuracao de integracao;
- exportacao de dados;
- reprocessamento manual;
- mudancas em billing e plano.

Campos minimos:

- `audit_id`
- `tenant_id`
- `actor_id`
- `actor_type`
- `action`
- `resource_type`
- `resource_id`
- `reason`
- `before`
- `after`
- `created_at`
- `request_id`

## SLOs iniciais

SLOs devem ser validados com produto e operacao. Sugestoes iniciais:

- API principal: 99.9% de disponibilidade mensal.
- API principal: p95 menor que 500 ms em rotas de leitura comuns.
- Ingestao de tracking: p95 menor que 30 s entre recebimento e persistencia normalizada.
- Realtime: p95 menor que 5 s entre evento persistido e notificacao entregue.
- Jobs criticos: 99% concluidos dentro da janela planejada.

## Alertas

Alertas devem ser acionaveis.

Alertas recomendados:

- erro 5xx acima do baseline;
- latencia p95 acima do SLO;
- DLQ com crescimento continuo;
- lag de fila acima do limite;
- falha recorrente de integracao por provedor;
- queda brusca de eventos de tracking;
- conexoes realtime abaixo ou acima do esperado;
- saturacao de conexoes do banco;
- falha em job de billing ou retencao.

## Runbooks

Cada alerta critico deve apontar para runbook com:

- impacto esperado;
- dashboards relevantes;
- queries ou filtros de investigacao;
- passos de mitigacao;
- criterio de escalacao;
- acao de pos-incidente.
