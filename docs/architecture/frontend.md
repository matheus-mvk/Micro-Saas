# Arquitetura Frontend

A aplicacao Web usa Next.js App Router, TypeScript e Server Components por padrao. Client Components ficam limitados a providers, formularios e widgets interativos.

Estado remoto usa TanStack Query, validacao de formulario usa Zod com React Hook Form e acesso a API e centralizado em `src/services/http-client.ts`.
