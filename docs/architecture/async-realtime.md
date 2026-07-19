# Async e Realtime

Status: arquitetura alvo.

## Objetivo

O backend deve separar processamento transacional sincrono de tarefas demoradas, integracoes externas, calculos de inteligencia e notificacoes. Atualizacoes operacionais relevantes devem chegar aos usuarios em tempo quase real, com isolamento por tenant e autorizacao por recurso.

## Categorias de trabalho assincrono

- Ingestao: eventos de parceiros, telemetria, webhooks e arquivos.
- Normalizacao: conversao de payloads externos para modelo interno.
- Inteligencia: ETA, anomalias, risco, consolidacoes e recomendacoes.
- Notificacao: email, push, webhooks de cliente e mensagens internas.
- Manutencao: retencao, expurgo, backfills, reprocessamento e reconciliacao.
- Billing: medicao de uso, agregacao e eventos faturaveis.

## Eventos

Eventos devem representar fatos, nao comandos disfarcados.

Formato recomendado:

- `event_id`
- `event_type`
- `event_version`
- `tenant_id`
- `aggregate_type`
- `aggregate_id`
- `occurred_at`
- `correlation_id`
- `causation_id`
- `actor_id`
- `payload`

Convencoes:

- Nomes no passado: `shipment.created`, `route.updated`, `tracking_event.received`.
- Versionar payload quando houver quebra de compatibilidade.
- Payload deve conter dados suficientes para consumidores evitarem leituras desnecessarias, mas nao deve carregar segredos.
- Eventos externos e internos podem ter topicos separados.

## Outbox

Escritas transacionais que causam efeitos externos devem usar outbox.

Garantias:

- mudanca de estado e evento persistem na mesma transacao;
- publicacao pode ser repetida;
- consumidor trata duplicidade;
- falhas de broker nao revertem transacoes ja confirmadas.

Campos minimos da outbox:

- `id`
- `tenant_id`
- `event_type`
- `event_version`
- `payload`
- `created_at`
- `published_at`
- `attempts`
- `last_error`
- `correlation_id`

## Filas e consumidores

Regras:

- Consumidores sao idempotentes.
- Cada mensagem carrega `tenant_id`.
- Retries usam backoff progressivo.
- Erros permanentes vao para DLQ.
- DLQ deve permitir replay controlado.
- Jobs longos gravam progresso.
- Jobs com efeito externo usam idempotency key por provedor.

Ordem:

- Nao assumir ordem global.
- Quando ordem importa, particionar por aggregate id ou usar controle de versao no aggregate.
- Eventos antigos nao devem sobrescrever estados mais novos.

## Jobs agendados

Jobs recorrentes devem:

- ter chave unica de execucao;
- evitar sobreposicao;
- registrar inicio, fim, duracao e status;
- suportar execucao por tenant ou por shard;
- respeitar limites de plano e quotas;
- ser cancelaveis quando possivel.

## Realtime

Opcoes suportadas:

- WebSocket para bidirecionalidade e volume maior.
- Server-Sent Events para stream simples do servidor ao cliente.

Canais recomendados:

- `tenant:{tenant_id}:shipments`
- `tenant:{tenant_id}:shipment:{shipment_id}`
- `tenant:{tenant_id}:alerts`
- `tenant:{tenant_id}:dashboard`
- `tenant:{tenant_id}:user:{user_id}`

O identificador fisico do canal pode ser opaco, mas precisa preservar segregacao por tenant.

## Autorizacao realtime

1. Autenticar conexao.
2. Resolver tenant context.
3. Validar permissao para abrir canal.
4. Validar permissao para cada inscricao de recurso.
5. Revalidar permissoes em reconexao ou renovacao de token.
6. Encerrar inscricoes quando usuario perde acesso.

## Entrega

- Realtime entrega notificacoes de mudanca e snapshots pequenos.
- Dados completos devem ser buscados pela API quando necessario.
- Mensagens realtime carregam `event_id` para deduplicacao no cliente.
- Clientes devem conseguir recuperar estado depois de desconexao usando API e cursor.
- O servidor deve aplicar rate limit por tenant, usuario e conexao.

## Backpressure

- Proteger consumidores com limites de concorrencia.
- Separar filas por criticidade quando necessario.
- Evitar que um tenant com alto volume degrade tenants menores.
- Monitorar lag por fila, tenant e tipo de evento.
- Descartar ou compactar eventos realtime substituiveis, como atualizacoes muito frequentes de posicao, quando a regra de produto permitir.
