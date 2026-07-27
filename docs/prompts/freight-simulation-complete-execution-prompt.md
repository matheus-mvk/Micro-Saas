# Prompt Completo De Execucao Da Simulacao De Frete

Voce e o Codex trabalhando em `/mnt/c/projetos/micro-saas`.

Este e um prompt de execucao de implementacao somente para o fluxo de simulacao de frete. Nao refaca a fundacao que ja funciona, exceto quando for necessario para integrar o fluxo.

## Fundacao Existente Para Reutilizar

Confirme diretamente no codigo e reutilize:

- endpoints basicos de autenticacao e sessao;
- validacao de refresh token recusando usuarios nao `ACTIVE`;
- contexto de tenant a partir da requisicao autenticada;
- isolamento realtime de tenant derivado de token/cookie autenticado;
- CRUD inicial de clientes em `/api/v1/customers`;
- paginacao server-side de clientes;
- validacao CPF/CNPJ em `CustomersService`;
- auditoria `CUSTOMER_CHANGED` em mutations de cliente;
- pagina frontend `/customers`;
- fundacao de resumo do dashboard.

Nao reconstrua esses itens do zero. Estenda apenas onde o fluxo de simulacao exigir, como enderecos de cliente ou selecao de cliente.

## Bloqueios Conhecidos Para Corrigir Primeiro

- Vitest da API/web falha antes das specs com `SyntaxError: Unexpected token '*'`.
- Build Web compila, mas validacao local do Next nao terminou.
- Lint ficou inconclusivo.
- Seed esta incompleta para simulacao.
- Nenhum E2E cobre o fluxo.

## Fluxo Funcional Alvo

O avaliador final deve conseguir:

1. autenticar com usuario demo;
2. selecionar ou criar cliente;
3. selecionar origem;
4. selecionar destino;
5. consultar enderecos por CEP;
6. informar valor da carga;
7. informar multiplos pacotes/volumes;
8. calcular peso real;
9. calcular volume;
10. calcular peso cubado;
11. calcular peso taxavel;
12. calcular distancia;
13. localizar transportadoras ativas;
14. localizar servicos ativos de transportadora;
15. validar cobertura;
16. localizar tabelas de frete ativas por vigencia;
17. localizar faixas de peso;
18. calcular preco base;
19. aplicar valor minimo;
20. aplicar preco por quilograma;
21. aplicar ad valorem;
22. aplicar GRIS;
23. aplicar pedagio;
24. aplicar seguro;
25. aplicar acrescimos e descontos;
26. calcular prazo;
27. gerar opcoes;
28. marcar melhor preco;
29. marcar melhor prazo;
30. exibir breakdown;
31. salvar simulacao;
32. consultar historico;
33. selecionar uma opcao;
34. gerar um Shipment;
35. ver a operacao nos indicadores.

## Regras

- Nao use `Math.random` para resultados de frete.
- Nao hardcode numeros de frete no frontend.
- Nao calcule preco no frontend.
- Nao use JavaScript `number`/MySQL float para dinheiro.
- Nao precifique transportadoras ou servicos inativos.
- Nao precifique servicos sem cobertura.
- Nao use regras fora da vigencia.
- Nao recalcule simulacoes historicas silenciosamente.
- Nao use JSON como substituto de modelos relacionais. JSON e aceitavel somente para metadata/snapshots imutaveis e limitados, com justificativa.
- Toda query operacional deve usar tenant do contexto autenticado no servidor.
- Toda mutation deve auditar acoes relevantes de simulacao/tabela/shipment com metadata sanitizada.

## Onda 0 - Estabilizacao

1. Corrigir inicializacao do Vitest para API e web.
2. Corrigir runtime de lint para `pnpm lint` concluir.
3. Rodar baseline:
   - `pnpm typecheck`;
   - `pnpm test`;
   - `pnpm build`;
   - `pnpm --filter @logistics/api exec prisma validate`;
   - `docker compose config`.
4. Confirmar contratos compartilhados e ownership de:
   - `schema.prisma`;
   - migrations;
   - `packages/shared/src/index.ts`;
   - contexto auth/tenant;
   - app shell/navegacao frontend.
5. Definir ERD final de simulacao com Senior MySQL Database Analyst antes da migration.

## Onda 1 - Cadastros

Implementar somente pecas ausentes:

### Enderecos De Clientes

