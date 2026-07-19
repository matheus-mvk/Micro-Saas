# Risk Register

## Escala

- Probabilidade: Baixa, Media, Alta.
- Impacto: Baixo, Medio, Alto, Critico.
- Status: Aberto, Mitigado, Aceito, Monitorado.

| ID | Risco | Probabilidade | Impacto | Controles atuais/necessarios | Dono sugerido | Status |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-001 | Acesso cross-tenant por falha de filtro em consulta | Media | Critico | Filtro obrigatorio por tenant, testes de isolamento, revisao de repositories | Backend | Aberto |
| SEC-002 | Elevacao de privilegio por checagem apenas no frontend | Media | Alto | Autorizacao server-side por acao, testes de API, deny-by-default | Backend/Frontend | Aberto |
| SEC-003 | Vazamento de tokens ou PII em logs | Media | Alto | Mascaramento, lista de campos proibidos, revisao de observabilidade | Plataforma | Aberto |
| SEC-004 | Upload malicioso ou zip bomb causa execucao/custo alto | Media | Alto | Limites, scanning, parsing em sandbox, quotas por tenant | Backend/Infra | Aberto |
| SEC-005 | URL assinada de arquivo exposta ou valida por tempo excessivo | Media | Alto | Expiracao curta, autorizacao no download, revogacao | Backend/Infra | Aberto |
| SEC-006 | Segredo versionado ou exposto em pipeline | Media | Critico | Secret scanning, cofre, mascaramento de CI/CD, rotacao | Plataforma | Aberto |
| SEC-007 | Operador interno acessa tenant sem justificativa | Baixa | Alto | Permissao especifica, break-glass, auditoria e revisao periodica | Seguranca/Operacoes | Aberto |
| SEC-008 | Webhook forjado ou replay de evento externo | Media | Alto | Assinatura, timestamp, nonce/idempotencia, allowlist quando aplicavel | Backend | Aberto |
| SEC-009 | Cache retorna dados de outro tenant | Baixa | Critico | Chaves com tenant, testes, invalidacao particionada | Backend | Aberto |
| SEC-010 | Prompt, embedding ou memoria de IA mistura tenants | Media | Critico | Particionamento por tenant, minimizacao, testes de contexto | IA/Backend | Aberto |
| SEC-011 | Exportacao ampla sem auditoria ou permissao adequada | Media | Alto | Permissao especifica, limite, justificativa, auditoria e alertas | Produto/Backend | Aberto |
| SEC-012 | Dependencia comprometida introduz vulnerabilidade | Media | Alto | Lockfile, scanning, revisao de updates, SBOM quando disponivel | Plataforma | Monitorado |
| SEC-013 | Conta admin sem MFA comprometida | Media | Critico | MFA obrigatorio para admins e operadores internos, deteccao de anomalia | Produto/Seguranca | Aberto |
| SEC-014 | Jobs assincronos processam tenant errado | Baixa | Critico | Envelope com tenant, validacao no worker, testes de lote | Backend | Aberto |
| SEC-015 | Dados anonimizados permitem reidentificacao | Baixa | Alto | Agregacao minima, k-anonymity quando aplicavel, revisao de datasets | Dados/Seguranca | Aberto |

## Criterios de aceite de risco

Um risco so pode ser aceito quando:

1. impacto e probabilidade foram documentados;
2. existe dono responsavel;
3. ha prazo de revisao;
4. controles compensatorios foram avaliados;
5. a decisao foi aprovada por responsavel de produto/seguranca.

## Revisao

- Revisar riscos antes de releases com mudancas em autenticacao, autorizacao, isolamento, uploads, integracoes, IA ou exportacoes.
- Atualizar status apos incidentes, pentests, auditorias, findings de scanner ou mudancas de arquitetura.
- Promover riscos criticos abertos para backlog prioritario.

