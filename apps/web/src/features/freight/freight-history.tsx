'use client';

import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import styles from './freight-simulation-workspace.module.css';

import { EmptyState } from '@/components/feedback/empty-state';
import { freightQueryKeys, getFreightSimulationHistory } from '@/services/freight-service';

export function FreightHistory() {
  const defaultPeriod = useMemo(defaultHistoryPeriod, []);
  const [period, setPeriod] = useState(defaultPeriod);
  const history = useQuery({
    queryKey: freightQueryKeys.history(period),
    queryFn: () => getFreightSimulationHistory(period),
    retry: false,
  });

  return (
    <section className={styles.panel} aria-labelledby="freight-history-title">
      <div className={styles.panelHeader}>
        <div>
          <p>Histórico persistido</p>
          <h2 id="freight-history-title">Simulações realizadas</h2>
        </div>
        <button type="button" onClick={() => void history.refetch()} disabled={history.isFetching}>
          <RefreshCw size={16} aria-hidden="true" />
          Atualizar
        </button>
      </div>
      <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); void history.refetch(); }}>
        <label>
          Início do período
          <input type="date" value={period.startDate} onChange={(event) => setPeriod({ ...period, startDate: event.target.value })} />
        </label>
        <label>
          Fim do período
          <input type="date" value={period.endDate} onChange={(event) => setPeriod({ ...period, endDate: event.target.value })} />
        </label>
        <button type="button" onClick={() => setPeriod(defaultHistoryPeriod())}>
          Últimos 2 meses
        </button>
      </form>

      {history.isPending ? <p>Carregando histórico...</p> : null}
      {history.error ? (
        <p className={styles.error} role="alert">
          Não foi possível carregar o histórico.
        </p>
      ) : null}
      {history.data?.data.length === 0 ? (
        <EmptyState title="Nenhuma simulação salva" description="Execute uma simulação para popular o histórico deste tenant." />
      ) : null}
      {history.data && history.data.data.length > 0 ? (
        <div className={styles.results}>
          {history.data.data.map((item) => (
            <article className={styles.option} key={item.id}>
              <div>
                <strong>{item.customerName ?? 'Cliente não informado'}</strong>
                <span>
                  {item.originPostalCode} {'->'} {item.destinationPostalCode}
                </span>
              </div>
              <div className={styles.metrics}>
                <span>{new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                <span>{item.optionCount} opções</span>
                <span>{item.lowestPrice === null ? 'Sem preço' : formatMoney(item.lowestPrice)}</span>
                <span>{item.selectedOption ? 'Opção selecionada' : 'Sem seleção'}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value);
}

function defaultHistoryPeriod(): { endDate: string; startDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 2);
  return { endDate: toDateInputValue(end), startDate: toDateInputValue(start) };
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
