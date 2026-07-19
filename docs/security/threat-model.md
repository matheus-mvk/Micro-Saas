# Threat Model

## Sistema protegido

Plataforma SaaS multi-tenant de inteligencia logistica, com usuarios externos, operadores internos, dados de clientes, operacoes logisticas, relatorios, arquivos importados e integracoes com servicos externos.

## Ativos criticos

- Dados privados de tenants: pedidos, rotas, cargas, clientes finais, custos, SLAs, indicadores e documentos importados.
- Identidades: contas de usuarios, sessoes, tokens, convites e credenciais de integracoes.
- Configuracoes por tenant: parametros operacionais, limites, regras de negocio, preferencias e permissoes.
- Segredos: chaves de API, credenciais de banco, tokens de armazenamento, webhooks e chaves de assinatura.
- Logs e trilhas de auditoria: eventos de acesso, administracao, exportacao, importacao e alteracoes criticas.
- Modelos, prompts e resultados de inteligencia logistica que possam revelar dados privados.

## Fronteiras de confianca

- Cliente web ou mobile para API backend.
- API backend para banco de dados, cache, filas e storage.
- Backend para provedores externos de autenticacao, email, mapas, IA, pagamentos e webhooks.
- Usuarios de tenant para recursos do proprio tenant.
- Operadores internos para recursos administrativos.
- Jobs assincronos para dados de multiplos tenants.

## Atores

- Usuario autenticado de um tenant.
- Administrador de tenant.
- Operador interno autorizado.
- Usuario convidado ou com permissao limitada.
- Atacante externo nao autenticado.
- Atacante autenticado tentando escapar do proprio tenant.
- Integracao externa comprometida.
- Insider com acesso indevido a logs, banco, storage ou console cloud.

## Ameacas principais

| Categoria | Ameaca | Impacto | Controles minimos |
| --- | --- | --- | --- |
| Spoofing | Roubo de sessao, token ou credencial | Acesso indevido a dados e operacoes | MFA para admins, cookies seguros, expiracao, rotacao e deteccao de anomalias |
| Tampering | Alteracao de `tenant_id`, IDs de objetos ou payloads | Escrita em dados de outro tenant | Autorizacao server-side, filtros obrigatorios por tenant e validacao de ownership |
| Repudiation | Usuario nega acao critica | Perda de rastreabilidade | Auditoria imutavel para login, exportacao, upload, convites e alteracoes sensiveis |
| Information disclosure | Vazamento entre tenants, logs com PII ou URL publica | Exposicao de dados confidenciais | Isolamento por tenant, mascaramento, URLs assinadas e revisao de logs |
| Denial of service | Uploads grandes, consultas caras, abuso de IA | Indisponibilidade ou custo excessivo | Rate limit, quotas por tenant, limites de arquivo e timeouts |
| Elevation of privilege | Usuario comum vira admin ou operador interno | Comprometimento amplo | RBAC/ABAC no backend, revisao de papeis, menor privilegio e auditoria |
| Supply chain | Dependencia ou pipeline comprometido | Execucao maliciosa ou vazamento | Lockfiles, scanning, secrets scanning e revisao de CI/CD |
| Prompt/data leakage | Conteudo de IA retorna dados de outro tenant | Vazamento sensivel | Escopo de contexto por tenant, redacao de PII e testes de isolamento |

## Casos de abuso prioritarios

1. Usuario altera `tenant_id` em rota, query string, body ou header para acessar outro tenant.
2. Usuario enumera IDs sequenciais de pedidos, rotas, arquivos ou relatorios.
3. Admin de tenant cria usuario com papel superior ao permitido.
4. Arquivo importado contem malware, CSV injection, payload zip bomb ou conteudo fora do tenant.
5. URL temporaria de arquivo permite acesso depois de revogacao ou para tenant incorreto.
6. Log de erro grava token, chave de API, documento, CPF/CNPJ, email ou payload completo.
7. Job assincrono processa lote multi-tenant sem particionar corretamente o contexto.
8. Webhook externo envia evento forjado ou reexecutado.
9. Operador interno acessa dados de tenant sem justificativa ou trilha de auditoria.
10. Recurso de IA recebe contexto de varios tenants ou persiste prompts com dados sensiveis sem politica.

## Requisitos de mitigacao

- Usar deny-by-default para endpoints autenticados.
- Validar ownership de todo recurso privado no servidor.
- Aplicar isolamento em pelo menos duas camadas: autorizacao de aplicacao e filtro de persistencia.
- Exigir auditoria para eventos que mudem acesso, exportem dados, alterem configuracoes ou processem arquivos.
- Separar permissoes internas de permissoes de tenants.
- Restringir integracoes externas por tenant e assinar webhooks.
- Executar testes automatizados de tentativa de acesso cross-tenant para fluxos criticos.
