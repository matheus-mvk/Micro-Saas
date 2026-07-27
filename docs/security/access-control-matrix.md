# Matriz de Acesso e Funcionalidades

Este documento descreve o RBAC implementado no backend NestJS com base no `schema.prisma`, decorators `@Roles(...)`, `@Public()` e regras internas dos services. Ele documenta o estado atual do codigo; novos perfis ou permissoes devem atualizar este arquivo junto com contratos de API e testes.

## Modelo Atual

A aplicacao usa controle privado por padrao:

- Rotas sem `@Public()` exigem contexto autenticado pelo `PrivateByDefaultGuard`.
- Rotas com `@Roles(...)` exigem que `request.context.role` esteja em uma das roles declaradas.
- O enum de perfis fica em `UserRole`: `ADMIN`, `MANAGER`, `OPERATOR`.
- Nao existe tabela separada de roles ou permissions no schema atual.
- A role fica gravada em `users.role`.
- O isolamento de tenant usa `tenant_id` nos modelos e o tenant vem do contexto autenticado.

Status de usuario nao sao perfis, mas interferem no login:

- `ACTIVE`: usuario apto a receber sessao.
- `INCOMPLETE`: cadastro OAuth ainda nao completado.
- `PENDING`: usuario aguardando aprovacao.
- `BLOCKED`: usuario bloqueado.
- `INVITED`: usuario convidado ainda nao ativo.
- `DISABLED`: usuario desativado.
- `DELETED`: usuario excluido logicamente.

Usuarios que nao estao em `ACTIVE` nao devem receber JWT final.

## Perfis

### ADMIN

Perfil administrativo maximo dentro de um tenant.

Pode:

- Listar, criar, convidar, aprovar e atualizar usuarios do tenant.
- Alterar role e status de usuarios.
- Revogar sessoes e resetar MFA de usuarios.
- Criar, editar e ativar/inativar filiais.
- Criar, editar e ativar/inativar transportadoras.
- Gerenciar servicos de transportadora e upload de logo.
- Criar, editar, versionar e ativar/inativar tabelas de frete.
- Criar e editar coberturas.
- Consultar auditoria.
- Operar clientes, simulacoes, shipments, tracking, imports, dashboard e insights.

Restricoes atuais relevantes:

- O service de usuarios protege contra remocao/demotion do ultimo admin ativo.
- Criacao ou promocao para `ADMIN` exige ator admin.

### MANAGER

Perfil gerencial operacional dentro do tenant.

Pode:

- Listar usuarios do tenant.
- Criar, editar e ativar/inativar filiais.
- Criar, editar e ativar/inativar transportadoras.
- Gerenciar servicos de transportadora e upload de logo.
- Criar, editar, versionar e ativar/inativar tabelas de frete.
- Criar e editar coberturas.
- Consultar auditoria.
- Operar clientes, simulacoes, shipments, tracking, imports, dashboard e insights.

Nao pode:

- Criar usuarios.
- Convidar usuarios.
- Aprovar usuarios.
- Alterar role/status de usuarios.
- Revogar sessoes ou resetar MFA de terceiros.

### OPERATOR

Perfil operacional basico dentro do tenant.

Pode:

- Consultar filiais.
- Consultar transportadoras, servicos e logos.
- Operar clientes e enderecos.
- Criar e consultar simulacoes de frete.
- Selecionar opcao de frete e criar shipment.
- Consultar shipments.
- Criar eventos de tracking e alterar status de shipment.
- Criar e consultar imports, com restricao de ownership.
- Consultar dashboard e insights.

Restricoes atuais relevantes:

- Nao acessa gestao de usuarios.
- Nao cria ou edita filiais.
- Nao cria ou edita transportadoras/servicos.
- Nao cria ou edita tabelas de frete.
- Nao cria ou edita coberturas.
- Nao consulta auditoria.
- Em imports, enxerga apenas jobs criados pelo proprio usuario.
- No dashboard, a regra interna diferencia `OPERATOR` de perfis com acesso completo.

