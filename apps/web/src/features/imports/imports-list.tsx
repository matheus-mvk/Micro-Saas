'use client';

import { ImportStatus, ImportType } from '@logistics/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUp, RefreshCw, RotateCcw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import styles from './imports.module.css';

import { Button } from '@/components/ui/button';
import { cancelImport, importsQueryKeys, listImports, retryImport } from '@/services/imports-service';

const statusLabels: Record<ImportStatus, string> = {
  CANCELED: 'Cancelada',
  COMPLETED: 'Concluida',
  FAILED: 'Falhou',
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
};

export function ImportsList() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, perPage: 10, search: '', status: '' as ImportStatus | '', type: '' as ImportType | '' });
  const query = useQuery({ queryKey: importsQueryKeys.list(filters), queryFn: () => listImports(filters) });
  const cancelMutation = useMutation({
    mutationFn: cancelImport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['imports'] }),
  });
  const retryMutation = useMutation({
    mutationFn: retryImport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['imports'] }),
  });

  return (
    <div className={styles.stack}>
      <header className={styles.header}>
        <div>
          <h1>Importacoes</h1>
          <p className={styles.muted}>Envie arquivos operacionais, acompanhe progresso e consulte resultados por linha.</p>
        </div>
        <Link className={styles.buttonLink} href={'/imports/new' as never}><FileUp size={18} /> Nova importacao</Link>
      </header>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <label className={styles.field}>
            Busca
            <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, page: 1, search: event.target.value }))} placeholder="Arquivo" />
          </label>
          <label className={styles.field}>
            Tipo
            <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, page: 1, type: event.target.value as ImportType | '' }))}>
              <option value="">Todos</option>
              <option value={ImportType.CUSTOMERS}>Clientes</option>
              <option value={ImportType.CARRIERS}>Transportadoras</option>
            </select>
          </label>
          <label className={styles.field}>
            Status
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, page: 1, status: event.target.value as ImportStatus | '' }))}>
              <option value="">Todos</option>
              {Object.values(ImportStatus).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </label>
          <Button type="button" variant="secondary" onClick={() => void query.refetch()}><RefreshCw size={16} /> Atualizar</Button>
        </div>

        {query.isPending ? <p className={styles.message}>Carregando importacoes...</p> : null}
        {query.isError ? <p className={styles.error}>Nao foi possivel carregar o historico de importacoes.</p> : null}
        {query.data && query.data.data.length === 0 ? <p className={styles.message}>Nenhuma importacao encontrada para os filtros atuais.</p> : null}

        {query.data && query.data.data.length > 0 ? (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Progresso</th>
                  <th>Linhas</th>
                  <th>Usuario</th>
                  <th>Data</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((item) => (
                  <tr key={item.id}>
                    <td><Link href={`/imports/${item.id}` as never}>{item.filename}</Link></td>
                    <td>{item.type === ImportType.CUSTOMERS ? 'Clientes' : 'Transportadoras'}</td>
                    <td><span className={`${styles.status} ${styles[item.status]}`}>{statusLabels[item.status]}</span></td>
                    <td>
                      <div className={styles.progress} aria-label={`${item.progress}% processado`}><span style={{ width: `${item.progress}%` }} /></div>
                    </td>
                    <td>{item.processedRows}/{item.totalRows} - {item.successRows} ok - {item.errorRows} erro</td>
                    <td>{item.user.name}</td>
                    <td>{new Date(item.createdAt).toLocaleString('pt-BR')}</td>
                    <td>
                      <div className={styles.actions}>
                        {[ImportStatus.PENDING, ImportStatus.PROCESSING].includes(item.status) ? (
                          <Button type="button" variant="secondary" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(item.id)}><XCircle size={15} /> Cancelar</Button>
                        ) : null}
                        {[ImportStatus.FAILED, ImportStatus.CANCELED].includes(item.status) ? (
                          <Button type="button" variant="secondary" disabled={retryMutation.isPending} onClick={() => retryMutation.mutate(item.id)}><RotateCcw size={15} /> Retry</Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {query.data ? (
          <div className={styles.actions}>
            <Button type="button" variant="secondary" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Anterior</Button>
            <span>Pagina {query.data.meta.page} de {Math.max(1, query.data.meta.totalPages)}</span>
            <Button type="button" variant="secondary" disabled={query.data.meta.page >= query.data.meta.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Proxima</Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
