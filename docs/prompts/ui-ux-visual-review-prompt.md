# PROMPT EXECUTOR — REVISÃO UI/UX, CONTRASTE E PORTUGUÊS BRASILEIRO

Atue como `ui-ux-specialist` em conjunto com `frontend-specialist`.

Esta execução tem escopo visual, textual e de experiência. Não implemente novas regras de negócio, não altere arquitetura e não faça refatoração ampla. O objetivo é revisar e corrigir a interface real da plataforma logística para demonstração, garantindo contraste, hierarquia visual, responsividade, acessibilidade e acentuação correta em português brasileiro.

## Telas obrigatórias

Revise diretamente no código e, quando possível, em runtime:

- `/freight/simulate` — simulação de frete;
- `/customers` — clientes;
- `/users` — usuários;
- `/branches` — filiais;
- `/freight/history` — histórico de simulações;
- `/shipments` — Shipments;
- `/carriers` — transportadoras;
- `/imports` — importações;
- `/insights` — insights;
- `/freight-tables` — tabelas de frete;
- `/audit` — auditoria;
- `/settings/profile` — perfil.

Inclua também páginas de detalhe, cadastro e edição dessas áreas quando existirem.

## Problema conhecido

Na tela de simulação de frete, botões ficaram com texto branco sobre fundo sem cor/baixo contraste porque a interface utilizava tokens inexistentes ou inadequados. Validar se o mesmo padrão ocorre em outras telas.

Botões primários e ações importantes devem usar verde consistente da marca (`--color-green` ou equivalente), com:

- contraste AA no mínimo;
- estado hover;
- estado active;
- estado disabled legível;
- foco visível por teclado;
- sem texto branco sobre fundo branco;
- sem botões invisíveis em cards ou painéis claros.

## Revisão visual

Para cada tela, verificar e corrigir:

- títulos, subtítulos e breadcrumbs;
- botões primários, secundários e destrutivos;
- filtros;
- formulários;
- tabelas;
- cards;
- badges;
- modais ou drawers;
- empty states;
- loading states;
- error states;
- success feedback;
- links e ações;
- espaçamento;
- alinhamento;
- responsividade em desktop, notebook, tablet e celular;
- ausência de overflow horizontal;
- contraste de texto, bordas e botões;
- consistência com a identidade visual do produto logístico.

Não usar arrays estáticos ou mocks para mascarar tela vazia. Se a tela depende de API, manter estados de carregamento, vazio, erro e retry.

## Acessibilidade

Corrigir problemas evidentes de:

- labels;
- nomes acessíveis de botões;
- `aria-label` quando necessário;
- hierarquia de headings;
- foco visível;
- navegação por teclado;
- contraste;
- mensagens de erro associadas ao contexto;
- feedback que não dependa apenas de cor;
- respeito a `prefers-reduced-motion`.

## Ambiente local lento e timeout

Considerar que o ambiente de demonstração pode ter limitação de hardware, memória e velocidade de processamento.

Validar:

- `NEXT_PUBLIC_API_TIMEOUT_MS` configurado com valor tolerante para ambiente local lento;
- requisições longas não falham cedo demais em telas pesadas;
- telas exibem loading claro durante operações demoradas;
- botões ficam desabilitados durante envio para evitar duplicidade;
- mensagens de erro diferenciam indisponibilidade da API de validações de formulário;
- retries manuais estão disponíveis quando fizer sentido;
- a interface não parece travada durante importações, simulações, dashboard, insights e listagens grandes.

Não remover timeout completamente. Usar timeout finito e documentado.

## Português brasileiro

Revisar todos os textos visíveis das telas listadas e corrigir acentuação, gramática e termos técnicos.

Exemplos a corrigir:

- `Simulacao` → `Simulação`;
- `Historico` → `Histórico`;
- `Opcoes` → `Opções`;
- `Operacao` → `Operação`;
- `Comparacao` → `Comparação`;
- `logisticos` → `logísticos`;
- `servicos` → `serviços`;
- `nao` → `não`;
- `preco` → `preço`;
- `rapida` → `rápida`;
- `Nao foi possivel concluir a operacao` → `Não foi possível concluir a operação`.

Manter siglas e termos de domínio quando forem apropriados:

- `Shipment`;
- `tenant`;
- `MFA`;
- `OAuth`;
- `CSV`;
- `XLSX`;
- `CEP`;
- `CNPJ`;
- `CPF`.

## Critérios de aceite por tela

Uma tela só pode ser marcada como revisada quando:

- não possuir botão invisível ou com contraste insuficiente;
- não possuir textos sem acentuação em português brasileiro;
- ações principais estiverem visualmente destacadas;
- ações secundárias estiverem distinguíveis sem competir com a primária;
- estados loading, empty, error e success estiverem visualmente consistentes;
- formulários forem legíveis e usáveis em mobile;
- tabelas não quebrarem a viewport;
- foco por teclado for visível;
- não houver `href="#"`, botão sem ação ou placeholder visual no escopo da tela.

## Validação leve

Não execute build global nem Docker build.

Execute apenas:

- busca por termos sem acento nas telas revisadas;
- `git diff --check`;
- typecheck do frontend se o ambiente permitir;
- inspeção visual manual ou screenshot quando o servidor estiver disponível.

Se o ambiente bloquear validação, registrar claramente.

## Entrega esperada

Ao final, informe:

- telas revisadas;
- telas alteradas;
- problemas de contraste corrigidos;
- termos de português brasileiro corrigidos;
- componentes ou CSS alterados;
- validações leves executadas;
- pendências visuais reais, se existirem.
