# Backend Architecture Documentation

Status: proposta arquitetural alvo para a plataforma SaaS multi-tenant de inteligencia logistica.

Este diretorio documenta as decisoes de backend, banco de dados, multi-tenancy, processamento assincrono, realtime e observabilidade. A raiz visivel do workspace nao expoe codigo-fonte de aplicacao, portanto os documentos evitam descrever implementacoes ja existentes e definem contratos arquiteturais para orientar implementacoes futuras.

## Documentos

- [Backend](backend.md): limites, camadas, modulos, APIs e fluxo de requisicao.
- [Banco de dados](database.md): modelo relacional, migracoes, particionamento, indices e transacoes.
- [Multi-tenancy](multi-tenancy.md): resolucao de tenant, isolamento, provisionamento e regras de seguranca.
- [Async e realtime](async-realtime.md): eventos, filas, jobs, outbox, WebSocket/SSE e entrega de mensagens.
- [Observabilidade](observability.md): logs, metricas, traces, auditoria, SLOs e operacao.

## Principios

1. Todo dado de negocio pertence a um tenant, exceto cadastros explicitamente globais.
2. O backend nunca confia em `tenant_id` recebido no corpo da requisicao; o tenant vem do contexto autenticado.
3. Escritas que publicam eventos usam outbox transacional para evitar divergencia entre banco e mensageria.
4. Processos assincronos sao idempotentes e rastreaveis por correlation id.
5. Canais realtime sao segregados por tenant e por autorizacao de usuario.
6. Logs, metricas e traces carregam `tenant_id`, `request_id`, `correlation_id` e identificadores de carga logistica quando aplicavel.
7. Operacoes administrativas cross-tenant exigem trilha de auditoria reforcada e permissao explicita.

## Fronteiras de responsabilidade

O backend e responsavel por:

- autenticar e autorizar usuarios, servicos e jobs;
- aplicar isolamento multi-tenant em APIs, consultas, caches, filas e realtime;
- manter consistencia transacional de dados operacionais;
- publicar eventos de dominio e integrar pipelines de inteligencia logistica;
- expor telemetria suficiente para diagnostico e operacao.

O backend nao deve concentrar:

- regras visuais de frontend;
- segredos em arquivos versionados;
- logica analitica pesada em endpoints sincronas;
- acoplamento direto entre handlers HTTP e detalhes de infraestrutura.
