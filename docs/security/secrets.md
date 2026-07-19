# Secrets

## Objetivo

Evitar exposicao, uso indevido e persistencia insegura de segredos da plataforma, tenants e integracoes.

## Tipos de segredo

- Credenciais de banco, cache, filas e storage.
- Chaves de assinatura de tokens e cookies.
- Tokens de API externos.
- Webhook secrets.
- Credenciais OAuth.
- Chaves de criptografia.
- Senhas temporarias e recovery tokens.
- Tokens de integracao por tenant.

## Regras obrigatorias

1. Segredos nao devem ser versionados no repositorio.
2. Segredos nao devem aparecer em logs, erros, traces, analytics, screenshots ou dumps.
3. Segredos devem ser carregados de cofre, secret manager ou variavel de ambiente protegida.
4. Cada ambiente deve ter segredos separados.
5. Segredos por tenant devem ser isolados e identificados pelo tenant owner.
6. Acesso a segredos deve seguir menor privilegio.
7. Rotacao deve ser possivel sem deploy emergencial.
8. Segredos comprometidos devem ser revogados e substituidos imediatamente.

## Armazenamento

- Preferir secret manager gerenciado.
- Criptografar segredos persistidos por tenant com chave gerenciada.
- Nao armazenar tokens externos em texto puro quando houver alternativa de criptografia em repouso.
- Separar chave de criptografia dos dados criptografados.
- Evitar expor segredos ao frontend, mesmo em variaveis com prefixo publico.

## Rotacao

Rotacionar em caso de:

- suspeita de vazamento;
- saida de colaborador com acesso;
- alteracao de fornecedor;
- mudanca de ambiente;
- exposicao em log, issue, chat, pipeline ou arquivo local;
- periodo maximo definido por politica interna.

## CI/CD e desenvolvimento

- Habilitar secrets scanning no repositorio e pipeline.
- Usar valores falsos em exemplos e documentacao.
- Arquivos `.env` locais devem estar ignorados pelo versionamento.
- Pipelines devem mascarar variaveis sensiveis.
- Testes automatizados devem usar segredos fake ou ambiente isolado.

## Resposta a incidente

1. Identificar segredo, escopo, ambiente e tenants afetados.
2. Revogar ou bloquear o segredo.
3. Rotacionar credencial e dependencias.
4. Procurar uso indevido em logs e provedores.
5. Notificar responsaveis conforme impacto.
6. Registrar causa raiz e acao preventiva.

