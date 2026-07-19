# Design System

## Personalidade Visual

A plataforma deve parecer confiavel, operacional e moderna. O usuario principal trabalha com prazos, cargas, rotas, ocorrencias, SLAs, custos e excecoes. A UI deve favorecer leitura rapida, comparacao e acao.

Evitar:

- Gradientes decorativos como linguagem principal.
- Cards grandes com pouco conteudo em areas operacionais.
- Paletas muito monocromaticas.
- Hero visual dentro de telas de produto.
- Texto explicando como usar controles obvios.

## Fundamentos

### Layout

- Estrutura base: sidebar ou rail lateral para modulos, topbar compacta para tenant, periodo, busca e perfil.
- Conteudo principal com largura fluida e maximo apenas em telas editoriais.
- Dashboards operacionais devem usar grids densos, filtros persistentes e paineis de resumo acima de tabelas.
- Evitar cards dentro de cards. Usar cards apenas para itens repetidos, metricas isoladas, modais e paineis claramente delimitados.
- Raio de borda padrao: `6px`.
- Raio maximo para cards e modais: `8px`.
- Espacamento base: `4px`, com escala `4, 8, 12, 16, 24, 32, 48`.

### Tipografia

- Fonte recomendada: sans-serif neutra com boa legibilidade numerica, como Inter, Source Sans 3 ou system UI.
- Tamanhos:
  - `12px`: metadados, labels compactos, badges.
  - `14px`: corpo padrao em tabelas, formularios e menus.
  - `16px`: corpo editorial e campos importantes.
  - `20px`: titulos de painel.
  - `24px`: titulos de pagina.
  - `32px`: headlines de landing.
- Peso:
  - `400`: texto comum.
  - `500`: labels, abas, botoes secundarios.
  - `600`: titulos, metricas, chamadas.
- Letter spacing: `0`.
- Nao escalar fonte com viewport.

### Cores

Paleta funcional recomendada:

- Fundo principal: `#F7F8FA`
- Superficie: `#FFFFFF`
- Superficie elevada: `#F2F5F8`
- Borda sutil: `#D9E0E7`
- Texto principal: `#17212B`
- Texto secundario: `#5B6673`
- Texto fraco: `#7B8794`
- Primaria: `#136F63`
- Primaria hover: `#0F5E54`
- Foco: `#2563EB`
- Informacao: `#1D4ED8`
- Sucesso: `#15803D`
- Alerta: `#B45309`
- Erro: `#B42318`
- Critico operacional: `#7F1D1D`

Uso:

- Verde deve comunicar eficiencia, confirmacao e acao primaria, nao preencher a tela inteira.
- Azul deve ser reservado para foco, links e informacao tecnica.
- Vermelho deve indicar falha real, atraso critico, bloqueio ou risco alto.
- Amarelo/ambar deve indicar atencao, pendencia ou validacao necessaria.

### Elevacao e Bordas

- Preferir bordas sutis a sombras.
- Sombras apenas para menus, popovers, modais e elementos temporariamente sobrepostos.
- Estados selecionados devem combinar cor de fundo leve, borda visivel e texto forte.

## Componentes

### Navegacao

- Sidebar com grupos por dominio: Dashboard, Monitor operacional, Alertas, Analises, Administracao e Integracoes.
- Tenant atual sempre visivel.
- Troca de tenant deve ser uma acao deliberada, com confirmacao visual clara apos mudanca.
- Breadcrumbs em telas profundas de configuracao ou detalhe.

### Botoes

- Primario: uma acao dominante por contexto.
- Secundario: acoes alternativas.
- Ghost/icon: acoes recorrentes em tabelas, filtros e toolbars.
- Destrutivo: reservado para exclusao, cancelamento irreversivel ou desativacao critica.
- Botoes com icone devem usar icones conhecidos quando existirem: salvar, filtrar, buscar, baixar, atualizar, editar, excluir, voltar.
- Todo botao icon-only precisa de tooltip e nome acessivel.

### Formularios

- Labels sempre visiveis.
- Placeholder nao substitui label.
- Ajuda curta abaixo do campo quando a regra nao for obvia.
- Erros devem aparecer junto ao campo e tambem no resumo quando houver multiplas falhas.
- Campos de tenant, unidade, transportadora, centro de distribuicao e periodo devem deixar escopo explicito.

### Tabelas

- Tabelas sao componente principal do produto operacional.
- Cabecalho fixo quando a tabela tiver rolagem vertical.
- Colunas numericas alinhadas a direita.
- Status com badge textual e cor.
- Linha selecionada deve ser inequivoca.
- Acoes de linha devem ser icon buttons com tooltip.
- Filtros ativos devem aparecer como chips removiveis acima da tabela.
- Estados vazios devem explicar o que aconteceu e qual acao resolve.

### Dashboards

- Primeiro bloco: KPIs de SLA, custo, atraso, ocorrencias e volume.
- Segundo bloco: excecoes, alertas e prioridades.
- Terceiro bloco: tendencias por periodo, rankings e comparativos.
- Grafico nunca deve depender apenas de cor.
- Sempre mostrar periodo, tenant e fonte dos dados.

### Modais e Drawers

- Modal para decisao curta, confirmacao ou formulario pequeno.
- Drawer lateral para edicao contextual sem perder a lista.
- Fluxos longos devem ir para pagina dedicada.
- Confirmacoes destrutivas devem nomear o objeto afetado.

### Badges e Status

Padrao de estados:

- `Normal`: operacao dentro do esperado.
- `Atencao`: requer acompanhamento.
- `Risco`: pode afetar prazo, custo ou SLA.
- `Critico`: ja afetou ou bloqueia a operacao.
- `Resolvido`: excecao encerrada.
- `Pendente`: aguardando acao humana ou integracao.

## Estados Obrigatorios

Cada tela deve especificar:

- Carregando.
- Vazio.
- Sem permissao.
- Erro recuperavel.
- Erro bloqueante.
- Dados parciais.
- Offline ou integracao indisponivel, quando aplicavel.

## Responsividade

- Desktop e notebook sao os alvos principais.
- Mobile deve permitir consulta, aprovacao simples e acompanhamento, nao necessariamente operacao completa.
- Em mobile, tabelas complexas viram listas densas com os campos mais importantes e acoes em menu.
- Filtros avancados devem ir para drawer em telas pequenas.

## Densidade

Usar tres modos de densidade quando o produto amadurecer:

- Confortavel: padrao para novos usuarios.
- Compacto: operacao diaria.
- Alta densidade: usuarios avancados e centrais de monitoramento.

O modo padrao inicial deve ser confortavel, com estrutura preparada para compactar sem quebrar layout.
