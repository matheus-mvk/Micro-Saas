# Design e Experiencia

Este pacote define a base de UI/UX para uma plataforma SaaS multi-tenant de inteligencia logistica. Ele deve orientar produto, engenharia e QA antes da implementacao visual.

## Documentos

- [Design system](./design-system.md): principios visuais, tokens, componentes e estados.
- [Acessibilidade](./accessibility.md): requisitos WCAG, navegacao, contraste, formularios e estados.
- [Landing page](./landing-page.md): estrutura, narrativa, secoes e criterios de conversao.
- [Admin experience](./admin-experience.md): experiencia operacional para tenants, usuarios, regras e monitoramento.
- [Content guidelines](./content-guidelines.md): voz, tom, microcopy, erros e padroes de escrita.
- [Identidade](./identity-decisions.md): decisoes de marca, personalidade, cores e uso visual.
- [Checklist visual](./visual-checklist.md): verificacao antes de entregar telas.

## Norte de Produto

A experiencia deve comunicar controle operacional, previsibilidade e inteligencia aplicada a rotinas logisticas. A interface deve ser densa o suficiente para equipes que trabalham varias horas por dia, mas sem sacrificar clareza para usuarios novos.

## Alinhamento com o MVP

As decisoes abaixo partem do escopo ja descrito em produto: login com tenant resolvido, dashboard executivo, monitor operacional, central de alertas, detalhe logistico e administracao basica de usuarios e permissoes. Itens mais avancados, como construtor livre de dashboards ou editor visual de modelos preditivos, nao devem orientar a primeira versao da UI.

## Principios

1. Priorizar decisao, nao decoracao.
2. Mostrar risco, excecao e oportunidade no mesmo contexto operacional.
3. Separar configuracao administrativa de operacao diaria.
4. Tornar o escopo multi-tenant explicito em navegacao, permissoes e dados.
5. Evitar interfaces que parecam landing page dentro do produto.
