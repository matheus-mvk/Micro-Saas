# Analise De Lacunas Da Simulacao Logistica

Data: 2026-07-25

Escopo: analise read-only de simulacao de frete, precificacao e operacao logistica downstream.

## Estado Atual

O repositorio atual possui somente um modelo de persistencia relacionado a simulacao:

- `FreightSimulation` em `apps/api/prisma/schema.prisma`.

A seed cria uma linha demo calculada com valores estaticos:

- origin postal code `01001000`
- destination postal code `20040002`
- real weight `42.500`
- cubic weight `38.200`
- estimated price `128.90`
- estimated deadline `3`
- metadata route text

Nao ha controller de simulacao, service, motor de precificacao de dominio, modelo de servico de transportadora, modelo de cobertura, modelo de tabela de frete, modelo de faixa de frete, modelo de opcao de simulacao, modelo de selecao, modelo de shipment, modelo de tracking ou pagina frontend de simulacao.

## Fluxo Exigido Vs Evidencia Atual

| Requisito | Status atual | Evidencia | Lacuna |
| --- | --- | --- | --- |
| Cliente opcional | PARTIALLY_IMPLEMENTED | `FreightSimulation.customerId` existe | Nenhum endpoint valida cliente por tenant ou preserva snapshot do cliente. |
| Enderecos de origem/destino | PARTIALLY_IMPLEMENTED | Campos de postal code existem | Sem endereco completo, cidade/estado/pais, coordenadas ou snapshots. |
| Multiplos volumes | NOT_IMPLEMENTED | Sem tabela/modelo de volume | Sem quantidade, peso/dimensoes por pacote ou agregacao de volumes. |
| Peso real | PARTIALLY_IMPLEMENTED | `realWeightKg` existe | Sem validacao de entrada ou calculo a partir de multiplos volumes. |
| Peso cubado | PARTIALLY_IMPLEMENTED | `cubicWeightKg` existe | Sem formula, fonte do fator, conversao de unidade ou testes. |
| Peso taxavel | NOT_IMPLEMENTED | Sem campo/engine | Deve usar max(real, cubado) ou regra documentada da transportadora. |
| Elegibilidade de transportadora/servico | NOT_IMPLEMENTED | Sem modelos de carrier service/coverage | Nao consegue filtrar servicos ativos, limites de peso ou cobertura. |
| Busca de tabela de frete | NOT_IMPLEMENTED | Sem modelo de tabela de frete | Nao consegue selecionar tabela ativa/vigencia/versao/range. |
| Breakdown de taxas | NOT_IMPLEMENTED | Sem modelo de opcao/breakdown | Sem breakdown de base, minimo, por kg, ad valorem, GRIS, pedagio, seguro, desconto ou total. |
| Multiplas opcoes | NOT_IMPLEMENTED | Sem tabela de opcao de simulacao | Nao consegue comparar transportadoras/servicos, opcao mais barata ou mais rapida. |
| Motivos de indisponibilidade | NOT_IMPLEMENTED | Sem motor de elegibilidade | Nao consegue explicar sem cobertura, servico inativo ou limites de peso. |
| Calculo deterministico | NOT_IMPLEMENTED | Valores sao inseridos diretamente na seed | Sem servico puro de precificacao ou testes unitarios. |
| Preservacao historica | PARTIALLY_IMPLEMENTED | Campos estimados armazenados e metadata JSON | Sem versao de tabela, breakdown de opcao, snapshots de regra ou snapshots de endereco. |
| Selecionar opcao | NOT_IMPLEMENTED | Sem campo de opcao/selecao | Nao consegue selecionar, desselecionar ou auditar selecao. |
| Criar shipment | NOT_IMPLEMENTED | Sem modelo/API de shipment | Nao consegue transformar simulacao em operacao. |
| Listagem/detalhe de historico | NOT_IMPLEMENTED | Sem endpoint/pagina | Nao consegue consultar ou inspecionar registros persistidos de simulacao. |
| Integracao com dashboard | PARTIALLY_IMPLEMENTED | Dashboard conta simulacoes e preco estimado medio | Faltam KPIs logisticos exigidos e filtros. |

