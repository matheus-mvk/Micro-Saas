# Authorization

## Objetivo

Garantir que usuarios, operadores e integracoes executem apenas acoes permitidas no tenant, recurso e contexto corretos.

## Modelo recomendado

Usar RBAC com verificacoes ABAC quando necessario:

- RBAC para papeis comuns: owner, admin, operador, analista, viewer, integracao e suporte interno.
- ABAC para restricoes por tenant, unidade, filial, carteira, origem do dado, status operacional, horario ou ownership.
- Permissoes internas devem ser separadas das permissoes de tenant.

## Regras obrigatorias

1. Autorizacao deve acontecer no backend para toda leitura, escrita, exportacao, upload, importacao e acao administrativa.
2. UI pode ocultar acoes, mas nunca deve ser a fonte de autorizacao.
3. Todo recurso privado deve ter ownership verificavel por tenant.
4. Endpoints administrativos devem ser deny-by-default.
5. Permissoes devem ser checadas por acao especifica, nao apenas por tela.
6. Alteracoes de papel, membership e permissoes devem exigir permissao elevada e auditoria.
7. Usuarios nao podem conceder papel superior ao proprio escopo.
8. Tokens de integracao devem ter escopos minimos e nao devem herdar permissoes humanas amplas.

## Padrao de decisao

Toda decisao de autorizacao deve considerar:

- sujeito: usuario, token, servico ou operador interno;
- tenant ativo;
- acao solicitada;
- recurso alvo;
- ownership do recurso;
- escopo permitido;
- contexto adicional, como status, filial, plano ou feature flag.

## Operacoes sensiveis

Exigir permissao explicita e auditoria para:

- exportar dados;
- importar arquivo;
- excluir registros;
- alterar configuracoes de tenant;
- criar ou remover usuarios;
- alterar papeis;
- visualizar logs;
- acessar dados como suporte interno;
- criar tokens de API;
- alterar integracoes;
- acionar jobs de reprocessamento.

## Testes minimos

- Usuario de tenant A nao consegue ler, alterar, excluir, exportar nem listar dados do tenant B.
- Usuario sem permissao de escrita nao consegue escrever mesmo chamando API diretamente.
- Admin de tenant nao consegue criar operador interno.
- Usuario com acesso a dois tenants nao consegue misturar recurso de um tenant com contexto de outro.
- Token de integracao com escopo de leitura nao consegue executar escrita.
- Endpoint de listagem nao retorna contagem, metadado ou erro que revele existencia de dados de outro tenant.

## Implementacao Atual Do Modulo 1

O guard privado por padrao agora valida access token/cookie antes de aceitar contexto autenticado.

Estado atual:

- `@Public()` continua sendo a unica forma de liberar rota anonima.
- `RolesGuard` usa `request.context.role`, agora preenchido pelo contexto autenticado confiavel.
- RBAC ainda e inicial e baseado em `ADMIN`, `MANAGER` e `OPERATOR`.
- Autorizacao por recurso, filial, ownership e acao especifica ainda deve ser implementada por modulo funcional.

Regra obrigatoria para proximos modulos:

- Todo repository/use case tenant-scoped deve combinar `id` do recurso com `tenantId` vindo do contexto autenticado.

## Matriz Atual De Acesso

A matriz operacional atual de roles, rotas e funcionalidades esta documentada em [access-control-matrix.md](access-control-matrix.md). Atualize os dois documentos quando novos perfis, regras internas de service ou decorators `@Roles(...)` forem adicionados.
