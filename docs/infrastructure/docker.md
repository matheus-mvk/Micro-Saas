# Docker

Este documento descreve o contrato Docker esperado para a plataforma. Ele nao modifica Dockerfiles nem arquivos Compose.

## Objetivos

- Imagens reproduziveis criadas a partir do codigo e lockfiles commitados.
- Configuracao de runtime por variaveis de ambiente, sem segredos embutidos na imagem.
- Inicializacao rapida de dependencias locais via Docker Compose.
- Imagens de producao com superficie minima de ataque.

## Expectativas de Imagem

Imagens da API NestJS, da aplicacao Web Next.js e dos workers devem:

- Usar uma tag explicita de imagem base.
- Instalar dependencias a partir de um lockfile.
- Rodar com usuario nao root.
- Expor apenas as portas necessarias.
- Incluir healthcheck quando o runtime suportar.
- Manter dependencias de build e runtime separadas.
- Evitar copiar `.env`, caches locais, saidas de teste ou segredos gerados.

## Expectativas de Compose

O `docker-compose.yml` local deve definir dependencias de desenvolvimento e servicos locais da aplicacao. Grupos de servico recomendados:

- Processo da API na porta `3333`.
- Processo Web na porta `3000`.
- Banco MySQL.
- Redis para cache, filas BullMQ e coordenacao Socket.IO quando necessario.
- Processo worker para consumidores BullMQ.
- Ferramentas opcionais de observabilidade para debugging local.

Todo servico com estado deve usar volumes nomeados. Portas devem ser documentadas e nao devem conflitar com ferramentas locais comuns.

O container MySQL escuta na porta `3306` dentro da rede Docker. Para evitar conflitos com uma instancia MySQL local no Windows, o mapeamento do host publica o banco em `localhost:3307`. Conexoes entre containers devem continuar usando `mysql:3306`.

## Comandos Comuns

```bash
docker compose config
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down
docker compose down -v
```

Use `docker compose down -v` somente quando os dados locais puderem ser descartados.

## Validacao de Build

Quando Dockerfiles forem integrados, valide builds a partir de um checkout limpo:

```bash
docker compose config
docker compose build
docker compose up --build
```

Para repositorios com multiplos servicos, prefira nomes de imagem especificos por servico e contextos de build documentados.

## Configuracao de Runtime

Nao passe segredos por flags de linha de comando quando eles puderem aparecer no historico do shell ou em listas de processos. Prefira arquivos de ambiente no desenvolvimento local e cofres de segredos gerenciados em staging e producao.

Para servicos multi-tenant, confirme que defaults de ambiente nao podem rotear silenciosamente todas as requisicoes para um unico tenant em staging ou producao.

## Notas de Producao

Containers de producao devem ser imutaveis. Mudancas de configuracao devem criar um novo deploy ou revisao de task, nao alterar um container em execucao.

Controles de runtime recomendados:

- Filesystem raiz somente leitura quando viavel.
- Limites de memoria e CPU.
- Probes de liveness e readiness.
- Logs estruturados em stdout/stderr.
- Timeout explicito para graceful shutdown.
