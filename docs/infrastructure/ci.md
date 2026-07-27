# Integracao Continua

O workflow de CI fica em `.github/workflows/ci.yml`.

## Comportamento Do Workflow

O workflow e intencionalmente defensivo enquanto os manifests da aplicacao pertencem a outros agentes:

- Faz checkout do repositorio.
- Instala Node.js.
- Detecta o gerenciador de pacotes pelo lockfile ou pelo campo `packageManager`.
- Instala dependencias somente quando `package.json` existe.
- Executa scripts disponiveis entre `lint`, `typecheck`, `test` e `build`.
- Valida a configuracao Docker Compose quando arquivos Compose existem.

Isso permite que o workflow exista antes de todos os arquivos da aplicacao serem integrados, mas ainda fique mais rigoroso automaticamente conforme scripts e arquivos Docker sao adicionados.

## Gates De Qualidade Obrigatorios

Quando a aplicacao estiver integrada, estes scripts devem existir e ter significado real:

- `lint`: analise estatica e politica de formatacao.
- `typecheck`: validacao em tempo de compilacao com TypeScript ou equivalente.
- `test`: testes unitarios e de integracao deterministicos.
- `build`: verificacao de build de producao via Turborepo.

O manifesto raiz atual ja expoe esses scripts por `pnpm`.

Para um SaaS multi-tenant, a CI tambem deve incluir testes para:

- Repositories e queries tenant-scoped.
- Verificacoes de autorizacao entre fronteiras de tenant.
- Escopo de tenant em chaves de cache.
- Propagacao de contexto de tenant em jobs em background.
- Seguranca de migrations para tabelas compartilhadas.

## Protecao De Branch

Requisitos recomendados para branch protegida:

- Exigir revisao de pull request.
- Exigir que o workflow de CI passe.
- Exigir resolucao de conversas.
- Bloquear force pushes.
- Exigir historico linear se isso combinar com o fluxo do time.

## Segredos Na CI

A CI nao deve exigir segredos de producao. Use credenciais somente de teste e servicos efemeros.

Se testes de integracao precisarem de dependencias externas:

- Prefira servicos containerizados iniciados pelo workflow.
- Use segredos do GitHub Actions somente para contas de teste nao produtivas.
- Rotacione segredos em uma agenda definida.
- Evite registrar connection strings ou tokens em logs.

## Extensoes Futuras

Adicione estes jobs quando a estrutura da aplicacao estiver disponivel:

- Auditoria de vulnerabilidades de dependencias com threshold de severidade acordado.
- Build e scan de imagem de container.
- Dry run de migration de banco.
- Smoke tests end-to-end contra ambiente de preview.
- Upload de artefatos de cobertura e saidas de build.

Quando `pnpm-lock.yaml` estiver commitado, a CI usa `pnpm install --frozen-lockfile`. Ate la, ela usa fallback para `pnpm install --no-frozen-lockfile` para que o workflow rode durante a montagem do repositorio.
