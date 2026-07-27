# Sequencia De Implementacao

Status: `IN_DESIGN`

Esta sequencia esta ordenada por dependencias, nao por calendario.

## 1. Identidade E Acesso

Pre-requisitos: aprovar decisoes de autenticacao, politica de cookies, resolucao de tenant e modelo de roles.

Backend: login, rotacao de refresh token, logout, revogacao de sessao, `/me` e auth guard derivando contexto de credenciais verificadas.

Frontend: mutation de login, session provider, dashboard protegido e placeholders contratuais para MFA/OAuth.

Seguranca: anti-enumeracao, rate limiting, cookies HttpOnly, CSRF e auditoria.

Testes: sucesso/falha de autenticacao, reuso de refresh token, logout, usuario desativado e tenant desativado.

Skill: atualizar `auth` e `security`.

ADR: detalhar autenticacao caso as decisoes mudem.

Concluido quando: nenhuma rota privada confiar em headers de usuario, tenant ou role enviados pelo cliente.

## 2. Tenant E Autorizacao

Pre-requisitos: contexto de identidade.

Backend: contexto de tenant, escopo por filial e verificacoes de permissao por acao/recurso.

Frontend: contexto visivel de tenant e estados de acesso proibido.

Testes: negacao entre tenants e matriz RBAC.

Concluido quando: convencoes de repositorios tenant-scoped estiverem comprovadas por testes.

## 3. Usuarios

Pre-requisitos: autenticacao e autorizacao.

Backend: casos de uso para convite, listagem, atualizacao, desativacao e troca de role.

Frontend: tabela de usuarios, fluxo de convite e confirmacao de troca de role.

Seguranca: auditar toda mudanca de role/status.

Concluido quando: `ADMIN` conseguir gerenciar usuarios do tenant sem vazamentos entre tenants.

## 4. Clientes E Enderecos

Pre-requisitos: repositorios tenant-scoped e auditoria.

Backend: casos de uso de cliente/endereco com paginacao, filtros e desativacao logica.

Frontend: lista, detalhe, formulario de cliente e gerenciamento de enderecos.

Integracoes: consulta opcional por ViaCEP/BrasilAPI.

Concluido quando: dados de clientes suportarem snapshots futuros de embarques.

## 5. Transportadoras E Servicos

Pre-requisitos: reutilizar padroes de clientes somente quando fizer sentido.

Backend: casos de uso de transportadora e servico.

Frontend: fluxos de listagem e edicao de transportadoras/servicos.

Concluido quando: servico de transportadora puder ser referenciado por precificacao/simulacao.

## 6. Precificacao De Frete

Pre-requisitos: servicos de transportadora e modelo aprovado de tabela de frete.

Backend: rascunho/publicacao/versionamento de tabela e servico de calculo.

Frontend: telas aprovadas para upload/manual de tabelas.

Testes: decimais, vigencia, frete minimo e isolamento de tenant.

Concluido quando: motor de precificacao retornar calculos explicaveis para cenarios MVP.

## 7. Simulacao De Frete E Opcoes

Pre-requisitos: precificacao, clientes e transportadoras.

Backend: criar simulacao, calcular opcoes e persistir versoes de regras.

Frontend: formulario de simulacao e matriz comparativa.

Integracoes: provedor de distancia por rota com fallback.

Concluido quando: usuario puder comparar opcoes sem criar automaticamente um shipment.

## 8. Shipments

Pre-requisitos: modelo de opcao de simulacao ou decisao de criacao manual.

Backend: criar shipment a partir de opcao/manual/importacao, snapshots de endereco e volumes.

Frontend: lista e detalhe de shipment.

Testes: transacao a partir da opcao selecionada e isolamento de tenant.

Concluido quando: shipment estiver operacionalmente separado da simulacao.

## 9. Tracking

Pre-requisitos: shipment, maquina de status, auditoria e autenticacao realtime.

Backend: anexar eventos, atualizar status atual transacionalmente e idempotencia.

Frontend: linha do tempo e formulario manual de evento.

Testes: transicao invalida, duplicidade, fora de ordem, correcao e WebSocket.

Concluido quando: a linha do tempo de tracking for imutavel e o status atual permanecer consistente.

## 10. Importacoes E Workers

Pre-requisitos: modulos de destino e decisao de armazenamento.

Backend: validacao de upload, `ImportJob` e workers de processamento por linha.

Frontend: assistente de importacao e tela de progresso.

Infraestrutura: servico dedicado de worker.

Concluido quando: um tipo de importacao aprovado rodar com seguranca de ponta a ponta.

## 11. Realtime

Pre-requisitos: autenticacao/sessao e autorizacao por recurso.

Backend: handshake autenticado do Socket.IO, salas por recurso e eventos versionados.

Frontend: assinaturas de importacao/tracking e fallback por polling.

Concluido quando: cliente nao conseguir entrar em salas arbitrarias de tenant.

## 12. Dashboard

Pre-requisitos: simulacoes, shipments, tracking e importacoes.

Backend: agregacoes tenant-scoped por periodo.

Frontend: filtros, KPIs, listas prioritarias e drill-down.

Concluido quando: todos os numeros vierem de dados reais e exibirem fonte/periodo.

## 13. Insights

Pre-requisitos: metricas de dashboard e dados historicos.

Backend: regras deterministicas, ciclo de vida de insight, dispensar/marcar como lido.

Frontend: paineis de insight explicaveis.

Concluido quando: insight exibir regra, fonte, confianca/relevancia e acao.

## 14. Consulta De Auditoria

Pre-requisitos: escritas de auditoria nos modulos.

Backend: consulta/exportacao de trilha de auditoria com filtros.

Frontend: tabela de auditoria e drawer de auditoria por entidade.

Concluido quando: acoes sensiveis forem rastreaveis sem expor segredos.

## 15. Landing Final, Observabilidade, Deploy E Hardening

Pre-requisitos: claims de produto sustentados pelos modulos implementados.

Trabalho: conteudo final da landing, metricas/tracing, reducao de imagens, build de imagem em CI, deploy de migrations, backups, smoke tests e tratamento de segredos de producao.

Concluido quando: deploy publico e runbook operacional estiverem aprovados.
