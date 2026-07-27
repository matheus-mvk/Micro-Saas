# Getting Started

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm dev
```

The API runs at `http://localhost:3333/api/v1` and the web app at `http://localhost:3000`.

## Local Seeded Admin

O seed local prepara um usuario administrativo para validar o primeiro fluxo de autenticacao:

```text
E-mail: administrador@dev.com
Senha: @DEV1512
Tenant: demo-logistics
```

Essa credencial e apenas para desenvolvimento local. O seed recusa execucao em `NODE_ENV=production` sem `ALLOW_DEMO_SEED=true`. Bancos locais antigos podem conter `admin@example.com` de seeds anteriores; prefira recriar ou atualizar o seed para a credencial principal acima.

Conexao MySQL:

- containers/API: `mysql:3306`;
- Windows/DBeaver: `localhost:3307`.

Em Docker/Compose use `pnpm db:deploy` ou `prisma migrate deploy`. `prisma migrate dev` cria shadow database e pode falhar com o usuario MySQL limitado.
