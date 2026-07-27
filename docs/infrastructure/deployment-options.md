# Opcoes De Deploy

Este documento descreve opcoes de deploy para a plataforma. A selecao final deve considerar perfil de trafego, necessidades de compliance, capacidade operacional do time e requisitos de isolamento de tenant.

## Opcao 1: Plataforma Gerenciada De Containers

Exemplos: AWS ECS/Fargate, Google Cloud Run, Azure Container Apps, Render, Fly.io.

Melhor encaixe:

- Time de operacoes pequeno a medio.
- Servicos containerizados.
- Necessidade de autoscaling simples.
- Preferencia por load balancing e upgrades de runtime gerenciados.

Padrao recomendado:

- Construir imagens imutaveis de API, web e worker na CI.
- Enviar imagens para um registry.
- Fazer deploy primeiro em staging.
- Rodar migrations como etapa explicita de release.
- Promover o mesmo digest de imagem para producao.

## Opcao 2: Kubernetes

Melhor encaixe:

- Multiplos servicos com escala independente.
- Forte necessidade de rede customizada, operators ou controles internos de plataforma.
- Time com experiencia operacional em Kubernetes.

Padrao recomendado:

- Manifests Helm ou Kustomize.
- Namespaces separados para staging e producao.
- Operador de segredos externos ou integracao cloud-native de segredos.
- Horizontal pod autoscaling baseado em metricas de servico.
- Pod disruption budgets para servicos criticos.

Evite Kubernetes se o time nao tiver capacidade de operar o cluster.

## Opcao 3: Deploy Tradicional Em VM

Melhor encaixe:

- Prototipo inicial com baixa complexidade operacional.
- Restricoes rigidas de ambiente.
- Operacao existente baseada em VMs.

Padrao recomendado:

- Docker Compose ou containers gerenciados por systemd.
- Provisionamento automatizado.
- Backups fora do host.
- Reverse proxy com automacao TLS.
- Scripts explicitos de rollback.

Esta opcao e simples, mas se torna arriscada conforme a quantidade de tenants e o trafego crescem.

## Deploy Do Banco De Dados

Ponto de partida recomendado:

- Banco relacional gerenciado compativel com MySQL.
- Backups automatizados.
- Point-in-time recovery.
- Instancias separadas de staging e producao.
- Processo de migration com verificacoes pre-deploy.

A estrategia de isolamento de tenant deve ser explicita:

- Banco compartilhado e schema compartilhado: modelo pooled inicial recomendado, com maior necessidade de disciplina em queries.
- Banco compartilhado e schema por tenant: isolamento mais forte, maior complexidade de migrations.
- Banco por tenant: isolamento mais forte, maior overhead operacional.

## Estrategia De Release

Fluxo de release recomendado:

1. Merge to protected branch after CI passes.
2. Construir e taguear imagem imutavel.
3. Fazer deploy em staging.
4. Rodar migrations e smoke tests.
5. Promover o mesmo digest de imagem para producao.
6. Monitorar erros, latencia, profundidade de fila e anomalias especificas de tenant.

## Estrategia De Rollback

Rollback deve considerar codigo e dados:

- Manter digests de imagens anteriores disponiveis.
- Preferir migrations retrocompativeis.
- Separar migrations destrutivas em releases posteriores.
- Manter procedimento documentado para desabilitar feature flags arriscadas.
- Validar procedimentos de restore regularmente.