## Lacunas Do Motor De Precificacao

O repositorio nao possui servico de dominio responsavel por:

- normalizar unidades;
- calcular peso fisico total;
- calcular volume total;
- calcular peso cubado;
- calcular peso taxavel;
- selecionar cobertura;
- selecionar tabela de frete e faixa de frete;
- aplicar valor minimo;
- aplicar preco base e preco por kg;
- aplicar ad valorem, GRIS, pedagio, seguro, taxas extras e descontos;
- calcular prazo e data estimada de entrega;
- retornar breakdown explicavel;
- preservar versao de regra e entradas.

## Adicoes Obrigatorias Ao Modelo De Dados

O prompt de implementacao deve exigir, no minimo:

- `CarrierService`
- `ServiceCoverage`
- `FreightRateTable`
- `FreightRateVersion` ou campos explicitos de versao
- `FreightRateBand`
- `FreightRateAdditionalFee` ou configuracao estruturada de taxas
- `FreightSimulationVolume`
- `FreightSimulationOption`
- `FreightSimulationSelectedOption` ou relacao de opcao selecionada
- estruturas de snapshot de endereco para simulacao e shipment
- `Shipment`
- `ShipmentVolume`
- `TrackingEvent`

## Endpoints Obrigatorios

Endpoints minimos para completar simulacao:

- `POST /api/v1/freight-simulations`
- `GET /api/v1/freight-simulations`
- `GET /api/v1/freight-simulations/:id`
- `POST /api/v1/freight-simulations/:id/select-option`
- `POST /api/v1/freight-simulations/:id/shipments`
- endpoints de apoio para transportadoras/servicos/cobertura/tabelas de frete.

Todos os endpoints devem derivar `tenantId` do contexto autenticado e nunca aceitar selecao de tenant pelo frontend.

## Telas Frontend Obrigatorias

- formulario de simulacao com origem/destino, consulta de CEP, cliente opcional, valor da carga e multiplos volumes;
- comparacao de resultados com flags de menor preco/menor prazo;
- drawer/modal de detalhe da opcao com breakdown completo;
- servicos/motivos indisponiveis;
- listagem de historico com filtros e paginacao;
- pagina de detalhe de historico;
- acao de criar shipment e feedback de sucesso.

## Criterios De Aceite Para Simulacao

Uma simulacao esta completa somente quando o avaliador puder:

1. fazer login como `administrador@dev.com`;
2. criar ou selecionar um cliente;
3. preencher origem e destino por CEP e editar manualmente;
4. adicionar multiplos volumes com quantidade, peso e dimensoes;
5. calcular peso real, cubado e taxavel de forma deterministica;
6. identificar transportadoras/servicos ativos elegiveis por cobertura e limites;
7. localizar tabela de frete e faixa de peso vigentes;
8. calcular todos os componentes de taxa com precisao Decimal-safe;
9. gerar multiplas opcoes persistidas;
10. exibir opcoes mais barata e mais rapida;
11. exibir breakdown completo e explicavel;
12. persistir entradas originais, volumes, versoes de regra e opcoes;
13. listar e filtrar historico a partir do banco;
14. selecionar uma opcao transacionalmente;
15. criar shipment a partir da opcao selecionada;
16. auditar criacao de simulacao e selecao;
17. impedir acesso cross-tenant;
18. passar testes unitarios, integration e e2e.

## Risco

A UI atual e o dashboard podem dar a impressao de que a simulacao existe, mas os unicos dados de simulacao sao dados de seed e nao ha jornada funcional de calculo de frete. Isso deve ser tratado como `PARTIALLY_IMPLEMENTED`, nao como completo.
