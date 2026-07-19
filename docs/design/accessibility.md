# Acessibilidade

## Meta

A experiencia deve mirar WCAG 2.2 nivel AA para telas web. Acessibilidade nao deve ser tratada como ajuste visual final; ela precisa estar nas decisoes de cor, componente, fluxo, texto e validacao.

## Contraste

- Texto normal deve ter contraste minimo de 4.5:1.
- Texto grande deve ter contraste minimo de 3:1.
- Componentes interativos e indicadores graficos devem ter contraste minimo de 3:1 contra o entorno.
- Badges de status nao podem depender apenas de cor. Sempre incluir texto.
- Graficos devem usar legenda, padroes, labels ou marcadores alem da cor.

## Teclado

- Toda acao deve ser acessivel por teclado.
- Ordem de foco deve seguir a leitura visual.
- Foco deve ser visivel e consistente, preferencialmente com outline azul `#2563EB`.
- Menus, comboboxes, tabs, dialogs e drawers devem seguir padroes ARIA esperados.
- Atalhos de teclado, quando existirem, nao devem bloquear atalhos do navegador.

## Formularios

- Labels sempre associadas ao campo.
- Campos obrigatorios devem ser indicados em texto, nao apenas com cor ou asterisco isolado.
- Mensagens de erro devem explicar causa e correcao.
- Validacao em tempo real nao deve roubar foco.
- Ao submeter um formulario com erro, o foco deve ir para o resumo de erros ou primeiro campo invalido.

## Tabelas e Dados Densos

- Usar cabecalhos semanticos para tabelas.
- Acoes em linha precisam de nomes acessiveis especificos, como "Editar regra de SLA Expresso SP".
- Ordenacao deve anunciar coluna e direcao.
- Filtros ativos devem ser removiveis por teclado.
- Em tabelas com muitas colunas, preservar o significado dos dados em layouts responsivos.

## Dialogs e Drawers

- Ao abrir, foco inicial vai para titulo, primeiro campo ou acao principal conforme o contexto.
- Foco fica contido dentro do modal/drawer.
- `Esc` fecha quando nao houver perda de dados.
- Se houver dados nao salvos, perguntar antes de fechar.
- Ao fechar, foco retorna ao elemento que abriu o modal/drawer.

## Linguagem Inclusiva

- Evitar culpar o usuario em erros.
- Preferir "Nao foi possivel salvar" a "Voce informou dados invalidos".
- Usar texto claro para permissao: "Seu perfil nao permite alterar tenants".
- Evitar jargoes tecnicos sem necessidade em mensagens operacionais.

## Movimento

- Animacoes devem ser curtas e funcionais.
- Respeitar `prefers-reduced-motion`.
- Evitar animacoes constantes em dashboards operacionais.
- Alertas criticos podem chamar atencao com cor, icone e posicao, nao com piscadas.

## Checklist de Acessibilidade por Tela

- A pagina tem titulo unico e claro.
- Todos os controles tem nome acessivel.
- Foco e ordem de tabulacao fazem sentido.
- Contraste foi verificado.
- Estados de erro sao anunciaveis por leitor de tela.
- Status e graficos nao dependem apenas de cor.
- Dialogs prendem foco e retornam foco corretamente.
- A tela funciona com zoom de 200%.
- Textos nao sobrepoem componentes.
