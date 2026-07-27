# Seed de Homologação

A seed de demonstração representa duas empresas logísticas em operação, com dados coerentes para navegação visual e funcional da plataforma.

## Execução

Em desenvolvimento:

```bash
pnpm --filter @logistics/api db:seed
```

Com Docker:

```bash
docker compose build api
docker compose run --rm api pnpm --filter @logistics/api db:seed
```

A seed é idempotente para os tenants demonstrativos. Antes de recriar os dados, ela remove apenas os tenants:

- `alpha-logistics`;
- `beta-transportes`;
- `demo-logistics`;
- `satellite-logistics`.

Outros tenants não são removidos.

Em produção, a seed é bloqueada por padrão. Para execução intencional em ambiente público de demonstração, defina `ALLOW_DEMO_SEED=true`.

## Credenciais

Senha padrão para todos os usuários de homologação:

```text
@DEV1512
```

Tenant Alpha Logistics:

- `administrador@dev.com` — ADMIN;
- `supervisor@alphalogistics.dev` — MANAGER, MFA habilitado;
- `operador@alphalogistics.dev` — OPERATOR;
- `analista@alphalogistics.dev` — MANAGER;
- `visualizador@alphalogistics.dev` — OPERATOR;
- `inativo@alphalogistics.dev` — OPERATOR desativado.

Tenant Beta Transportes:

- `admin@betatransportes.dev` — ADMIN;
- `supervisor@betatransportes.dev` — MANAGER, MFA habilitado;
- `operador@betatransportes.dev` — OPERATOR;
- `analista@betatransportes.dev` — MANAGER;
- `visualizador@betatransportes.dev` — OPERATOR;
- `bloqueado@betatransportes.dev` — OPERATOR desativado.

Observação: o schema atual possui apenas `ADMIN`, `MANAGER` e `OPERATOR`. Os perfis de negócio “Analista” e “Visualizador” são representados por usuários nomeados com esses papéis funcionais, usando os perfis RBAC disponíveis.

## Conteúdo por tenant

Cada tenant recebe:

- 6 usuários;
- 5 filiais em estados/cidades reais;
- 6 clientes com endereço principal;
- 5 transportadoras;
- 15 serviços de transporte;
- coberturas por origem/destino entre estados;
- tabelas de frete versionadas, com versões históricas e vigentes;
- faixas de peso;
- adicionais de frete, incluindo pedágio, GRIS, ad valorem e seguro;
- 14 simulações distribuídas nos últimos 90 dias;
- múltiplas opções por simulação calculada;
- componentes de preço para breakdown;
- pelo menos 9 embarques derivados de opções selecionadas;
- endereços e volumes de shipment;
- timeline de tracking com eventos de status e eventos informativos;
- 5 importações com status variados;
- resultados por linha de importação com sucessos, erros e ignorados;
- 6 insights determinísticos;
- 36 eventos de auditoria.

## Finalidade dos dados

Os dados foram criados para preencher e validar:

- dashboard e gráficos;
- insights;
- clientes;
- usuários;
- filiais;
- transportadoras;
- serviços;
- tabelas de frete;
- simulação;
- histórico;
- shipments;
- tracking;
- importações;
- auditoria;
- autenticação e RBAC;
- isolamento multi-tenant.

As datas são distribuídas entre os últimos 90 dias para permitir filtros por hoje, últimos 7 dias, mês atual, mês anterior e períodos antigos.

## Narrativa operacional

`Alpha Logistics` opera a partir de São Paulo, Campinas, Uberlândia, Goiânia e Curitiba, com clientes de varejo, saúde, autopeças e equipamentos.

`Beta Transportes` opera a partir de Ribeirão Preto, Contagem, Anápolis, Londrina e Sorocaba, com clientes de tecnologia, farmácia, agro e marketplace.

As simulações geram opções com transportadoras diferentes, preservam a opção selecionada, originam shipments e alimentam tracking, dashboard, insights e auditoria.
