# Content Guidelines

## Voz

A plataforma deve falar como um especialista operacional: direta, precisa e calma. O texto deve ajudar o usuario a decidir ou corrigir algo.

Caracteristicas:

- Claro.
- Concreto.
- Breve.
- Orientado a acao.
- Sem exagero comercial dentro do produto.

## Tom por Contexto

- Operacao normal: objetivo e economico.
- Alerta: direto, com impacto e proxima acao.
- Erro: explicar o que aconteceu e como resolver.
- Administracao: explicito sobre escopo, risco e consequencia.
- Landing page: confiante, especifica e sem promessas vagas.

## Padroes de Escrita

Preferir:

- "Salvar regra".
- "Convidar usuario".
- "Sincronizacao concluida".
- "Atraso previsto em 2 entregas".
- "Revise os campos destacados".

Evitar:

- "Clique aqui".
- "Oops".
- "Algo deu errado" sem detalhe.
- "Revolucione sua operacao".
- "A melhor plataforma do mercado".

## Botoes

Botoes devem usar verbo + objeto quando houver ambiguidade:

- "Salvar regra".
- "Criar tenant".
- "Enviar convite".
- "Testar conexao".
- "Exportar auditoria".

Para acoes curtas e obvias:

- "Salvar".
- "Cancelar".
- "Excluir".
- "Editar".

Acoes destrutivas devem nomear o objeto no modal:

- "Excluir regra de SLA".
- "Suspender tenant".

## Mensagens de Erro

Formato:

1. O que aconteceu.
2. Por que pode ter acontecido.
3. O que fazer agora.

Exemplos:

- "Nao foi possivel salvar a regra. Existe outra regra ativa com o mesmo escopo e prioridade. Revise o conflito antes de tentar novamente."
- "A sincronizacao falhou. A credencial pode estar expirada. Teste a conexao ou atualize a credencial."
- "Voce nao tem permissao para exportar auditoria deste tenant."

## Alertas Operacionais

Alertas devem conter:

- Severidade.
- Objeto afetado.
- Impacto.
- Acao sugerida.
- Prazo, quando houver.

Exemplo:

> Risco alto em 4 entregas da rota SP-Interior. SLA pode ser violado nas proximas 3 horas. Priorize contato com a transportadora.

## Estados Vazios

Estado vazio bom:

> Nenhuma regra de SLA criada para este tenant. Crie uma regra para iniciar o monitoramento de excecoes.

Estado vazio ruim:

> Sem dados.

## Datas, Horarios e Numeros

- Mostrar timezone quando afetar operacao multi-regiao.
- Usar data curta em listas e data completa em detalhes.
- Valores monetarios sempre com moeda.
- Percentuais devem indicar base quando necessario.
- Evitar arredondamento que esconda risco operacional.

## Multi-tenant

Quando uma acao afetar tenant, unidade, cliente ou contrato, o texto deve deixar o escopo visivel:

- "Salvar regra para o tenant Acme Logistica".
- "Exportar auditoria da unidade Campinas".
- "Desativar integracao no ambiente de producao".

## Inteligencia Artificial

Usar linguagem precisa:

- "Previsao".
- "Sugestao".
- "Classificacao".
- "Confianca".
- "Historico considerado".

Evitar:

- "A IA sabe".
- "Resultado garantido".
- "Automacao sem erro".

Sempre que possivel, explicar de forma curta por que uma recomendacao foi exibida.