### Publico

Rotas marcadas com `@Public()` nao exigem sessao.

Inclui:

- Login, registro, refresh e logout.
- Verificacao de MFA no login.
- Recuperacao e reset de senha.
- Listagem publica de tenants.
- Fluxos OAuth de status, inicio, callback e conclusao de cadastro.
- Aceite de convite.
- Health checks.

## Matriz Por Modulo

| Modulo/rota | Publico | ADMIN | MANAGER | OPERATOR | Observacao |
| --- | --- | --- | --- | --- | --- |
| `auth/login`, `auth/register`, `auth/refresh`, `auth/logout` | Sim | Sim | Sim | Sim | Publicas para iniciar/renovar/encerrar sessao. |
| `auth/me`, `auth/profile`, MFA, sessoes proprias, onboarding | Nao | Sim | Sim | Sim | Exigem usuario autenticado. |
| `users` listagem | Nao | Sim | Sim | Nao | `@Roles(ADMIN, MANAGER)`. |
| `users` criacao, convite, aprovacao, update, reset MFA, revoke sessions | Nao | Sim | Nao | Nao | `@Roles(ADMIN)`. |
| `users/accept-invite` | Sim | Sim | Sim | Sim | Publica, validada por token de convite. |
| `branches` list/get | Nao | Sim | Sim | Sim | Consulta tenant-scoped. |
| `branches` create/update/status | Nao | Sim | Sim | Nao | Escrita restrita a admin/manager. |
| `carriers` list/get/logo | Nao | Sim | Sim | Sim | Consulta tenant-scoped. |
| `carriers` create/update/status/services/logo upload | Nao | Sim | Sim | Nao | Escrita restrita a admin/manager. |
| `customers` | Nao | Sim | Sim | Sim | Operacao aberta aos tres perfis. |
| `freight-simulations` | Nao | Sim | Sim | Sim | Operacao aberta aos tres perfis. |
| `imports` | Nao | Sim | Sim | Sim | Operator so acessa imports proprios. |
| `dashboard/summary` | Nao | Sim | Sim | Sim | Operator recebe regra diferenciada no service. |
| `insights` | Nao | Sim | Sim | Sim | Aberto aos tres perfis autenticados. |
| `freight-rate-tables` list/get | Nao | Sim | Sim | Sim | Consulta aberta aos tres perfis. |
| `freight-rate-tables` create/update/version/status | Nao | Sim | Sim | Nao | Escrita restrita a admin/manager. |
| `coverages` list/test | Nao | Sim | Sim | Sim | Consulta/teste aberto aos tres perfis. |
| `coverages` create/update | Nao | Sim | Sim | Nao | Escrita restrita a admin/manager. |
| `shipments` list/get/status/tracking | Nao | Sim | Sim | Sim | Operacao aberta aos tres perfis. |
| `audit-logs` | Nao | Sim | Sim | Nao | Auditoria restrita a admin/manager. |
| `health` | Sim | Sim | Sim | Sim | Publico. |

## Testes Obrigatorios De Acesso

Cada endpoint privado deve ser testado com:

- Sem token: espera `401`.
- Token com role insuficiente: espera `403`.
- Token com role permitida: espera sucesso esperado.
- Token de outro tenant tentando acessar recurso por ID: espera `404` ou resposta sem vazamento de dados.
- Usuario com status diferente de `ACTIVE`: nao deve obter sessao final.

Cenarios especificos:

- `OPERATOR` nao deve listar usuarios.
- `OPERATOR` nao deve criar filial, transportadora, tabela de frete ou cobertura.
- `OPERATOR` nao deve consultar import de outro usuario.
- `MANAGER` nao deve criar, convidar, aprovar ou alterar usuario.
- `ADMIN` nao deve conseguir remover o ultimo admin ativo do tenant.
- Usuario de tenant A nao deve acessar recurso de tenant B mesmo conhecendo o ID.
