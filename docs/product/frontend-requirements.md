# Requisitos de Produto para Frontend

## Objetivo do MVP

Entregar uma experiencia web operacional para usuarios autenticados acompanharem inteligencia logistica por tenant, com foco em dashboard, monitoramento, alertas e administracao basica.

## Escopo funcional inicial

- Login e selecao implicita ou explicita do tenant ativo.
- Layout autenticado com navegacao principal, identificacao do tenant e perfil do usuario.
- Dashboard com KPIs principais, tendencia por periodo e ranking de excecoes.
- Listagem operacional com filtros por periodo, status, severidade, transportadora, regiao e cliente.
- Detalhe de item logistico com linha do tempo, eventos, alertas relacionados e indicadores.
- Central de alertas com classificacao por severidade, status e responsavel.
- Administracao basica de usuarios e permissoes por tenant.

## Regras multi-tenant na interface

- Nenhuma tela deve exibir dados sem tenant resolvido.
- O tenant ativo deve estar visivel em areas autenticadas.
- Troca de tenant, quando permitida, deve limpar caches locais e recarregar dados escopados.
- Filtros, preferencias e dashboards salvos devem ser vinculados ao tenant.
- Mensagens de erro de autorizacao nao devem revelar existencia de dados de outro tenant.

## Estados obrigatorios por tela

- Carregamento inicial com skeleton ou estado progressivo.
- Sem dados, diferenciando ausencia real de filtros restritivos.
- Erro recuperavel com acao de tentar novamente.
- Erro de permissao com orientacao para contatar administrador do tenant.
- Dados parciais ou defasados quando a API informar atraso de processamento.

## Prioridades de experiencia

- Filtros persistentes por modulo para reduzir trabalho repetitivo.
- Tabelas densas, legiveis e com colunas relevantes para decisao.
- Drill-down claro entre indicador agregado, lista filtrada e detalhe operacional.
- Acoes principais sempre proximas ao contexto do dado.
- Confirmacoes apenas para acoes destrutivas ou irreversiveis.

## Fora do escopo inicial

- Editor visual de modelos preditivos.
- Workflow complexo de aprovacao multi-etapa.
- Construtor livre de dashboards.
- Aplicativo mobile nativo.
- Customizacao visual completa por tenant.

