# Checklist Visual

Use este checklist antes de entregar qualquer tela, fluxo ou prototipo.

## Escopo e Contexto

- O tenant atual esta visivel quando a tela manipula dados multi-tenant.
- O usuario entende se esta em visao plataforma, tenant ou unidade.
- A tela deixa claro o periodo dos dados.
- A origem dos dados aparece quando a informacao vem de integracao, IA ou importacao.

## Layout

- A hierarquia visual conduz para a acao principal.
- Nao ha cards dentro de cards.
- Tabelas, filtros e toolbars mantem dimensoes estaveis.
- Textos nao estouram botoes, badges, cards ou colunas.
- A tela funciona em desktop, notebook e mobile de consulta.
- O primeiro conteudo relevante aparece sem rolagem excessiva.

## Componentes

- Existe apenas uma acao primaria por contexto.
- Icon buttons tem tooltip e nome acessivel.
- Formularios usam labels visiveis.
- Estados selecionado, hover, foco, erro e disabled estao definidos.
- Modais sao usados para fluxos curtos; fluxos longos usam pagina ou drawer.
- Acoes destrutivas exigem confirmacao contextual.

## Dados

- Numeros estao alinhados e formatados corretamente.
- Status tem texto e cor.
- Graficos possuem legenda e nao dependem apenas de cor.
- Tabelas tem ordenacao, loading, vazio e erro.
- Filtros ativos ficam visiveis e removiveis.

## Acessibilidade

- Contraste atende AA.
- Foco e visivel.
- Ordem de tabulacao segue a interface.
- A tela funciona com teclado.
- Mensagens de erro estao associadas aos campos.
- Zoom de 200% nao quebra conteudo essencial.
- Movimento respeita reducao de movimento.

## Conteudo

- Titulos nomeiam a tarefa ou objeto.
- Botoes usam verbo claro.
- Erros dizem o que aconteceu e como resolver.
- Alertas mostram impacto e proxima acao.
- O texto nao culpa o usuario.
- IA e descrita como previsao, sugestao ou classificacao, nao como certeza absoluta.

## Identidade

- A tela nao parece uma landing page dentro do produto.
- Cores funcionais mantem significado consistente.
- A interface nao e dominada por uma unica cor.
- Imagens mostram produto, dados ou operacao realista.
- Elementos decorativos nao competem com dados operacionais.

## QA Visual

- Testar largura estreita, media e ampla.
- Testar com dados longos: nomes de tenant, emails, rotas e transportadoras.
- Testar com muitos registros e sem registros.
- Testar permissao negada.
- Testar integracao com erro.
- Testar tenant suspenso ou em implantacao.
- Testar usuario com acesso a multiplos tenants.
