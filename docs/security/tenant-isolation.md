# Tenant Isolation

## Objetivo

Impedir vazamento, alteracao ou inferencia de dados entre tenants em todos os fluxos sincronos, assincronos e analiticos.

## Regra central

Todo dado privado deve ser particionado por tenant e toda operacao sobre dado privado deve resolver o tenant no backend antes de acessar persistencia, cache, filas, storage ou provedores externos.

## Camadas de isolamento

| Camada | Controle minimo |
| --- | --- |
| Roteamento | Resolver tenant por fonte confiavel e validar membership |
| Aplicacao | Checar permissao e ownership antes da regra de negocio |
| Persistencia | Aplicar filtro obrigatorio por `tenant_id` ou estrategia equivalente |
| Cache | Incluir tenant na chave e no escopo de invalidacao |
| Filas/jobs | Carregar tenant no envelope da mensagem e validar antes do processamento |
| Storage | Separar prefixos/buckets por tenant ou aplicar policy equivalente |
| Analytics/IA | Montar contexto apenas com dados do tenant autorizado |
| Logs | Registrar tenant como metadado, sem dados sensiveis |

## Regras obrigatorias

1. IDs de recursos recebidos do cliente nao bastam para autorizar acesso.
2. Listagens devem filtrar por tenant antes de paginacao, ordenacao e agregacao.
3. Contagens e erros devem evitar revelar existencia de dados de outro tenant.
4. Cache compartilhado deve prefixar chaves com tenant e ambiente.
5. Jobs devem processar um tenant por vez ou usar particionamento claro e testado.
6. Arquivos devem ter owner tenant, owner user ou owner integration e politica de expiracao.
7. Dados anonimizados para metricas globais devem remover identificadores e reduzir risco de reidentificacao.
8. Operacoes cross-tenant devem existir apenas em modulos internos, com permissao especifica, justificativa e auditoria.

## Padroes de consulta

- Preferir escopos/repositories que recebam contexto de tenant obrigatorio.
- Evitar consultas ad hoc que aceitem `tenant_id` opcional.
- Rejeitar operacoes quando o tenant nao puder ser determinado.
- Validar que joins, includes, views e procedures preservam o filtro de tenant.
- Como a fundacao usa MySQL, nao depender de Row Level Security nativo; usar isolamento de aplicacao, constraints e testes automatizados.

## Anti-padroes proibidos

- Confiar em `tenant_id` do body sem validar membership.
- Reutilizar chave de cache apenas por ID numerico.
- Executar job global que itera dados de todos os tenants sem auditoria e limites.
- Salvar arquivo em caminho previsivel com tenant ou documento sensivel no nome.
- Retornar `403` para recurso de outro tenant quando isso revelar existencia; usar resposta indistinguivel quando aplicavel.
- Compartilhar prompts, embeddings ou contexto de IA entre tenants sem sanitizacao e isolamento.

## Evidencias esperadas

- Testes automatizados de cross-tenant para endpoints criticos.
- Revisao de queries que manipulam dados privados.
- Auditoria de acessos internos cross-tenant.
- Inventario de caches e filas com chaveamento por tenant.
- Politica de storage documentada para uploads e exportacoes.

## Estado Apos Modulo 1

O contexto autenticado inicial foi implementado:

- `tenantId` e resolvido do usuario autenticado.
- `userId` e `role` sao derivados de token verificado e usuario ativo no banco.
- Headers de tenant/usuario/papel vindos do cliente deixaram de ser fonte confiavel.
- `GET /auth/me` retorna tenant seguro da sessao.

Pendencias:

- Criar testes e2e de acesso cruzado assim que o primeiro CRUD tenant-scoped for implementado.
- Criar helpers/repositories por modulo que exijam `tenantId` nos filtros.
- Proteger namespaces de Redis, BullMQ, Socket.IO e storage antes de uso funcional.
