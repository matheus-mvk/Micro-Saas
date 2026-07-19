# Public and Private Data Matrix

## Objetivo

Classificar dados para orientar acesso, armazenamento, logging, exportacao, analytics e uso em inteligencia artificial.

## Classes

| Classe | Descricao | Regras |
| --- | --- | --- |
| Publico | Informacao projetada para acesso publico | Pode ser cacheada e exibida sem autenticacao quando aprovado |
| Interno | Informacao operacional da plataforma sem dado privado de tenant | Acesso restrito a equipe autorizada |
| Privado do tenant | Dado pertencente a um tenant especifico | Exige autenticacao, autorizacao e isolamento por tenant |
| Sensivel | PII, credenciais, dados comerciais criticos ou seguranca | Exige menor privilegio, mascaramento e auditoria |
| Segredo | Credencial, chave ou token | Nunca expor ao cliente, log ou repositorio |

## Matriz publica/privada

| Dado | Classe | Acesso permitido | Logging | Exportacao | Observacoes |
| --- | --- | --- | --- | --- | --- |
| Pagina institucional publica | Publico | Qualquer visitante | Permitido sem PII | Nao aplicavel | Conteudo aprovado para divulgacao |
| Nome publico da plataforma | Publico | Qualquer visitante | Permitido | Nao aplicavel | Nao inclui dados de tenant |
| Status page publica | Publico | Qualquer visitante | Agregado | Nao aplicavel | Nao revelar incidentes de tenant especifico sem aprovacao |
| Configuracao global interna | Interno | Operadores autorizados | Sim, sem segredo | Restrita | Pode afetar todos os tenants |
| Metricas agregadas anonimas | Interno | Equipe autorizada | Agregado | Restrita | Deve reduzir risco de reidentificacao |
| Perfil de usuario | Privado do tenant | Proprio usuario, admins autorizados | Mascarado | Conforme permissao | Email e nome podem ser PII |
| Membership e papeis | Privado do tenant | Admins autorizados | Auditavel | Restrita | Alteracoes sao sensiveis |
| Clientes finais | Sensivel | Usuarios autorizados do tenant | Mascarado | Auditada | Pode conter PII e enderecos |
| Pedidos, cargas e entregas | Privado do tenant | Usuarios autorizados do tenant | Metadados | Auditada | Pode conter dados comerciais criticos |
| Rotas e geolocalizacao | Sensivel | Usuarios autorizados do tenant | Agregado/mascarado | Auditada | Pode revelar operacao e clientes |
| Custos, precos e margens | Sensivel | Papeis financeiros/autorizados | Mascarado | Auditada | Nao usar em logs tecnicos |
| Relatorios e dashboards | Privado do tenant | Usuarios autorizados | Metadados | Auditada | Filtros devem respeitar tenant |
| Arquivos importados | Sensivel | Owner e papeis autorizados | Metadados | Auditada | Conteudo bruto nao vai para logs |
| Arquivos exportados | Sensivel | Solicitante autorizado | Metadados | Auditada | Link assinado com expiracao |
| Tokens de API | Segredo | Criador/admin autorizado apenas em criacao | Nunca | Nao | Exibir uma unica vez se necessario |
| Credenciais de integracao | Segredo | Sistema e admins autorizados | Nunca | Nao | Criptografar em repouso |
| Logs de auditoria | Sensivel | Operadores autorizados e admins quando aplicavel | Nao logar bruto | Restrita | Contem trilha de acoes |
| Prompts e respostas de IA | Sensivel | Escopo do tenant autorizado | Evitar ou mascarar | Restrita | Nao misturar contexto entre tenants |

## Regras para IA e analytics

- Contexto de IA deve ser montado apenas com dados do tenant autorizado.
- Dados sensiveis devem ser minimizados antes de envio a provedores externos.
- Resultados gerados por IA herdam a classificacao mais restritiva dos dados de entrada.
- Embeddings, caches semanticos e memorias devem ser particionados por tenant.
- Metricas globais devem ser agregadas e revisadas contra reidentificacao.

