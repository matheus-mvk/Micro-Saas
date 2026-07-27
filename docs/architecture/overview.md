# Visao Geral Da Arquitetura

```mermaid
flowchart LR
  Web[Next.js Web] --> API[NestJS API]
  API --> Prisma[Prisma]
  Prisma --> MySQL[(MySQL)]
  API --> Redis[(Redis)]
  API --> Queue[BullMQ]
  Queue --> Redis
  API --> Socket[Socket.IO]
```

O frontend consome somente a API. Prisma e credenciais de banco permanecem server-side em `apps/api`.
