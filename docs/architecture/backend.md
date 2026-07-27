# Backend

Status: arquitetura alvo.

## Objetivo

O backend sustenta uma plataforma SaaS multi-tenant de inteligencia logistica. Ele deve processar operacoes transacionais, receber e normalizar eventos logisticos, alimentar modelos ou regras de inteligencia, e entregar atualizacoes operacionais em tempo quase real sem romper isolamento entre tenants.

## Camadas

1. Entrypoints
   - HTTP API para operacoes sincronas.
   - Realtime gateway para WebSocket ou SSE.
   - Workers para filas, jobs agendados e consumidores de eventos.
   - Integrations adapters para provedores externos de TMS, WMS, ERP, telemetria, mapas e notificacoes.

2. Application
   - Orquestra casos de uso.
   - Abre transacoes.
   - Resolve autorizacao e tenant context.
   - Publica eventos via outbox.
   - Nao deve conter detalhes de transporte HTTP, WebSocket ou broker.

3. Domain
   - Concentra regras de negocio, invariantes e linguagem logistica.
   - Nao depende de banco, filas, frameworks ou APIs externas.
   - Emite eventos de dominio quando uma mudanca relevante ocorre.

4. Infrastructure
   - Persistencia, cache, mensageria, storage, email, mapas, webhooks e clientes externos.
   - Implementa interfaces definidas pelas camadas superiores.

## Modulos de dominio

Os modulos abaixo sao limites recomendados. Cada modulo pode iniciar simples e ganhar servicos proprios somente quando houver pressao real de escala ou ownership.

- Identity and access: usuarios, papeis, permissoes, sessoes e tokens.
- Tenants: organizacoes, planos, quotas, configuracoes e lifecycle.
- Logistics core: embarques, pedidos, paradas, rotas, veiculos, motoristas, ocorrencias e status.
- Tracking and telemetry: eventos de localizacao, sensores, checkpoints e ingestao externa.
- Intelligence: ETA, risco operacional, anomalias, recomendacoes, score de atraso e consolidacoes.
- Notifications: alertas, webhooks, email, push e preferencias.
- Billing and usage: uso por tenant, limites, medicao e eventos faturaveis.
- Audit: trilha de mudancas sensiveis e acessos administrativos.

## Fluxo de requisicao HTTP

1. Receber requisicao e gerar ou propagar `request_id`.
2. Autenticar credencial.
3. Resolver tenant a partir do token, dominio, rota administrativa ou credencial de servico.
4. Construir `TenantContext` imutavel para a duracao da requisicao.
5. Autorizar acao com base em usuario, tenant, papel, recurso e escopo.
6. Validar entrada com schemas explicitos.
7. Executar caso de uso em transacao quando houver escrita.
8. Gravar outbox na mesma transacao para eventos externos ou assincronos.
9. Retornar DTO sem vazar campos internos, dados de outros tenants ou segredos.
10. Registrar metricas, logs estruturados e trace.

## APIs

- Preferir contratos REST ou RPC HTTP versionados de forma explicita.
- Usar paginacao por cursor em listas de alto volume.
- Usar filtros indexaveis e limites maximos por endpoint.
- Erros devem seguir formato consistente com `code`, `message`, `request_id` e `details` sanitizados.
- Operacoes idempotentes externas devem aceitar `Idempotency-Key`.
- Endpoints administrativos cross-tenant devem ficar em namespace separado e exigir permissao propria.

## Autorizacao

Autenticacao responde "quem e o chamador". Autorizacao responde "o que ele pode fazer neste tenant e neste recurso".

Regras:

- Nunca autorizar somente pelo papel nominal.
- Autorizar no caso de uso, perto da regra de negocio.
- Consultas precisam aplicar escopo de recurso antes de devolver dados.
- Servicos internos usam credenciais proprias, com escopo minimo.
- Rotas de suporte ou administracao global exigem motivo auditavel.

## Configuracao e segredos

- Configuracao operacional vem de variaveis de ambiente ou secret manager.
- Segredos nao sao versionados.
- Configuracoes de tenant ficam no banco e sao cacheadas com chave segregada por tenant.
- Feature flags devem ser avaliadas com tenant context.

## Compatibilidade

Mudancas de contrato devem seguir uma destas estrategias:

- evolucao retrocompativel com campos opcionais;
- endpoint ou evento versionado;
- janela de migracao com suporte paralelo;
- descontinuacao comunicada e monitorada por uso real.

## Auth Module Atual

O modulo de autenticacao inicial implementa o fluxo Controller -> Service/Use Case -> Repository -> Prisma.

Componentes principais:

- `AuthController`: contratos HTTP de login, refresh, logout e usuario atual.
- `AuthService`: casos de uso de autenticacao, refresh rotation, logout e consulta da sessao atual.
- `AuthRepository`: persistencia de usuario e refresh token.
- `AuthContextService`: resolve contexto autenticado para guards.
- `AuthTokenService`: JWT de access token, refresh token opaco e hashes de metadados.
- `PasswordService`: hash e verificacao de senha.
- `AuditService`: escrita inicial de auditoria.

Controllers nao acessam Prisma diretamente. O schema atual foi mantido sem migrations nesta etapa porque `User`, `RefreshToken` e `AuditLog` ja possuiam os campos necessarios.
