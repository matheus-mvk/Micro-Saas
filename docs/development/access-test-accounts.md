# Plano de Contas de Teste e Seed SQL Manual

Este documento define contas concretas para validar RBAC e um seed SQL manual para ambientes onde o Prisma CLI nao pode ser executado localmente. O uso principal e TiDB Cloud ou outro MySQL gerenciado depois que as migrations ja foram aplicadas.

## Compatibilidade De Senha

O projeto nao usa bcrypt. O hash de senha e gerado por `node:crypto.scrypt` no formato:

```text
scrypt$saltBase64urlOuString$keyBase64url
```

O `PasswordService` deriva uma chave de 64 bytes e valida pelo formato acima. Todos os hashes abaixo sao reais e validos para a senha:

```text
@DEV1512
```

## Contas De Teste

As contas abaixo fazem parte da seed demo do tenant `alpha-logistics` e tambem estao disponiveis no SQL manual desta pagina para cenarios de desbloqueio direto em TiDB Cloud.

| Perfil | E-mail | Senha | Hash |
| --- | --- | --- | --- |
| ADMIN | `admin.test@dev.com` | `@DEV1512` | `scrypt$admin-test-salt-01$-RlGiZN33qU5ISuZQrp14GweFpYdVsBpJMCgfTgF1KUpoItfDTI-9-72OloZz_DbDY_QwrXj-vRAHBZWze0ZSQ` |
| MANAGER | `manager.test@dev.com` | `@DEV1512` | `scrypt$manager-test-salt-01$5pukOlDTfOXhVVsGUhVLmoKSGJrxz6vD4ngAw7QVcA7TmWNCSO8-2nuCyIh3LwiMoRSPxhgO9iUTqGwOxrTmpg` |
| OPERATOR | `operator.test@dev.com` | `@DEV1512` | `scrypt$operator-test-salt-01$WFQKYPZB-S2qZVSBq1-Zq4E3_OaO3GUiOIGqy_dVERA-YxI7oBaMuuMgpUB_cK1PnHRw5uyct7dGcMVa6joO2g` |

Conta administrativa solicitada para desbloqueio manual:

| Perfil | E-mail | Senha | Hash |
| --- | --- | --- | --- |
| ADMIN | `administrador@dev.com` | `@DEV1512` | `scrypt$admin-prod-seed-01$IwNDIPqBr8tXFWQrbKflGJMbWZdQi-lqz89zD6nX8bP9mSu9GO05zVnrmm-i93Fh5wu4jQon7oJZKxDwrwy1QQ` |

## SQL Manual Para TiDB Cloud

Use este SQL apenas apos aplicar migrations. Ele cria um tenant, settings, onboarding, filial matriz e quatro usuarios ativos. A ordem respeita chaves estrangeiras.

```sql
START TRANSACTION;

INSERT INTO tenants (
  id, name, document, slug, active, created_at, updated_at
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Dev Administracao',
  NULL,
  'dev-administracao',
  true,
  NOW(3),
  NOW(3)
);

INSERT INTO tenant_settings (
  id, tenant_id, country, currency, timezone, onboarding_completed, created_at, updated_at
) VALUES (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'BR',
  'BRL',
  'America/Sao_Paulo',
  true,
  NOW(3),
  NOW(3)
);

INSERT INTO tenant_onboarding (
  id, tenant_id, company_done, branch_done, invite_done, completed, current_step, created_at, updated_at
) VALUES (
  '33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',
  true,
  true,
  true,
  true,
  'done',
  NOW(3),
  NOW(3)
);

INSERT INTO branches (
  id, tenant_id, name, code, country, main, active, created_at, updated_at
) VALUES (
  '44444444-4444-4444-8444-444444444444',
  '11111111-1111-4111-8111-111111111111',
  'Matriz',
  'MATRIZ',
  'BR',
  true,
  true,
  NOW(3),
  NOW(3)
);

INSERT INTO users (
  id, tenant_id, branch_id, name, email, password_hash, role, status,
  mfa_enabled, mfa_secret, password_change_required, last_login_at, deleted_at,
  created_at, updated_at
) VALUES
(
  '55555555-5555-4555-8555-555555555555',
  '11111111-1111-4111-8111-111111111111',
  '44444444-4444-4444-8444-444444444444',
  'Administrador Dev',
  'administrador@dev.com',
  'scrypt$admin-prod-seed-01$IwNDIPqBr8tXFWQrbKflGJMbWZdQi-lqz89zD6nX8bP9mSu9GO05zVnrmm-i93Fh5wu4jQon7oJZKxDwrwy1QQ',
  'ADMIN',
  'ACTIVE',
  false,
  NULL,
  false,
  NULL,
  NULL,
  NOW(3),
  NOW(3)
),
(
  '66666666-6666-4666-8666-666666666666',
  '11111111-1111-4111-8111-111111111111',
  '44444444-4444-4444-8444-444444444444',
  'Admin Teste',
  'admin.test@dev.com',
  'scrypt$admin-test-salt-01$-RlGiZN33qU5ISuZQrp14GweFpYdVsBpJMCgfTgF1KUpoItfDTI-9-72OloZz_DbDY_QwrXj-vRAHBZWze0ZSQ',
  'ADMIN',
  'ACTIVE',
  false,
  NULL,
  false,
  NULL,
  NULL,
  NOW(3),
  NOW(3)
),
(
  '77777777-7777-4777-8777-777777777777',
  '11111111-1111-4111-8111-111111111111',
  '44444444-4444-4444-8444-444444444444',
  'Manager Teste',
  'manager.test@dev.com',
  'scrypt$manager-test-salt-01$5pukOlDTfOXhVVsGUhVLmoKSGJrxz6vD4ngAw7QVcA7TmWNCSO8-2nuCyIh3LwiMoRSPxhgO9iUTqGwOxrTmpg',
  'MANAGER',
  'ACTIVE',
  false,
  NULL,
  false,
  NULL,
  NULL,
  NOW(3),
  NOW(3)
),
(
  '88888888-8888-4888-8888-888888888888',
  '11111111-1111-4111-8111-111111111111',
  '44444444-4444-4444-8444-444444444444',
  'Operator Teste',
  'operator.test@dev.com',
  'scrypt$operator-test-salt-01$WFQKYPZB-S2qZVSBq1-Zq4E3_OaO3GUiOIGqy_dVERA-YxI7oBaMuuMgpUB_cK1PnHRw5uyct7dGcMVa6joO2g',
  'OPERATOR',
  'ACTIVE',
  false,
  NULL,
  false,
  NULL,
  NULL,
  NOW(3),
  NOW(3)
);

COMMIT;
```

## Smoke Tests Manuais De Login

Para cada conta:

1. Acesse a Web em `NEXT_PUBLIC_APP_URL`.
2. Informe e-mail e senha `@DEV1512`.
3. Confirme que o login retorna usuario com `tenant.slug = dev-administracao`.
4. Valide a matriz de acesso:
   - `ADMIN` acessa usuarios.
   - `MANAGER` lista usuarios, mas nao cria/aprova.
   - `OPERATOR` nao acessa usuarios nem auditoria.
   - `OPERATOR` so consulta imports proprios.

## Observacoes Para Producao

- Nao rode a seed demo em banco produtivo sem intencao explicita.
- Prefira criar usuarios administrativos por fluxo da aplicacao ou seed operacional revisado.
- Se usar este SQL para desbloqueio, troque a senha apos o primeiro login.
- Registre no ticket/release quando uma conta manual for criada em ambiente de producao.
