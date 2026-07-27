# Lacunas De Teste Da Simulacao De Frete

Data: 2026-07-25

## Estado Atual Do Test Runner

Bloqueio atual conhecido:

- `npx pnpm --filter @logistics/api test` falha antes das specs com `SyntaxError: Unexpected token '*'`.
- `npx pnpm --filter @logistics/web test` falha antes das specs com o mesmo erro.

Existem testes para auth/token/senha/tentativas de login, request context, realtime gateway, erros HTTP, Redis, login/landing/provider/http-client frontend e basicos do pacote compartilhado. Eles nao estao atualmente executaveis no ambiente local observado.

## Cobertura De Teste Ausente Para Simulacao

| Area | Cobertura atual | Cobertura obrigatoria |
| --- | --- | --- |
| Enderecos de clientes | Nenhuma | Testes unit/integration para CRUD, regra de endereco principal, consulta CEP, isolamento de tenant e snapshots. |
| Filiais | Nenhuma | CRUD, filial principal, filtro de filial ativa, selecao de origem e isolamento de tenant. |
| Transportadoras | Nenhuma | CRUD, unicidade de document/code, filtro de ativos e auditoria. |
| Servicos de transportadora | Nenhuma | Codigo de servico unico, modalidade, fator cubico, limites de peso e filtro de ativos. |
| Cobertura | Nenhuma | Regras postais/cidade/estado, validacao de sobreposicao, motivos indisponiveis e rejeicao cross-tenant. |
| Tabelas de frete | Nenhuma | Versionamento, vigencia, comportamento ativo/inativo, auditoria e preservacao historica. |
| Ranges de frete | Nenhuma | Nao sobreposicao, valores de limite, comportamento min/max e max nulo. |
| Cobrancas adicionais | Nenhuma | Fixa, ad valorem, GRIS, pedagio, seguro, taxas extras e descontos. |
| Normalizacao de unidade | Nenhuma | cm para m, gramas para kg se suportado e rejeicao de unidades invalidas. |
| Peso volumetrico | Nenhuma | Multiplos pacotes, quantidade, volume m3 e fator cubico. |
| Peso taxavel | Nenhuma | max(real, cubado), override especifico de servico se implementado. |
| Motor de precificacao | Nenhuma | Totais deterministicos, precisao Decimal, arredondamento e soma do breakdown igual ao total. |
| Adapter CEP | Nenhuma | CEP valido, CEP ausente, timeout, retry, cache e fallback. |
| Adapter de rota | Nenhuma | Rota valida, timeout, retry, cache, fallback e configuracao externa ausente. |
| API de simulacao | Nenhuma | Criacao/calculo, validacao, isolamento de tenant, opcoes indisponiveis e auditoria. |
| UI de simulacao | Nenhuma | Validacao de formulario, loading/error/empty/success, comparacao de resultados e breakdown. |
| Historico | Nenhuma | Filtros server-side, paginacao, detalhe e valores historicos imutaveis. |
| Selecao de opcao | Nenhuma | Transacao, uma opcao selecionada, rejeicao cross-tenant e auditoria. |
| Criacao de shipment | Nenhuma | Cria shipment uma vez a partir de opcao selecionada, snapshots de valores e tracking inicial. |
| Dashboard | Apenas endpoint basico, sem testes dedicados | KPIs a partir de simulacoes/opcoes/shipments persistidos e filtros de tenant. |
| Insights | Nenhuma | Insights deterministicos com limites e evidencia. |
| E2E | Apenas smoke de landing | Login -> customer -> rate setup -> simulation -> option -> shipment -> dashboard. |

## Camadas De Teste Obrigatorias

### Unit

- calculos puros de precificacao;
- normalizacao de unidade;
- peso volumetrico;
- peso taxavel;
- selecao de range;
- aplicacao de taxas;
- calculo de data/prazo;
- mapeamento de adapter e decisoes de fallback.

### Integration

- repositories/use cases com Prisma contra banco de teste;
- isolamento de tenant para toda listagem/detalhe/mutation;
- consultas de cobertura e tabela de frete;
- transacao de simulacao cria todos os registros filhos;
- transacao de selecao de opcao;
- transacao de criacao de shipment;
- escritas de auditoria com metadata sanitizada.

### Componente Frontend

- validacao do formulario de simulacao;
- adicionar/remover multiplos volumes;
- estados de consulta CEP;
- cards de resultado;
- drawer/modal de breakdown;
- servicos indisponiveis;
- filtros de historico;
- acao de criacao de shipment;
- cards de dashboard.

### E2E

Fluxo E2E minimo final:

1. abrir landing;
2. fazer login como `administrador@dev.com`;
3. abrir `/customers` e selecionar ou criar um cliente;
4. abrir pagina de simulacao;
5. consultar CEP de origem/destino;
6. adicionar multiplos volumes;
7. executar simulacao;
8. verificar multiplas opcoes e breakdown;
9. selecionar opcao mais barata;
10. criar shipment;
11. verificar alteracao de indicador do dashboard;
12. fazer logout.

### Cross-Tenant

Testes automatizados devem provar que:

- tenant A nao consegue ler ou usar clientes, enderecos, transportadoras, servicos, tabelas de frete, simulacoes, opcoes ou shipments do tenant B;
- agregados do dashboard nao misturam tenants;
- eventos realtime de importacao/simulacao/shipment nao cruzam tenants;
- seed cria um segundo tenant com dados suficientes para testar isolamento.

## Aceite De Testes Para Futuro Executor

O fluxo de simulacao nao pode ser marcado como completo ate que:

- inicializacao do Vitest esteja corrigida;
- scripts de teste de API e web passem;
- pelo menos um teste de integracao use MySQL/Prisma para a transacao completa de simulacao;
- Playwright cubra o caminho principal de simulacao;
- testes cross-tenant cubram acesso direto por ID de recurso e agregacao de listagem;
- motor de precificacao tenha testes unitarios deterministicos para todos os componentes de calculo.
