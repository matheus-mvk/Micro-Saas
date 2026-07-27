'use client';

import { InsightCategory, InsightSeverity, InsightStatus } from '@logistics/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import styles from './insights.module.css';

import { Button } from '@/components/ui/button';
import { dismissInsight, getInsightSummary, insightsQueryKeys, listInsights, markInsightRead, refreshInsights } from '@/services/insights-service';

const categoryLabels: Record<InsightCategory, string> = {
  CARRIER: 'Transportadoras',
  COST: 'Custos',
  CUSTOMER: 'Clientes',
  DATA_QUALITY: 'Qualidade dos dados',
  DEADLINE: 'Prazos',
  IMPORT: 'Importacoes',
  OPERATION: 'Operacao',
  ROUTE: 'Rotas',
};

const severityLabels: Record<InsightSeverity, string> = {
  CRITICAL: 'Critico',
  INFO: 'Informativo',
  OPPORTUNITY: 'Oportunidade',
  WARNING: 'Alerta',
};

const statusLabels: Record<InsightStatus, string> = {
  DISMISSED: 'Dispensado',
  NEW: 'Novo',
  READ: 'Lido',
  RESOLVED: 'Resolvido',
};

export function InsightsWorkspace() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    category: '' as InsightCategory | '',
    endDate: '',
    page: 1,
    perPage: 12,
    severity: '' as InsightSeverity | '',
    startDate: '',
    status: '' as InsightStatus | '',
  });
  const summaryQuery = useQuery({ queryKey: insightsQueryKeys.summary, queryFn: getInsightSummary });
  const insightsQuery = useQuery({ queryKey: insightsQueryKeys.list(filters), queryFn: () => listInsights(filters) });
  const refreshMutation = useMutation({
    mutationFn: refreshInsights,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
  const readMutation = useMutation({
    mutationFn: markInsightRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['insights'] }),
  });
  const dismissMutation = useMutation({
    mutationFn: dismissInsight,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['insights'] }),
  });

  return (
    <div className={styles.stack}>
      <header className={styles.header}>
        <div>
          <h1>Insights</h1>
          <p className={styles.muted}>Regras deterministicas baseadas nos dados reais do tenant.</p>
        </div>
        <Button type="button" disabled={refreshMutation.isPending} onClick={() => refreshMutation.mutate()}>
          <RefreshCw size={16} /> Gerar insights
        </Button>
      </header>

      <section className={styles.summary} aria-label="Resumo de insights">
        <SummaryCard label="Ativos" value={summaryQuery.data?.active ?? 0} />
        <SummaryCard label="Novos" value={summaryQuery.data?.newCount ?? 0} />
        <SummaryCard label="Oportunidades" value={summaryQuery.data?.opportunities ?? 0} />
        <SummaryCard label="Criticos" value={summaryQuery.data?.bySeverity.CRITICAL ?? 0} />
      </section>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <label className={styles.field}>
            Categoria
            <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as InsightCategory | '', page: 1 }))}>
              <option value="">Todas</option>
              {Object.values(InsightCategory).map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            Severidade
            <select value={filters.severity} onChange={(event) => setFilters((current) => ({ ...current, page: 1, severity: event.target.value as InsightSeverity | '' }))}>
              <option value="">Todas</option>
              {Object.values(InsightSeverity).map((severity) => <option key={severity} value={severity}>{severityLabels[severity]}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            Status
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, page: 1, status: event.target.value as InsightStatus | '' }))}>
              <option value="">Ativos</option>
              {Object.values(InsightStatus).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            Inicio
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, startDate: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            Fim
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value, page: 1 }))}
            />
          </label>
          <label className={styles.field}>
            Por pagina
            <select value={filters.perPage} onChange={(event) => setFilters((current) => ({ ...current, page: 1, perPage: Number(event.target.value) }))}>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </label>
        </div>

        {refreshMutation.isSuccess ? <p className={styles.message}>{refreshMutation.data.generated} insight(s) gerados ou atualizados.</p> : null}
        {insightsQuery.isPending ? <p className={styles.message}>Carregando insights...</p> : null}
        {insightsQuery.isError ? <p className={styles.error}>Nao foi possivel carregar os insights.</p> : null}
        {insightsQuery.data && insightsQuery.data.data.length === 0 ? <p className={styles.message}>Nenhum insight encontrado para os filtros atuais. Gere novamente quando houver mais dados operacionais.</p> : null}

        <div className={styles.grid}>
          {insightsQuery.data?.data.map((insight) => (
            <article className={styles.card} key={insight.id}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={`${styles.badge} ${styles[insight.severity]}`}>{severityLabels[insight.severity]}</span>
                  <h2>{insight.title}</h2>
                </div>
                <span className={styles.muted}>{categoryLabels[insight.category]}</span>
              </div>
              <p>{insight.description}</p>
              <p className={styles.muted}>
                Periodo: {new Date(insight.periodStart).toLocaleDateString('pt-BR')} ate {new Date(insight.periodEnd).toLocaleDateString('pt-BR')}
              </p>
              <p className={styles.muted}>Evidencia: {formatEvidence(insight.evidence)}</p>
              <div className={styles.actions}>
                {insight.actionUrl ? <Link className={styles.linkButton} href={insight.actionUrl as never}>Abrir contexto</Link> : null}
                {insight.status === InsightStatus.NEW ? <Button type="button" variant="secondary" disabled={readMutation.isPending} onClick={() => readMutation.mutate(insight.id)}><Check size={15} /> Lido</Button> : null}
                <Button type="button" variant="secondary" disabled={dismissMutation.isPending} onClick={() => dismissMutation.mutate(insight.id)}><X size={15} /> Dispensar</Button>
              </div>
            </article>
          ))}
        </div>

        {insightsQuery.data ? (
          <div className={styles.pagination} aria-label="Paginacao de insights">
            <span>
              Pagina {insightsQuery.data.meta.page} de {Math.max(1, insightsQuery.data.meta.totalPages)} - {insightsQuery.data.meta.total} insight(s)
            </span>
            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                disabled={filters.page <= 1 || insightsQuery.isFetching}
                onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={filters.page >= insightsQuery.data.meta.totalPages || insightsQuery.isFetching}
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              >
                Proxima
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.summaryCard}>
      <span className={styles.muted}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatEvidence(evidence: Record<string, unknown>): string {
  return Object.entries(evidence).slice(0, 4).map(([key, value]) => `${key}: ${String(value)}`).join(' | ');
}
