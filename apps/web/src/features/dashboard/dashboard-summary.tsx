'use client';

import { ShipmentStatus, type DashboardFiltersDto, type DashboardTrendDto } from '@logistics/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { io } from 'socket.io-client';

import styles from '@/app/(dashboard)/dashboard/page.module.css';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { publicEnv } from '@/lib/env';
import { dashboardQueryKeys, getDashboardSummary } from '@/services/dashboard-service';
import { formatShipmentStatus, shipmentStatusLabels } from '@/utils/shipment-status';

const numberFormat = new Intl.NumberFormat('pt-BR');
const currencyFormat = new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' });

export function DashboardSummary() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DashboardFiltersDto>(() => defaultDashboardFilters());
  const summary = useQuery({
    queryKey: dashboardQueryKeys.summary(filters),
    queryFn: () => getDashboardSummary(filters),
    retry: false,
  });

  useEffect(() => {
    const socket = io(`${apiOrigin()}/realtime`, { transports: ['websocket'], withCredentials: true });
    socket.on('connect', () => socket.emit('tenant:join', {}));
    socket.on('dashboard.refresh', () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });
    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const data = summary.data;
  const services = useMemo(
    () => data?.filterOptions.carrierServices.filter((service) => !filters.carrierId || service.carrierId === filters.carrierId) ?? [],
    [data?.filterOptions.carrierServices, filters.carrierId],
  );

  if (summary.isPending) {
    return <DashboardSkeleton />;
  }

  if (summary.error || !data) {
    return (
      <section className={styles.panel} role="alert">
        <h2>Nao foi possivel carregar os indicadores</h2>
        <p>Verifique a conexao com a API e tente novamente.</p>
        <Button type="button" onClick={() => void summary.refetch()}>
          <RefreshCw size={16} /> Tentar novamente
        </Button>
      </section>
    );
  }

  const hasOperationalData =
    data.totals.activeCustomers > 0 ||
    data.totals.activeCarriers > 0 ||
    data.totals.freightSimulations > 0 ||
    data.totals.importJobs > 0 ||
    data.operations.totalShipments > 0;

  return (
    <div className={styles.dashboardStack}>
      <section className={styles.filtersPanel} aria-label="Filtros do dashboard">
        <FilterField label="Inicio">
          <input type="date" value={filters.startDate ?? ''} onChange={(event) => setFilters((current) => updateTextFilter(current, 'startDate', event.target.value))} />
        </FilterField>
        <FilterField label="Fim">
          <input type="date" value={filters.endDate ?? ''} onChange={(event) => setFilters((current) => updateTextFilter(current, 'endDate', event.target.value))} />
        </FilterField>
        <FilterField label="Cliente">
          <select value={filters.customerId ?? ''} onChange={(event) => setFilters((current) => updateTextFilter(current, 'customerId', event.target.value))}>
            <option value="">Todos</option>
            {data.filterOptions.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.label}</option>)}
          </select>
        </FilterField>
        <FilterField label="Transportadora">
          <select
            value={filters.carrierId ?? ''}
            onChange={(event) => setFilters((current) => updateCarrierFilter(current, event.target.value))}
          >
            <option value="">Todas</option>
            {data.filterOptions.carriers.map((carrier) => <option key={carrier.id} value={carrier.id}>{carrier.label}</option>)}
          </select>
        </FilterField>
        <FilterField label="Servico">
          <select value={filters.carrierServiceId ?? ''} onChange={(event) => setFilters((current) => updateTextFilter(current, 'carrierServiceId', event.target.value))}>
            <option value="">Todos</option>
            {services.map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}
          </select>
        </FilterField>
        <FilterField label="Filial">
          <select value={filters.branchId ?? ''} onChange={(event) => setFilters((current) => updateTextFilter(current, 'branchId', event.target.value))}>
            <option value="">Todas</option>
            {data.filterOptions.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.label}</option>)}
          </select>
        </FilterField>
        <FilterField label="Status">
          <select value={filters.status ?? ''} onChange={(event) => setFilters((current) => updateStatusFilter(current, event.target.value))}>
            <option value="">Todos</option>
            {Object.values(ShipmentStatus).map((status) => <option key={status} value={status}>{shipmentStatusLabels[status]}</option>)}
          </select>
        </FilterField>
        <Button type="button" variant="secondary" onClick={() => setFilters(defaultDashboardFilters())}>Limpar</Button>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Visao geral</h2>
            <p>
              {new Date(data.period.start).toLocaleDateString('pt-BR')} ate {new Date(data.period.end).toLocaleDateString('pt-BR')} - atualizado em {new Date(data.generatedAt).toLocaleTimeString('pt-BR')}
            </p>
          </div>
          {data.accessScope === 'OPERATIONAL' ? <span className={styles.scopeBadge}>Visao operacional</span> : null}
        </div>
        <div className={styles.stats} aria-label="Indicadores principais">
          <Kpi label="Simulacoes" value={numberFormat.format(data.totals.freightSimulations)} trend={data.comparisons.freightSimulations} />
          <Kpi label="Valor medio" value={formatCurrencyOrRestricted(data.freight.averageEstimatedPrice, data.accessScope)} trend={data.comparisons.costAverage} />
          <Kpi label="Menor preco medio" value={formatCurrencyOrRestricted(data.freight.averageLowestOption ?? null, data.accessScope)} />
          <Kpi label="Economia potencial" value={data.accessScope === 'FULL' ? currencyFormat.format(data.freight.estimatedSavings ?? 0) : 'Restrito'} />
          <Kpi label="Opcoes selecionadas" value={numberFormat.format(data.freight.selectedOptions ?? 0)} />
          <Kpi label="Conversao em Shipment" value={`${numberFormat.format(data.freight.conversionRate ?? 0)}%`} />
          <Kpi label="Shipments ativos" value={numberFormat.format(data.operations.inTransitShipments)} />
          <Kpi label="Entregues" value={numberFormat.format(data.operations.deliveredShipments)} />
          <Kpi label="Atrasados" value={numberFormat.format(data.operations.delayedShipments)} trend={data.comparisons.delayedShipments} />
          <Kpi label="Taxa de entrega" value={`${numberFormat.format(data.operations.successRate)}%`} />
          <Kpi label="Importacoes concluidas" value={numberFormat.format(data.imports.completed)} />
          <Kpi label="Erro de importacao" value={`${numberFormat.format(data.imports.errorRate)}%`} trend={data.comparisons.importErrorRate} />
        </div>
      </section>

      {hasOperationalData ? (
        <>
          <section className={styles.dashboardGrid}>
            <ChartPanel title="Simulacoes por dia" description="Volume diario dentro do periodo filtrado.">
              <BarList values={data.charts.simulationsByPeriod} />
            </ChartPanel>
            <ChartPanel title="Custo medio por periodo" description={data.accessScope === 'FULL' ? 'Media do frete estimado por dia.' : 'Restrito para o perfil operacional.'}>
              <BarList money values={data.charts.costByPeriod} />
            </ChartPanel>
            <ChartPanel title="Transportadoras mais selecionadas" description="Opcao efetivamente escolhida nas simulacoes.">
              <BarList values={data.charts.selectedCarriers} />
            </ChartPanel>
            <ChartPanel title="Conversao diaria" description="Shipments criados em relacao as simulacoes do dia.">
              <BarList suffix="%" values={data.charts.conversionByPeriod} />
            </ChartPanel>
          </section>

          <section className={styles.dashboardGrid}>
            <article className={styles.panel}>
              <h2>Desempenho por transportadora</h2>
              {data.charts.carrierPerformance.length ? (
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr><th>Transportadora</th><th>Preco medio</th><th>Prazo medio</th><th>Selecionadas</th></tr>
                    </thead>
                    <tbody>
                      {data.charts.carrierPerformance.map((carrier) => (
                        <tr key={carrier.carrierId}>
                          <td>{carrier.carrierName}</td>
                          <td>{carrier.averagePrice === null ? 'Restrito' : currencyFormat.format(carrier.averagePrice)}</td>
                          <td>{carrier.averageDeadlineDays ?? '-'} dia(s)</td>
                          <td>{carrier.selectedCount}/{carrier.optionCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p>Sem opcoes suficientes para comparar transportadoras.</p>}
            </article>

            <ChartPanel title="Rotas mais frequentes" description="Origem e destino por CEP, agrupados no periodo.">
              <BarList values={data.charts.routePerformance.map((route) => ({ label: route.route, value: route.simulationCount }))} />
            </ChartPanel>

            <ChartPanel title="Status dos Shipments" description="Distribuicao operacional dos embarques filtrados.">
              <BarList values={data.charts.shipmentStatus.map((status) => ({ label: formatShipmentStatus(status.label), value: status.value }))} />
            </ChartPanel>

            <ChartPanel title="Importacoes" description="Taxa de erro por arquivo recente.">
              <BarList suffix="%" values={data.charts.importsQuality.map((job) => ({ label: job.filename, value: job.totalRows ? Math.round((job.errorRows / job.totalRows) * 100) : 0 }))} />
            </ChartPanel>
          </section>

          <section className={styles.dashboardGrid}>
            <article className={styles.panel}>
              <h2>Insights recentes</h2>
              {data.decisionHighlights.length ? data.decisionHighlights.map((highlight) => (
                <article className={styles.highlight} key={highlight.title}>
                  <strong>{highlight.title}</strong>
                  <span>{highlight.category} - {highlight.severity} {highlight.value ? `- ${highlight.value}` : ''}</span>
                  {highlight.actionUrl ? <Link href={highlight.actionUrl as never}>Abrir contexto</Link> : null}
                </article>
              )) : <p>Gere insights quando houver simulacoes, Shipments ou importacoes suficientes.</p>}
            </article>

            <article className={styles.panel}>
              <h2>Atividades recentes</h2>
              {data.recentActivity.length ? data.recentActivity.map((activity) => (
                <article className={styles.activity} key={activity.id}>
                  <strong>{activity.action}</strong>
                  <span>{activity.entityType ?? 'Registro'} - {new Date(activity.createdAt).toLocaleString('pt-BR')}</span>
                </article>
              )) : <p>Nenhuma atividade relevante no periodo.</p>}
            </article>
          </section>
        </>
      ) : (
        <EmptyState
          title="Sem dados operacionais neste tenant"
          description="Cadastre clientes e transportadoras, execute uma simulacao ou processe uma importacao para preencher o dashboard."
        />
      )}
    </div>
  );
}

function Kpi({ label, trend: trendValue, value }: { label: string; trend?: DashboardTrendDto; value: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      {trendValue ? <small className={trendClass(trendValue)}>{formatTrend(trendValue)}</small> : null}
    </article>
  );
}

function FilterField({ children, label }: { children: ReactNode; label: string }) {
  return <label className={styles.filterField}>{label}{children}</label>;
}

function ChartPanel({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <article className={styles.panel}>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </article>
  );
}

function BarList({ money = false, suffix = '', values }: { money?: boolean; suffix?: string; values: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...values.map((value) => value.value));
  if (values.length === 0) return <p>Sem dados no periodo.</p>;
  return (
    <div className={styles.barList}>
      {values.map((value) => (
        <div className={styles.barRow} key={value.label}>
          <div className={styles.barMeta}>
            <span title={value.label}>{value.label}</span>
            <strong>{money ? currencyFormat.format(value.value) : `${numberFormat.format(value.value)}${suffix}`}</strong>
          </div>
          <div className={styles.bar} aria-label={`${value.label}: ${value.value}${suffix}`}>
            <span style={{ width: `${Math.max(4, (value.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className={styles.dashboardStack} aria-label="Carregando dashboard">
      <section className={styles.stats}>
        {Array.from({ length: 6 }).map((_, index) => <article className={styles.skeleton} key={index} />)}
      </section>
      <section className={styles.dashboardGrid}>
        <article className={styles.skeletonPanel} />
        <article className={styles.skeletonPanel} />
      </section>
    </div>
  );
}

function defaultDashboardFilters(): DashboardFiltersDto {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { endDate: end.toISOString().slice(0, 10), startDate: start.toISOString().slice(0, 10) };
}

function formatCurrencyOrRestricted(value: number | null, scope: 'FULL' | 'OPERATIONAL'): string {
  if (scope === 'OPERATIONAL') return 'Restrito';
  return value === null ? 'Sem dados' : currencyFormat.format(value);
}

function formatTrend(trend: DashboardTrendDto): string {
  if (trend.percentageChange === null) return 'Sem comparativo anterior';
  const prefix = trend.direction === 'UP' ? '+' : '';
  return `${prefix}${numberFormat.format(trend.percentageChange)}% vs periodo anterior`;
}

function trendClass(trend: DashboardTrendDto): string {
  if (trend.favorable === null) return styles.trendNeutral ?? '';
  return trend.favorable ? styles.trendGood ?? '' : styles.trendBad ?? '';
}

function apiOrigin(): string {
  const url = new URL(publicEnv.NEXT_PUBLIC_API_URL);
  return url.origin;
}

type TextFilterKey = Exclude<keyof DashboardFiltersDto, 'status'>;

function updateTextFilter(current: DashboardFiltersDto, key: TextFilterKey, value: string): DashboardFiltersDto {
  const next = { ...current };
  if (value) {
    return { ...next, [key]: value };
  }
  delete next[key];
  return next;
}

function updateCarrierFilter(current: DashboardFiltersDto, value: string): DashboardFiltersDto {
  const next = updateTextFilter(current, 'carrierId', value);
  delete next.carrierServiceId;
  return next;
}

function updateStatusFilter(current: DashboardFiltersDto, value: string): DashboardFiltersDto {
  const next = { ...current };
  if (value) {
    return { ...next, status: value as ShipmentStatus };
  }
  delete next.status;
  return next;
}
