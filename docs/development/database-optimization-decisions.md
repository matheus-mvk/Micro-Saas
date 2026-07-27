# Decisoes De Otimizacao De Banco

Data: 2026-07-25

## Decisoes

1. Usar `prisma migrate deploy` para ambientes Docker/CI/demo.
   - Motivo: `migrate dev` exige shadow database e falhou com o usuario MySQL limitado.
   - Evidencia: erro local Docker `P3014`.

2. Manter igualdade de tenant como primeira coluna em indices de negocio.
   - Motivo: todas as leituras de negocio devem ser tenant-scoped.
   - Evidencia: indices do schema atual usam `tenant_id` primeiro.

3. Renomear explicitamente indices gerados longos.
   - Motivo: limite de identificador do MySQL e 64 caracteres.
   - Evidencia: erro de migration `1059`.

4. Agregar contadores do dashboard na API usando counts/aggregate queries do banco.
   - Motivo: evitar carregar linhas no Node.js ou computar numeros do dashboard no frontend.
   - Evidencia: `DashboardService.getSummary`.

5. Nao adicionar indices amplos para queries nao implementadas.
   - Motivo: indices devem corresponder a filtros e ordenacao reais de endpoints.
   - Evidencia: a maioria dos endpoints de dominio ainda nao esta implementada.
