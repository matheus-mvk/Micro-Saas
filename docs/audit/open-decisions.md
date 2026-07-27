# Decisoes Abertas

Status: `IN_DESIGN`

## Decisoes Recomendadas Para Aprovacao

| Decisao | Recomendacao | Justificativa | Reversibilidade |
| --- | --- | --- | --- |
| Primeiro modulo funcional | Identity and Access | Todas as rotas privadas, contexto de tenant, RBAC, WebSocket, filas e auditoria dependem de identidade confiavel | Media |
| Modelo de tenant | Banco compartilhado, schema compartilhado, `tenantId` obrigatorio em tabelas de negocio | Combina com a fundacao atual e mantem baixo o custo operacional do MVP | Media |
| Tenant por usuario | Um tenant por usuario no MVP; modelar memberships futuras explicitamente | Auth mais simples e menos casos de borda; membership futura pode ser adicionada com migration | Media |
| Unicidade de e-mail do usuario | Unico por `(tenantId, email)` no MVP | Permite mesmo e-mail em empresas diferentes; alinha com schema atual | Media |
| Identificadores | Manter UUID no schema atual; avaliar ULID antes de tabelas de alto volume | Evita churn agora; ULID melhora localidade cronologica depois | Media |
| Precificacao de frete | Comecar com tabelas relacionais normalizadas e JSON limitado/validado somente para breakdown de taxas | Consultavel, auditavel, versionado e mais facil de testar que JSON arbitrario de regras | Media |
| Status de shipment | Armazenar `Shipment.currentStatus` e anexar `TrackingEvent` imutavel na mesma transacao | Leituras operacionais rapidas e timeline auditavel | Baixa |
| Modelo de evento de tracking | Eventos imutaveis append-only com idempotencia por source/externalEventId | Obrigatorio para importacoes/webhooks/retries | Baixa |
| Realtime | Salas Socket.IO derivadas do contexto autenticado no servidor | Impede salas de tenant selecionadas pelo cliente | Baixa |
| Importacoes | Tipos especificos de importacao, nao um importador generico nao tipado | Evita fluxos de dados impossiveis de validar | Media |
| APIs externas | ViaCEP ou BrasilAPI para enriquecimento de endereco mais OpenRouteService para estimativa de distancia/rota | Util para MVP de simulacao de frete com risco de integracao administravel | Media |

## Decisoes Ainda Abertas

| Topico | Opcoes | Recomendacao | Aprovacao Humana Necessaria |
| --- | --- | --- | --- |
| Superadmin da plataforma | Dominio global admin separado ou extensao de role de tenant | Namespace separado de role interna | Sim |
| Escopo de filial | Branch opcional em usuarios/recursos ou tabela de membership | Manter branch opcional ate casos de uso concretos | Sim |
| Resolucao de tenant OAuth | Dominio de e-mail, convite, selecao explicita de tenant ou membership | Convite/membership primeiro | Sim |
| Enforcement de MFA | Inicialmente apenas admin ou todos os usuarios | Admin/manager primeiro, politica de tenant depois | Sim |
| Provedor de storage | Volume local, S3-compatible, blob store especifico de cloud | Abstracao S3-compatible depois da spec de importacoes | Sim |
| Complexidade de tabela de frete | Relacional puro, JSON hibrido, estrategia em codigo, rules engine | MVP relacional com versionamento | Sim |
| Correcoes de tracking | Evento de correcao apenas admin ou edicao com auditoria | Evento de correcao, sem mutation | Sim |
| Retencao de dados | Defaults fixos ou configuravel por plano do tenant | Defaults agora, configuravel por plano depois | Sim |
| Exposicao local do Redis | Manter host port ou bind somente localhost | Bind localhost em hardening futuro | Nao, baixo impacto |
| Runtime CI | Node 20 alinhado ao Docker ou Node 22 alinhado a CI atual | Alinhar versoes antes de producao | Nao, baixo impacto |

## Decisoes Rejeitadas Por Enquanto

- Base repository generico para todo modelo: adiciona cerimonia antes de padroes reais de acesso existirem.
- Framework CQRS: util somente se modelos de leitura/escrita divergirem materialmente.
- Event sourcing para shipments: eventos de tracking sao append-only, mas o sistema nao precisa de event sourcing completo.
- Rules engine para precificacao de frete no MVP: alta complexidade antes de a variabilidade tarifaria ser comprovada.
- Regras de frete somente em JSON: dificil de validar, indexar, auditar e comparar.
- Tenant selecionado pelo cliente para salas WebSocket: inseguro.
