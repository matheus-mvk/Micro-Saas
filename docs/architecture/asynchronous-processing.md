# Processamento Assincrono

```mermaid
flowchart TD
  Upload --> Job
  Job --> Queue[BullMQ Queue]
  Queue --> Worker
  Worker --> Progress
  Progress --> WebSocket
  WebSocket --> Frontend
```

Redis sustenta BullMQ. Payloads de jobs devem carregar contexto confiavel de tenant derivado da sessao autenticada e usar idempotencia ao processar arquivos ou simulacoes.
