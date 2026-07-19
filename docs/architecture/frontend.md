# Frontend Architecture

The web app uses Next.js App Router, TypeScript and Server Components by default. Client Components are limited to providers, forms and interactive widgets.

Remote state will use TanStack Query, form validation uses Zod with React Hook Form and API access is centralized in `src/services/http-client.ts`.
