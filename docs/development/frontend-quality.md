# Qualidade Frontend

## Principios

- Interfaces operacionais devem ser densas, previsiveis e rapidas de escanear.
- Cada tela deve ter estados completos de carregamento, vazio, erro e permissao.
- Alteracoes devem preservar isolamento de tenant e nao vazar dados entre contas.
- Testes devem acompanhar risco: mais cobertura para fluxos compartilhados e permissoes.

## Checklist de implementacao

- A tela bloqueia ou redireciona quando nao ha tenant ativo.
- Chaves de cache incluem tenant, filtros relevantes e paginacao.
- Filtros podem ser limpos sem perder contexto do modulo.
- Datas, moedas, percentuais e duracoes usam formatadores centralizados.
- Tabelas mantem layout estavel durante carregamento e atualizacao.
- Acoes destrutivas exigem confirmacao e mostram resultado.
- Erros exibem mensagem acionavel e nao revelam dados de outro tenant.

## Testes recomendados

- Testes unitarios para formatadores, adaptadores de DTO e regras de exibicao.
- Testes de componentes para filtros, tabelas, estados vazios e permissoes.
- Testes de integracao para navegacao autenticada e troca de tenant.
- Testes end-to-end para dashboard, monitor operacional, detalhe e alertas.
- Testes de regressao visual para telas densas com muitos dados.

## Acessibilidade

- Navegacao principal, filtros, tabelas e modais devem operar por teclado.
- Usar labels visiveis ou acessiveis em todos os controles.
- Estados criticos nao devem depender apenas de cor.
- Foco deve ser restaurado apos fechar modais ou concluir acoes.
- Graficos devem ter resumo textual ou tabela equivalente para os dados principais.

## Performance

- Paginar ou virtualizar listas longas.
- Evitar refetch completo quando uma invalidacao granular for suficiente.
- Carregar graficos secundarios de forma progressiva.
- Usar memoizacao apenas onde houver custo real ou renderizacao repetida.
- Monitorar tempo ate primeira informacao util nas telas operacionais.

## Revisao antes de merge

- Confirmar que o diff esta limitado ao escopo da tarefa.
- Verificar que nenhum arquivo de aplicacao, pacote, ambiente ou infraestrutura foi alterado.
- Validar que exemplos e nomes estao coerentes com os contratos existentes.
- Registrar decisoes novas de arquitetura ou produto em documentacao quando aplicavel.

