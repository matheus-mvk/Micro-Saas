# Plano De Implementacao Da Simulacao De Frete

Data: 2026-07-25

Este plano contem somente o trabalho ainda necessario para tornar a simulacao de frete funcional. Ele assume que autenticacao existente, validacao de refresh para usuario ativo, fundacao realtime tenant-scoped, CRUD de clientes e pagina `/customers` permanecem no lugar e sao reutilizados.

## Onda 0 - Estabilizacao

1. Corrigir falha de inicializacao do Vitest na API/web.
2. Corrigir ou documentar runtime de lint e fazer o lint concluir.
3. Reexecutar typecheck/build depois de cada onda.
4. Validar schema Prisma e migration atual.
5. Definir modelo relacional final e ownership dos arquivos compartilhados:
   - `schema.prisma`;
   - migrations;
   - DTOs compartilhados;
   - contexto auth/tenant;
   - layout/navegacao global;
   - Docker/env.
6. Adicionar notas de execucao para banco MySQL de teste sem operacoes destrutivas em dados existentes.

## Onda 1 - Cadastros Para Simulacao

1. Adicionar enderecos de clientes ao modulo existente de clientes.
2. Implementar CRUD de filiais e campos de endereco/filial principal.
3. Implementar CRUD de transportadoras reutilizando o modelo `Carrier` existente quando possivel e adicionando campos ausentes somente por migration revisada.
4. Implementar servicos/modalidades de transporte de transportadoras.
5. Implementar regras de cobertura e teste de elegibilidade de rota.
6. Adicionar paginas frontend:
   - detalhe/enderecos de cliente ou gestao de enderecos dentro de `/customers`;
   - filiais/configuracoes;
   - transportadoras;
   - servicos de transportadora;
   - cobertura.

## Onda 2 - Precificacao

1. Adicionar modelos de tabela de frete, versionamento e vigencia.
2. Adicionar faixas/ranges com validacao de sobreposicao.
3. Adicionar modelo de cobranca adicional.
4. Implementar servicos puros de dominio:
   - `UnitNormalizationService`;
   - `VolumetricWeightService`;
   - `ChargeableWeightService`;
   - `FreightPricingEngine`.
5. Adicionar testes unitarios antes de conectar o motor aos controllers.
6. Adicionar gestao frontend de tabela de frete.

## Onda 3 - Integracoes

1. Implementar adapter de CEP usando ViaCEP ou BrasilAPI.
2. Implementar adapter de distancia/rota usando OpenRouteService ou equivalente justificado.
3. Adicionar timeout, retry, cache e fallback.
4. Adicionar variaveis de ambiente e documentacao.
5. Adicionar mocks/testes para sucesso, resposta invalida, timeout e provedor indisponivel.

## Onda 4 - Simulacao

1. Expandir modelos de simulacao:
   - enderecos;
   - volumes;
   - opcoes;
   - componentes de preco;
   - motivos de servico indisponivel.
2. Implementar endpoint de criacao/calculo de simulacao.
3. Usar seletor de cliente existente das APIs `/customers`.
4. Implementar pagina frontend de simulacao:
   - origem/destino;
   - consulta de CEP;
   - valor da carga;
   - multiplos volumes;
   - filtros de servico/transportadora;
   - estados de carregamento/erro/sucesso.
5. Exibir comparacao de resultados com flags de menor preco/menor prazo e breakdown.

## Onda 5 - Historico E Selecao

1. Implementar endpoints de listagem/detalhe de historico.
2. Adicionar filtros e paginacao.
3. Implementar pagina de historico e pagina de detalhe.
4. Implementar transacao de selecao de opcao.
5. Auditar criacao de simulacao e selecao de opcao.
6. Garantir que simulacoes antigas nunca recalculam silenciosamente apos mudancas de tabela.

## Onda 6 - Operacao

1. Adicionar modelos de shipment e criacao de shipment a partir da opcao selecionada.
2. Persistir snapshots de endereco/volume do shipment.
3. Adicionar status/evento inicial de tracking.
4. Adicionar UI de detalhe de shipment suficiente para comprovar que a operacao foi criada.

## Onda 7 - Inteligencia

1. Expandir KPIs de dashboard usando simulacoes/opcoes/shipments.
2. Adicionar indicadores especificos de simulacao:
   - total de simulacoes;
   - frete medio;
   - menor opcao media;
   - economia estimada;
   - distribuicao de transportadora/servico selecionados;
   - shipments criados a partir de simulacoes.
3. Adicionar insights deterministicos a partir do historico de simulacao.

## Onda 8 - Validacao

1. Expandir seed para narrativa demo completa.
2. Rodar seed duas vezes e provar ausencia de duplicidade.
3. Adicionar testes de integracao para a transacao completa de simulacao.
4. Adicionar fluxo E2E login -> simulation -> option -> shipment -> dashboard.
5. Adicionar testes cross-tenant.
6. Executar comandos finais:
   - lint;
   - typecheck;
   - tests;
   - build;
   - Prisma validate;
   - Docker Compose config/build.

## Aceite Final

O fluxo esta completo somente quando uma simulacao real puder ser executada de ponta a ponta usando transportadoras, servicos, cobertura e tabelas de frete persistidas. O resultado deve ser deterministico, explicavel, salvo no historico, isolado por tenant e coberto por testes automatizados.

## Status De Execucao Apos Implementacao De 2026-07-25

As ondas principais de implementacao foram aplicadas no repositorio:

- Onda 1: enderecos de clientes, filiais, transportadoras, servicos e cobertura foram adicionados aos contratos backend e aos dados de seed.
- Onda 2: tabelas de frete, ranges, cobrancas adicionais e motor deterministico de precificacao foram adicionados.
- Onda 3: consulta de CEP foi adicionada via ViaCEP com fallback; distancia de rota atualmente usa fallback local deterministico, exceto quando coordenadas sao fornecidas.
- Onda 4: endpoints de criacao/listagem/detalhe de simulacao de frete e UI `/freight/simulate` foram adicionados.
- Onda 5: listagem de historico e selecao de opcao foram adicionadas.
- Onda 6: criacao de Shipment a partir de opcao selecionada com snapshots foi adicionada.
- Onda 7: resumo do dashboard inclui metricas de opcoes de simulacao e Shipment gerado.
- Onda 8: seed foi expandida, mas validacao ativa de migration/seed/E2E permanece bloqueada neste ambiente WSL porque Docker esta indisponivel e MySQL nao estava acessivel.

Pendencias antes do aceite final:

1. Corrigir falha de inicializacao do Vitest (`SyntaxError: Unexpected token '*'`) para os testes executarem.
2. Rodar migrations em ambiente com MySQL habilitado.
3. Rodar seed duas vezes e provar idempotencia no banco.
4. Executar E2E no navegador login -> simulation -> option selection -> Shipment -> dashboard.
5. Substituir ou configurar a integracao de rota com provedor externo real quando validacao publica de distancia for obrigatoria.
