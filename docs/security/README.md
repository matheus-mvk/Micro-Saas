# Security Documentation

Este diretorio consolida as regras e decisoes de seguranca para a plataforma SaaS multi-tenant de inteligencia logistica.

## Escopo

Os documentos cobrem controles de produto, aplicacao, dados e operacao para:

- autenticacao e gestao de sessoes;
- autorizacao e segregacao por papeis;
- isolamento de tenants;
- uploads e processamento de arquivos;
- segredos, chaves e configuracoes sensiveis;
- logging, auditoria e observabilidade;
- matriz de dados publicos e privados;
- riscos de seguranca e mitigacoes.

## Documentos

- [Threat model](threat-model.md)
- [Authentication](authentication.md)
- [Authorization](authorization.md)
- [Tenant isolation](tenant-isolation.md)
- [Uploads](uploads.md)
- [Secrets](secrets.md)
- [Logging and audit](logging.md)
- [Public/private data matrix](data-classification.md)
- [Risk register](risk-register.md)

## Principios obrigatorios

1. Toda requisicao autenticada deve carregar identidade do usuario, tenant ativo e contexto de permissao.
2. Nenhum identificador de tenant pode ser aceito como fonte unica de autorizacao quando vier do cliente.
3. Toda consulta de dados privados deve aplicar filtro de tenant no backend, preferencialmente em camada compartilhada ou middleware de acesso a dados.
4. Operacoes administrativas cross-tenant devem ser explicitas, auditadas e restritas a papeis internos.
5. Dados sensiveis nao devem aparecer em logs, mensagens de erro, analytics, URLs ou nomes de arquivos publicos.
6. Uploads devem ser tratados como conteudo hostil ate passarem por validacao, armazenamento seguro e politicas de acesso.
7. Segredos devem existir apenas em cofres, variaveis de ambiente protegidas ou servicos equivalentes; nunca no repositorio.
8. Mudancas de seguranca devem ser revisadas considerando impacto multi-tenant antes de merge/deploy.

