# Documentacao de Infraestrutura

Este diretorio documenta a base operacional da plataforma SaaS multi-tenant de inteligencia logistica.

A base atual da plataforma e um monorepo pnpm/Turborepo para um SaaS de inteligencia logistica:

- API: NestJS, TypeScript, Prisma, MySQL.
- Web: Next.js App Router, TypeScript, TanStack Query.
- Assincrono/cache/realtime: Redis, BullMQ, Socket.IO.
- Runtime local: Docker Compose.

Dockerfiles, arquivos Compose, scripts de pacote e codigo da aplicacao pertencem aos agentes de integracao correspondentes. Estes documentos definem o contrato de infraestrutura e os pontos seguros de integracao sem alterar esses arquivos de runtime.

## Documentos

- [Ambiente local](./local-environment.md): pre-requisitos locais, variaveis de ambiente, fluxo de inicializacao e verificacoes de isolamento de tenant.
- [Docker](./docker.md): expectativas de imagem e Compose, orientacoes de runtime em container e comandos de validacao.
- [CI](./ci.md): comportamento do workflow GitHub Actions, gates de qualidade e pontos de extensao.
- [Opcoes de deploy](./deployment-options.md): alvos de deploy recomendados e padroes de rollout.
- [Troubleshooting](./troubleshooting.md): modos comuns de falha e comandos de diagnostico.
- [Riscos e recomendacoes](./risks-and-recommendations.md): riscos de infraestrutura, mitigacoes e proximos passos.

## Principios Operacionais

- O isolamento de dados por tenant deve ser validado antes de cada release de producao.
- Segredos devem ser injetados pela plataforma de runtime e nao devem ser commitados no controle de versao.
- A CI deve falhar em gates de qualidade deterministicos e evitar dependencias ocultas de maquinas locais.
- Artefatos Docker devem ser reproduziveis a partir do codigo e lockfiles commitados.
- Deploys devem ser reversiveis por imagens versionadas e migrations explicitas.

## Ambientes Esperados

- `local`: workstation do desenvolvedor e containers locais.
- `ci`: validacao GitHub Actions para pull requests e branches protegidas.
- `staging`: ambiente semelhante a producao para migrations, verificacoes de integracao e smoke tests.
- `production`: runtime exposto ao cliente com backups, monitoramento e procedimentos de rollback.

## Verificacoes Base

Antes de habilitar um caminho de deploy, confirme que a plataforma possui respostas documentadas para:

- Estrategia de identificacao de tenant: claim assinada em token, dominio/subdominio verificado, credencial de servico ou contexto administrativo protegido.
- Modelo de isolamento do banco: MySQL compartilhado com chaves de tenant, salvo quando um tenant enterprise exigir banco ou ambiente dedicado.
- Responsabilidade por migrations e processo de rollback.
- Fonte da verdade de segredos e politica de rotacao.
- Escopo por tenant em filas, cache e jobs em background.
- Campos de observabilidade exigidos em logs e traces.
