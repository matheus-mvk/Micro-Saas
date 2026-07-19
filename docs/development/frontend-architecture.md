# Arquitetura Frontend

## Objetivo

Definir diretrizes para desenvolver o frontend da plataforma SaaS multi-tenant de inteligencia logistica de forma consistente, testavel e segura para dados escopados por tenant.

## Camadas recomendadas

- Rotas e layouts: definem estrutura de navegacao, areas publicas, areas autenticadas e protecoes.
- Features: agrupam telas, componentes, hooks e servicos de um dominio funcional.
- Componentes de UI: elementos reutilizaveis sem regra de negocio especifica.
- Cliente de API: centraliza autenticacao, tenant ativo, tratamento de erros e serializacao.
- Estado de servidor: cache de consultas, invalidacao e atualizacao otimista quando aplicavel.
- Estado local: preferencias visuais, filtros em edicao e interacoes temporarias.

## Organizacao por dominio

Preferir organizacao orientada a feature para reduzir acoplamento entre modulos:

```text
src/
  app/
  features/
    dashboard/
    operations/
    alerts/
    administration/
  shared/
    api/
    auth/
    components/
    tenant/
    utils/
```

## Contratos multi-tenant

- O tenant ativo deve ser resolvido antes de chamadas autenticadas.
- Toda chamada de API deve carregar o identificador do tenant pelo mecanismo padrao do backend.
- Chaves de cache devem incluir o tenant quando o dado for escopado.
- Ao trocar tenant, invalidar dados escopados e limpar estado derivado.
- Logs de frontend nao devem incluir dados sensiveis, tokens ou payloads logisticos completos.

## Padroes de dados

- Usar tipos explicitos para DTOs recebidos da API e modelos de view derivados.
- Normalizar datas e fusos em uma borda unica antes de renderizar.
- Tratar valores monetarios, percentuais e duracoes com formatadores centralizados.
- Evitar regras de negocio duplicadas no frontend quando a API puder retornar status calculados.
- Distinguir `null`, zero e campo ausente em indicadores operacionais.

## Componentizacao

- Componentes compartilhados devem ser genericos e documentados por uso real.
- Componentes de feature podem conhecer linguagem de negocio e contratos especificos.
- Tabelas, filtros e graficos devem receber dados ja preparados pela feature.
- Formularios devem concentrar validacao de entrada e adaptacao para payloads da API.
- Modais devem ser usados para tarefas curtas; fluxos longos devem ter tela propria.

## Tratamento de erros

- Centralizar traducao de erros tecnicos para mensagens de interface.
- Preservar codigo de erro ou correlation id quando fornecido pela API.
- Erros 401 devem acionar fluxo de sessao.
- Erros 403 devem mostrar falta de permissao no tenant atual.
- Erros 409 devem explicar conflito de estado e sugerir recarregar dados.