- Adicionar modelo `CustomerAddress` com `tenantId`, `customerId`, type, postal code, street, number, complement, district, city, state, country, coordinates, main/pickup/delivery flags e timestamps ativos.
- Adicionar endpoints sob customers ou addresses.
- Adicionar UI para enderecos de clientes, reutilizando `/customers`.
- Manter CRUD existente de clientes intacto.

### Filiais

- Estender ou relacionar `Branch` com endereco/contato/filial principal.
- Adicionar endpoints/paginas de CRUD de filial.
- Tornar filial ativa selecionavel como origem da simulacao.

### Transportadoras

- Adicionar endpoints/paginas de CRUD de transportadoras usando o modelo `Carrier` existente e migration para campos ausentes quando necessario.
- Preservar unicidade por tenant e filtro de ativos.

### Servicos De Transporte Da Transportadora

- Adicionar modelo `CarrierService` com carrier, code, name, modality, description, default deadline, cubic factor, min/max weight, minimum value e active status.
- Garantir codigo de servico unico por transportadora e tenant.
- Adicionar endpoints/paginas.

### Cobertura

- Adicionar modelo `CarrierCoverage` para cobertura origem/destino por postal range, city/state/region ou estrategia documentada.
- Adicionar CRUD de cobertura e endpoint de teste de rota.
- Validar sobreposicao e status ativo.

## Onda 2 - Precificacao

Adicionar modelos e migrations:

- `FreightRateTable`;
- `FreightRateRange`;
- `FreightAdditionalCharge`;
- indices revisados por especialista MySQL.

Implementar:

- CRUD de tabela de frete;
- versao e vigencia;
- CRUD de range com validacao de sobreposicao;
- CRUD de charge para fixed, ad valorem, GRIS, toll, insurance, additions e discounts;
- auditoria em mudancas de precificacao.

### Contratos De Calculo

Unidades:

- dimensoes informadas em centimetros;
- peso informado em quilogramas;
- volume calculado em metros cubicos;
- distancia em quilometros;
- moeda BRL por padrao, exceto quando a tabela definir outra moeda.

Formulas:

- volume por pacote m3 = `(lengthCm / 100) * (widthCm / 100) * (heightCm / 100) * quantity`;
- peso real total kg = soma de `weightKg * quantity`;
- volume total m3 = soma dos volumes dos pacotes;
- peso cubado kg = `totalVolumeM3 * cubicFactor`;
- peso taxavel kg = `max(realWeightKg, cubicWeightKg)`, exceto quando regra explicita do servico definir outra coisa;
- data estimada de entrega = data desejada de envio mais prazo do servico/range em dias uteis/calendario conforme regra documentada.

Dinheiro e arredondamento:

- usar Prisma Decimal/decimal library para todas as operacoes de dinheiro e precisao;
- persistir valores monetarios como `DECIMAL`;
- arredondar componentes monetarios persistidos para 2 casas decimais;
- total final deve ser igual a soma dos componentes persistidos.

Testes unitarios devem cobrir:

- normalizacao de unidade;
- volume;
- peso cubado;
- peso taxavel;
- limites de faixa de frete;
- preco minimo;
- taxa fixa;
- preco por kg;
- peso excedente;
- ad valorem;
- GRIS;
- pedagio;
- seguro;
- acrescimos;
- descontos;
- prazo;
- soma do breakdown.

## Onda 3 - Integracoes

Implementar:

- adapter de CEP usando ViaCEP ou BrasilAPI;
- adapter de rota/distancia usando OpenRouteService ou equivalente justificado;
- timeout;
- retry limitado a tentativas seguras;
- cache com chave tenant-aware ou provider-aware quando apropriado;
- comportamento de fallback documentado;
- logs estruturados sem dados sensiveis;
- variaveis de ambiente em `.env.example`;
- testes com mocks para sucesso, timeout, servico indisponivel e payload invalido.

Nao contar provedores OAuth como integracoes logisticas.

## Onda 4 - Simulacao

Adicionar ou expandir modelos:

- `FreightSimulation` com `createdById`, relacao de branch/customer quando aplicavel e status;
- `FreightSimulationAddress`;
- `FreightSimulationPackage`;
- `FreightSimulationOption`;
- `FreightSimulationPriceComponent`.

Implementar endpoints:

- `POST /api/v1/freight-simulations`;
- `GET /api/v1/freight-simulations`;
- `GET /api/v1/freight-simulations/:id`;
- `POST /api/v1/freight-simulations/:id/recalculate` somente se documentado e nunca alterando resultado historico silenciosamente.

Processamento:

