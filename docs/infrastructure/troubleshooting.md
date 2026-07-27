# Troubleshooting

Use este guia para falhas locais, de CI, Docker e deploy.

## Falha Na Instalacao Local

Verifique o gerenciador de pacotes e o lockfile:

```bash
ls
node --version
corepack --version
pnpm --version
```

Depois instale com o comando correspondente:

```bash
pnpm install --frozen-lockfile
pnpm install
```

Use `pnpm install --frozen-lockfile` quando `pnpm-lock.yaml` existir. Use `pnpm install` simples apenas enquanto o lockfile ainda nao estiver integrado.

## Falha No Docker Compose

Valide a sintaxe do Compose:

```bash
docker compose config
docker compose ps
docker compose logs -f
```

Causas comuns:

- Variavel de ambiente obrigatoria ausente.
- Porta do host ja em uso.
- Volume nomeado contem dados de um schema incompativel.
- Healthcheck do servico ainda nao foi concluido.
- Container nao consegue resolver o nome de outro servico.

Se o Windows ja tiver um MySQL local escutando em `localhost:3306`, mantenha-o rodando e use o banco do container por `localhost:3307` nas ferramentas Windows. Nao altere a URL interna do container `mysql:3306`.

Para dados locais descartaveis, reinicie os volumes:

```bash
docker compose down -v
docker compose up -d
```

## CI Falha Na Instalacao

Verifique:

- O lockfile corresponde ao gerenciador de pacotes.
- `package.json` e lockfile foram commitados juntos.
- Tokens de registry privado estao configurados somente quando necessario.
- Scripts de postinstall nao exigem servicos locais indisponiveis.

## CI Falha Nos Testes

Verifique se o teste que falhou assume:

- Timezone fixa.
- Estado global compartilhado.
- Ordem especifica de execucao.
- Fixture de tenant que nao foi criada.
- Servico de banco ou cache que nao foi iniciado na CI.

Testes de isolamento de tenant devem criar seus proprios tenants e registros, em vez de depender de dados locais preexistentes.

## Falha Na Conexao Com Banco

Verifique:

- Valor da connection string.
- DNS ou nome do servico no container.
- Exposicao de porta.
- Requisitos de modo SSL.
- Permissoes do usuario do banco.
- Estado das migrations.

No Docker local, a URL padrao do banco aponta para o servico Compose `mysql`:

```bash
mysql://logistics:logistics_password@mysql:3306/logistics_saas
```

Essa URL e para containers na rede Docker. Para DBeaver ou outro cliente Windows, use:

```text
Host: localhost
Port: 3307
Database: logistics_saas
User: logistics
Password: logistics_password
```

Em staging e producao, evite alteracoes manuais de schema. Use o processo de migration controlado pela aplicacao.

## Suspeita De Vazamento Entre Tenants

Verificacoes imediatas:

- Identifique request ID, tenant ID, user ID e endpoint.
- Confirme a resolucao do contexto de tenant a partir do token de auth, host ou metadados da requisicao.
- Inspecione queries em busca de predicados de tenant ausentes.
- Inspecione chaves de cache em busca de escopo de tenant ausente.
- Verifique payloads de jobs em background quanto ao contexto de tenant.

Acoes de contencao:

- Desabilite a feature flag afetada, se disponivel.
- Pare a fila worker afetada se o vazamento for assincrono.
- Preserve logs e registros de auditoria.
- Ajuste testes para reproduzir o vazamento antes da release.

## Checklist De Incidente Em Producao

- Confirme se o problema e global ou especifico de tenant.
- Verifique taxa de erro, latencia, saturacao e profundidade de fila.
- Compare a versao atual do deploy com a ultima versao conhecida como estavel.
- Revise migrations recentes e mudancas de configuracao.
- Decida entre rollback, desabilitar feature flag ou aplicar correcao progressiva.
- Registre linha do tempo e acoes de acompanhamento apos a recuperacao.
