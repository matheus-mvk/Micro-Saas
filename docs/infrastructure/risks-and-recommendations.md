# Riscos E Recomendacoes

Este documento registra riscos de infraestrutura e mitigacoes recomendadas para a plataforma.

## Riscos Principais

| Risco | Impacto | Recomendacao |
| --- | --- | --- |
| Predicado de tenant ausente no acesso a dados | Exposicao de dados cross-tenant | Reforcar helpers de repository tenant-scoped e testar acesso cross-tenant nao autorizado. |
| Chaves de cache sem escopo de tenant | Vazamento de dados ou dados obsoletos | Prefixar chaves de cache especificas de tenant com tenant ID ou slug do tenant. |
| Jobs em background sem contexto de tenant | Trabalho executado contra tenant errado | Exigir tenant ID no payload dos jobs e valida-lo antes de efeitos colaterais. |
| Migrations manuais em producao | Downtime ou corrupcao de dados | Usar migrations versionadas com dry runs em staging e notas de rollback. |
| `pnpm-lock.yaml` ausente | Instalacoes de dependencias nao reproduziveis | Commitar o lockfile e exigir instalacoes congeladas na CI. |
| Segredos de longa duracao | Aumento do raio de impacto apos exposicao | Usar segredos gerenciados e rotacionar credenciais. |
| Concorrencia de worker sem limite | Tempestades de fila e saturacao do banco | Definir concorrencia, retries, backoff e tratamento de dead-letter explicitamente. |
| Observabilidade insuficiente | Resposta lenta a incidentes | Emitir logs estruturados com request ID, tenant ID, user ID, servico e versao. |
| Imagens de container sem scan | Vulnerabilidades conhecidas em producao | Adicionar scan de imagem antes do deploy. |

## Recomendacoes

1. Definir isolamento de tenant como decisao arquitetural explicita.
2. Commitar `pnpm-lock.yaml` e exigir instalacoes pnpm congeladas.
3. Adicionar testes de isolamento de tenant antes do onboarding em producao.
4. Construir imagens de container imutaveis e fazer deploy por digest.
5. Usar backups gerenciados de banco com procedimentos de restore testados.
6. Manter migrations destrutivas separadas dos deploys da aplicacao.
7. Adicionar smoke tests em staging cobrindo login, resolucao de tenant, fluxos logisticos centrais e processamento de worker.
8. Adicionar alertas para taxa de erro, latencia, profundidade de fila, jobs falhos, saturacao do banco e picos de anomalia por tenant.

## Checklist Minimo De Prontidao Para Producao

- CI obrigatoria em branches protegidas.
- Segredos armazenados fora do repositorio.
- Staging espelha a topologia de producao.
- Backups de banco e teste de restore documentados.
- Procedimento de rollback documentado e testado.
- Logs incluem correlation IDs e contexto de tenant.
- Health checks existem para web, API, workers, banco, cache e filas.
- Responsabilidade por resposta a incidentes definida.
