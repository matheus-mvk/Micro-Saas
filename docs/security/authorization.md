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