1. validar entrada;
2. validar cliente/filial/enderecos dentro do tenant;
3. consultar CEP/rota quando solicitado;
4. normalizar unidades;
5. computar pesos;
6. carregar transportadoras/servicos ativos;
7. validar cobertura;
8. encontrar tabela de frete ativa por data;
9. encontrar range correspondente;
10. precificar opcao;
11. persistir simulacao, enderecos, pacotes, opcoes e componentes de preco em uma transacao;
12. persistir motivos de servico indisponivel;
13. auditar criacao.

Frontend:

- criar rota `/freight/simulate` ou equivalente;
- seletor de cliente usando API existente de customers;
- formulario de origem/destino com consulta de CEP;
- editor de multiplos pacotes;
- valor da carga;
- estado de envio;
- comparacao de resultados;
- flags de menor preco/menor prazo;
- drawer/modal de breakdown;
- lista de servicos indisponiveis.

## Onda 5 - Historico E Selecao

Implementar:

- endpoints de listagem/detalhe de historico com filtros:
  - periodo;
  - cliente;
  - usuario;
  - transportadora;
  - servico;
  - origem/destino;
  - faixa de valor;
  - opcao selecionada;
  - com/sem shipment.
- paginas frontend de historico.
- endpoint de selecao de opcao:
  - `POST /api/v1/freight-simulations/:id/options/:optionId/select`.
- transacao de selecao com uma opcao selecionada por simulacao.
- acao de auditoria para selecao de opcao.

Aceite:

- selecionar uma opcao de outro tenant ou outra simulacao falha.
- valores e componentes de opcoes historicas nunca mudam quando tabelas de frete sao editadas depois.

## Onda 6 - Operacao

Implementar:

- `Shipment`;
- `ShipmentAddress`;
- `ShipmentPackage`;
- evento/status inicial minimo de tracking.

Endpoint:

- `POST /api/v1/freight-simulations/:id/shipments`.

Regras:

- shipment pode ser criado a partir de opcao selecionada;
- snapshots preservam origem/destino e pacotes;
- valor do frete e igual a opcao historica selecionada;
- criacao duplicada de shipment a partir da mesma opcao selecionada e impedida;
- auditar criacao de shipment.

UI:

- acao a partir da opcao selecionada/detalhe de historico;
- estado de sucesso de shipment;
- pagina ou painel minimo de detalhe de shipment.

## Onda 7 - Inteligencia

Expandir dashboard e insights:

- total de simulacoes;
- simulacoes por periodo;
- frete cotado medio;
- menor opcao media;
- economia estimada entre selecionada e alternativas;
- distribuicao de transportadoras/servicos;
- shipments gerados a partir de simulacoes;
- frequencia de rotas;
- motivos de atraso/indisponibilidade se houver dados.

Implementar insights deterministicos de simulacao:

- transportadora/servico mais barato no periodo;
- rota com maior custo;
- servicos frequentemente indisponiveis por cobertura;
- economia potencial quando a opcao selecionada nao foi a mais barata;
- alta concentracao de cobranca por tipo de taxa.

Cada insight deve possuir evidencia, limite, periodo, severidade e tenant.

## Onda 8 - Validacao

Seed:

- usuario demo `administrador@dev.com` / `@DEV1512`;
- dois tenants;
- filiais com enderecos;
- clientes com enderecos;
- transportadoras;
- servicos de transportadora;
- coberturas;
- tabelas de frete;
- ranges;
- cobrancas adicionais;
- simulacoes com opcoes;
- opcao selecionada;
- shipment gerado a partir de simulacao;
- tracking inicial;
- dados de dashboard/insight;
- dados cross-tenant.

Validacao:

- seed duas vezes sem duplicidade;
- testes unitarios para engine;
- testes de integracao para transacao de simulacao;
- testes cross-tenant;
- E2E login -> customer -> simulation -> option -> shipment -> dashboard;
- `pnpm lint`;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm test:e2e`;
- `pnpm build`;
- Prisma validate;
- Docker Compose config/build.

## Resposta Final Obrigatoria Para Executor

Reportar:

- modelos/migrations criados;
- endpoints implementados;
- paginas implementadas;
- testes adicionados/executados;
- indices adicionados;
- configuracao externa exigida;
- resultado da seed duas vezes;
- resultado cross-tenant;
- se o fluxo completo de simulacao funciona de ponta a ponta;
- limitacoes.

Nao declare conclusao se uma simulacao real persistida nao conseguir gerar opcoes a partir de servicos de transportadora, cobertura e tabelas de frete.
