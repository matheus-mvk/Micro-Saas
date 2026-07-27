'use client';

import { ImportStatus, type ImportProgressEventDto } from '@logistics/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, RefreshCw, RotateCcw, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

import styles from './imports.module.css';

import { Button } from '@/components/ui/button';
import { cancelImport, getImport, importErrorsUrl, importsQueryKeys, retryImport } from '@/services/imports-service';
import { publicEnv } from '@/lib/env';

const labels: Record<ImportStatus, string> = {
  CANCELED: 'Cancelada',
  COMPLETED: 'Concluida',
  FAILED: 'Falhou',
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
};

export function ImportDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const query = useQuery({ queryKey: importsQueryKeys.detail(id), queryFn: () => getImport(id), refetchInterval: connected ? false : 5000 });
  const cancelMutation = useMutation({ mutationFn: cancelImport, onSuccess: (job) => queryClient.setQueryData(importsQueryKeys.detail(job.id), (current: unknown) => ({ ...(current as object), ...job })) });
  const retryMutation = useMutation({ mutationFn: retryImport, onSuccess: () => void query.refetch() });

  useEffect(() => {
    const socket = io(`${apiOrigin()}/realtime`, { transports: ['websocket'], withCredentials: true });
    const handleProgress = (event: ImportProgressEventDto) => {
      if (event.importJobId !== id) return;
      void queryClient.invalidateQueries({ queryKey: importsQueryKeys.detail(id) });
    };
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('tenant:join', {});
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('import.started', handleProgress);
    socket.on('import.progress', handleProgress);
    socket.on('import.completed', handleProgress);
    socket.on('import.failed', handleProgress);
    socket.on('import.cancelled', handleProgress);
    return () => {
      socket.disconnect();
    };
  }, [id, queryClient]);

  const job = query.data;
  const rows = useMemo(() => job?.rows.data ?? [], [job]);

  if (query.isPending) return <p className={styles.message}>Carregando importacao...</p>;
  if (query.isError || !job) return <p className={styles.error}>Nao foi possivel carregar a importacao.</p>;

  return (
    <div className={styles.stack}>
      <header className={styles.header}>
        <div>
          <h1>{job.filename}</h1>
          <p className={styles.muted}>{job.type === 'CUSTOMERS' ? 'Clientes' : 'Transportadoras'} - {connected ? 'realtime conectado' : 'realtime reconectando com fallback'}</p>
        </div>
        <div className={styles.actions}>
          {[ImportStatus.PENDING, ImportStatus.PROCESSING].includes(job.status) ? <Button type="button" variant="secondary" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(job.id)}><XCircle size={16} /> Cancelar</Button> : null}
          {[ImportStatus.FAILED, ImportStatus.CANCELED].includes(job.status) ? <Button type="button" variant="secondary" disabled={retryMutation.isPending} onClick={() => retryMutation.mutate(job.id)}><RotateCcw size={16} /> Retry</Button> : null}
          <a className={styles.buttonLink} href={importErrorsUrl(job.id)}><Download size={16} /> Erros CSV</a>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.metrics}>
          <Metric label="Status" value={labels[job.status]} />
          <Metric label="Processadas" value={`${job.processedRows}/${job.totalRows}`} />
          <Metric label="Sucesso" value={String(job.successRows)} />
          <Metric label="Erros" value={String(job.errorRows)} />
          <Metric label="Ignoradas" value={String(job.skippedRows)} />
        </div>
        <div className={styles.progress} aria-label={`${job.progress}% processado`}><span style={{ width: `${job.progress}%` }} /></div>
        {job.failureReason ? <p className={styles.error}>{job.failureReason}</p> : null}
      </section>

      <section className={styles.panel}>
        <h2>Linhas processadas</h2>
        {rows.length === 0 ? <p className={styles.message}>Nenhuma linha registrada ainda.</p> : null}
        {rows.length > 0 ? (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Linha</th>
                  <th>Status</th>
                  <th>Referencia</th>
                  <th>Recurso</th>
                  <th>Erro</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.rowNumber}</td>
                    <td>{row.status}</td>
                    <td>{row.externalReference ?? '-'}</td>
                    <td>{row.createdResourceId ?? '-'}</td>
                    <td>{row.errorMessage ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <Button type="button" variant="secondary" onClick={() => void query.refetch()}><RefreshCw size={16} /> Atualizar</Button>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <span className={styles.muted}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function apiOrigin(): string {
  const url = new URL(publicEnv.NEXT_PUBLIC_API_URL);
  return url.origin;
}
