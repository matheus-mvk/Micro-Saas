# Admin Experience

## Objetivo

A administracao deve permitir configurar tenants, usuarios, permissoes, regras operacionais, integracoes e auditoria sem misturar tarefas administrativas com a rotina operacional.

## Arquitetura de Navegacao

Grupo principal: Administracao

Itens recomendados:

- Tenants.
- Usuarios.
- Papeis, perfis e permissoes.
- Unidades e operacoes.
- Regras de SLA.
- Integracoes.
- Auditoria.
- Parametros da conta.

Para super-admins, separar claramente:

- Visao plataforma.
- Visao tenant.

Nunca deixar o usuario em duvida sobre qual tenant esta sendo alterado.

## Tenants

Lista de tenants:

- Nome.
- Identificador.
- Status.
- Plano ou contrato.
- Unidades ativas.
- Usuarios ativos.
- Ultima atividade.
- Integracoes conectadas.

Detalhe do tenant:

- Resumo.
- Configuracoes.
- Usuarios.
- Unidades.
- Regras.
- Integracoes.
- Auditoria.

Estados:

- Ativo.
- Implantacao.
- Suspenso.
- Arquivado.

Acoes criticas, como suspender tenant, devem exigir confirmacao com nome do tenant.

## Usuarios

Fluxo recomendado:

1. Convidar usuario.
2. Definir tenant e unidade.
3. Escolher perfil.
4. Revisar permissoes sensiveis.
5. Enviar convite.

Tabela de usuarios:

- Nome.
- E-mail.
- Tenant.
- Unidade.
- Perfil.
- Status de convite.
- Ultimo acesso.
- MFA, quando aplicavel.

Status:

- Convidado.
- Ativo.
- Bloqueado.
- Inativo.

## Papeis, Perfis e Permissoes

No produto, "papel" deve representar o agrupamento tecnico de permissoes e "perfil" pode ser usado como rotulo amigavel quando fizer sentido para o usuario final. A UI deve evitar expor diferenca tecnica sem necessidade.

Permissoes devem ser agrupadas por dominio:

- Operacao.
- Inteligencia.
- Cadastros.
- Administracao.
- Integracoes.
- Auditoria.

Padrao de permissao:

- Visualizar.
- Criar.
- Editar.
- Excluir.
- Aprovar.
- Exportar.
- Configurar.

Permissoes perigosas:

- Alterar tenant.
- Gerenciar permissoes.
- Exportar dados sensiveis.
- Alterar integracoes.
- Suspender tenant.

Essas permissoes devem ter aviso contextual.

## Regras Operacionais

Regras de SLA, alerta e priorizacao devem ter:

- Nome claro.
- Escopo: tenant, unidade, rota, cliente, transportadora ou contrato.
- Condicao.
- Acao.
- Severidade.
- Vigencia.
- Autor e ultima alteracao.
- Historico de versoes.

Editor de regra:

- Usar fluxo guiado quando a condicao for complexa.
- Mostrar pre-visualizacao em linguagem natural.
- Validar conflitos antes de salvar.
- Permitir duplicar regra existente.

## Integracoes

Lista de integracoes:

- Sistema.
- Tipo.
- Status.
- Ultima sincronizacao.
- Ultimo erro.
- Responsavel.
- Ambiente.

Detalhe:

- Credenciais mascaradas.
- Escopos.
- Logs recentes.
- Mapeamento de campos.
- Webhooks.
- Teste de conexao.

Estados:

- Conectada.
- Com erro.
- Pendente de configuracao.
- Pausada.
- Sem permissao.

## Auditoria

Auditoria deve responder:

- Quem alterou?
- O que foi alterado?
- Quando?
- Em qual tenant?
- Qual era o valor anterior?
- Qual e o valor atual?
- Qual origem da acao: usuario, API, job ou integracao?

Filtros obrigatorios:

- Periodo.
- Tenant.
- Usuario.
- Tipo de evento.
- Entidade.
- Severidade.

## Padroes de Confirmacao

Confirmar:

- Exclusao.
- Suspensao.
- Alteracao de permissao critica.
- Rotacao de credencial.
- Desativacao de integracao.
- Mudanca de regra com impacto em SLA.

Nao confirmar:

- Filtro.
- Ordenacao.
- Navegacao simples.
- Exportacao sem dado sensivel.

## Estados Vazios

Estados vazios devem ser especificos:

- "Nenhum usuario convidado para este tenant."
- "Este tenant ainda nao possui integracoes configuradas."
- "Nao ha eventos de auditoria para o periodo selecionado."

Sempre que houver uma proxima acao clara, mostrar o botao correspondente.
