'use client';

import { ImportType } from '@logistics/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import styles from './imports.module.css';

import { Button } from '@/components/ui/button';
import { createImport, getImportTemplate, previewImport } from '@/services/imports-service';

const labels: Record<ImportType, string> = {
  CARRIERS: 'Transportadoras',
  CUSTOMERS: 'Clientes',
};

export function ImportWizard() {
  const router = useRouter();
  const [type, setType] = useState<ImportType>(ImportType.CUSTOMERS);
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [duplicateStrategy, setDuplicateStrategy] = useState<'SKIP' | 'UPDATE' | 'FAIL'>('UPDATE');
  const templateQuery = useQuery({ queryKey: ['imports', 'template', type], queryFn: () => getImportTemplate(type) });
  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione um arquivo.');
      return previewImport(file, type);
    },
    onSuccess: (preview) => setMapping(preview.mapping),
  });
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione um arquivo.');
      return createImport(file, { duplicateStrategy, mapping, type });
    },
    onSuccess: (job) => router.replace(`/imports/${job.id}` as never),
  });
  const preview = previewMutation.data;
  const headers = useMemo(() => preview?.detectedHeaders ?? [], [preview]);

  function downloadTemplate(): void {
    if (!templateQuery.data) return;
    const blob = new Blob([templateQuery.data.csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `modelo-${type.toLowerCase()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.stack}>
      <header className={styles.header}>
        <div>
          <h1>Nova importacao</h1>
          <p className={styles.muted}>Valide o arquivo antes de iniciar o processamento assincrono.</p>
        </div>
      </header>

      <div className={styles.stepper} aria-label="Etapas da importacao">
        <span className={`${styles.step} ${styles.stepActive}`}>1 Tipo</span>
        <span className={`${styles.step} ${file ? styles.stepActive : ''}`}>2 Arquivo</span>
        <span className={`${styles.step} ${preview ? styles.stepActive : ''}`}>3 Preview</span>
        <span className={`${styles.step} ${preview && preview.structuralErrors.length === 0 ? styles.stepActive : ''}`}>4 Confirmacao</span>
      </div>

      <section className={styles.panel}>
        <h2>Tipo e modelo</h2>
        <div className={styles.grid}>
          <label className={styles.field}>
            Tipo de importacao
            <select value={type} onChange={(event) => { setType(event.target.value as ImportType); setMapping({}); }}>
              <option value={ImportType.CUSTOMERS}>Clientes</option>
              <option value={ImportType.CARRIERS}>Transportadoras</option>
            </select>
          </label>
          <label className={styles.field}>
            Duplicidade
            <select value={duplicateStrategy} onChange={(event) => setDuplicateStrategy(event.target.value as 'SKIP' | 'UPDATE' | 'FAIL')}>
              <option value="UPDATE">Atualizar existentes</option>
              <option value="SKIP">Ignorar existentes</option>
              <option value="FAIL">Falhar em duplicidade</option>
            </select>
          </label>
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={downloadTemplate} disabled={!templateQuery.data}><Download size={16} /> Baixar modelo</Button>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Arquivo</h2>
        <label className={styles.dropzone} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setFile(event.dataTransfer.files.item(0)); }}>
          <FileSpreadsheet size={32} />
          <strong>{file ? file.name : 'Arraste um CSV/XLSX ou selecione manualmente'}</strong>
          <span className={styles.muted}>Tamanho maximo configurado no backend. O arquivo nao fica publico.</span>
          <input accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" type="file" onChange={(event) => setFile(event.target.files?.item(0) ?? null)} />
        </label>
        <Button type="button" disabled={!file || previewMutation.isPending} onClick={() => previewMutation.mutate()}>Ler arquivo</Button>
        {previewMutation.isError ? <p className={styles.error}>Nao foi possivel ler o arquivo. Confira formato, cabecalhos e conteudo.</p> : null}
      </section>

      {preview ? (
        <section className={styles.panel}>
          <h2>Preview de {labels[preview.type]}</h2>
          <p className={styles.muted}>{preview.totalRows} linha(s) detectada(s). Cabecalhos: {preview.detectedHeaders.join(', ')}</p>
          {preview.structuralErrors.length ? <p className={styles.error}>{preview.structuralErrors.join(' ')}</p> : <p className={styles.success}>Estrutura valida para iniciar o job.</p>}
          <div className={styles.grid}>
            {preview.fields.map((field) => (
              <label key={field.key} className={styles.field}>
                {field.label}{field.required ? ' *' : ''}
                <select value={mapping[field.key] ?? ''} onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}>
                  <option value="">Nao mapear</option>
                  {headers.map((header) => <option key={header} value={header}>{header}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Linha</th>
                  {headers.map((header) => <th key={header}>{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.previewRows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td>{row.rowNumber}</td>
                    {headers.map((header) => <td key={header}>{row.values[header]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.actions}>
            <Button type="button" disabled={preview.structuralErrors.length > 0 || createMutation.isPending} onClick={() => createMutation.mutate()}><Play size={16} /> Iniciar importacao</Button>
          </div>
          {createMutation.isError ? <p className={styles.error}>Nao foi possivel criar a importacao.</p> : null}
        </section>
      ) : null}
    </div>
  );
}
