# Integracoes Externas

Este documento registra as integracoes externas usadas pela plataforma e como elas sao configuradas, consumidas e degradadas em caso de indisponibilidade.

## Resumo

| Integracao | Uso | Codigo | Variaveis | Obrigatoria em producao |
| --- | --- | --- | --- | --- |
| Google OAuth | Login, registro e vinculacao de conta | `apps/api/src/modules/auth/oauth.service.ts` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `API_PUBLIC_URL`, `WEB_PUBLIC_URL` | Sim, para habilitar botao Google |
| GitHub OAuth | Login, registro e vinculacao de conta | `apps/api/src/modules/auth/oauth.service.ts` | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `API_PUBLIC_URL`, `WEB_PUBLIC_URL` | Sim, para habilitar botao GitHub |
| ViaCEP | Consulta de CEP no fluxo de frete | `apps/api/src/modules/freight-simulations/freight-simulations.service.ts` | `ADDRESS_LOOKUP_PROVIDER=viacep` | Nao; ha fallback para entrada manual |
| OpenRoute/fallback de distancia | Distancia de rota quando provider externo estiver configurado | configuracao em `apps/api/src/config/environment.ts` | `ROUTE_DISTANCE_PROVIDER`, `OPENROUTE_API_KEY` | Nao; provider `fallback` e suportado |

## Google OAuth

Fluxos suportados:

- login com conta existente;
- registro publico com usuario `INCOMPLETE`;
- conclusao de cadastro OAuth em `/completar-cadastro`;
- vinculacao/desvinculacao no perfil autenticado;
- state de uso unico para reduzir CSRF e replay.

Callback esperado:

```text
{API_PUBLIC_URL}/auth/oauth/google/callback
```

Em producao, para a API Render usada nos exemplos:

```text
https://micro-saas-9uds.onrender.com/api/v1/auth/oauth/google/callback
```

Dados persistidos:

- provedor;
- id externo do usuario;
- e-mail;
- metadados seguros do perfil;
- vinculo com `tenantId`/`userId` quando aprovado.

## GitHub OAuth

Fluxos suportados:

- login com conta existente;
- registro publico pendente de aprovacao;
- vinculacao/desvinculacao no perfil autenticado.

Callback esperado:

```text
{API_PUBLIC_URL}/auth/oauth/github/callback
```

Em producao, para a API Render usada nos exemplos:

```text
https://micro-saas-9uds.onrender.com/api/v1/auth/oauth/github/callback
```

O servico consulta `https://api.github.com/user` e `https://api.github.com/user/emails` para resolver e-mail, inclusive quando o e-mail publico do GitHub nao esta disponivel.

## ViaCEP

Uso:

- enriquecimento/validacao de CEP no fluxo de simulacao de frete;
- preenchimento de cidade/UF/logradouro quando a API responde com dados validos.

Endpoint consumido:

```text
https://viacep.com.br/ws/{cep}/json/
```

Regras:

- CEP e normalizado antes da chamada.
- A chamada usa timeout por `AbortController`.
- Falha, timeout ou resposta incompleta nao bloqueia a simulacao quando ha dados suficientes fornecidos pelo usuario.
- Dados derivados de CEP nunca substituem tenantId ou permissoes.

## Distancia de rota

O projeto possui configuracao para provider de distancia:

```text
ROUTE_DISTANCE_PROVIDER=openroute|fallback
OPENROUTE_API_KEY=...
```

Estado atual:

- `fallback` e o modo seguro sem chave externa;
- quando nao ha coordenadas/chave externa, a simulacao usa calculo deterministico local;
- a decisao evita bloquear a demonstracao por dependencia externa paga ou instavel.

## Variaveis por ambiente

API:

```text
API_PUBLIC_URL
WEB_PUBLIC_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
ADDRESS_LOOKUP_PROVIDER
ROUTE_DISTANCE_PROVIDER
OPENROUTE_API_KEY
LOGISTICS_INTEGRATION_TIMEOUT_MS
```

Web:

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_APP_URL
```

Seguranca:

- segredos ficam somente no backend;
- `DATABASE_URL`, `JWT_*`, OAuth secrets e chaves externas nao devem ser configurados na Vercel;
- logs nao devem registrar access tokens, refresh tokens, OAuth codes, client secrets ou payloads completos de integracao.

## Checklist de validacao

1. `GET /api/v1/auth/oauth/status` deve indicar `configured: true` para providers configurados.
2. O callback cadastrado no Google/GitHub deve bater exatamente com `API_PUBLIC_URL`.
3. `CORS_ORIGINS` deve permitir a URL publica do frontend.
4. Cookies devem funcionar entre Web e API com dominio/SameSite coerentes.
5. ViaCEP deve falhar de forma degradada quando indisponivel.
6. O modo `fallback` de distancia deve continuar permitindo simulacao.
