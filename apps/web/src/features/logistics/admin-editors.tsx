'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import styles from './logistics-management.module.css';
import { ApiClientError } from '@/services/http-client';
import { getBranch, getCarrier, saveBranch, saveCarrier, saveCarrierService, uploadCarrierLogo, type BranchInput, type CarrierInput, type ServiceInput } from '@/services/logistics-admin-service';
import { createRateTableVersion, getRateTable, saveRateTable, toggleRateTable } from '@/services/logistics-operations-service';
import { cleanCode, cleanDigits, cleanOptionalText, cleanText, isValidEmail, isValidUrl, parseLocaleNumber, parsePercent } from './form-normalizers';

const emptyBranch: BranchInput = { name: '', code: '', email: '', phone: '', postalCode: '', street: '', number: '', complement: '', district: '', city: '', state: '', country: 'BR', main: false, active: true };
const emptyCarrier: CarrierInput = { name: '', legalName: '', document: '', stateRegistration: '', email: '', phone: '', contactName: '', site: '', notes: '' };
const emptyService: ServiceInput = { code: '', name: '', modality: 'rodoviario-economico', description: '', defaultDeadlineDays: 3, cubicFactor: 300, minWeightKg: 0, maxWeightKg: 1000, maxLengthCm: 0, maxWidthCm: 0, maxHeightCm: 0, minimumValue: 0, status: 'ACTIVE' };
const serviceModalities = [
  { label: 'Rodoviário Econômico', value: 'rodoviario-economico' },
  { label: 'Rodoviário Expresso', value: 'rodoviario-expresso' },
  { label: 'Aéreo', value: 'aereo' },
  { label: 'Same Day', value: 'same-day' },
  { label: 'Carga Fracionada', value: 'fracionado' },
  { label: 'Carga Fechada', value: 'carga-fechada' },
];
const chargeTypes = [
  'MINIMUM',
  'FIXED',
  'WEIGHT',
  'EXCESS_WEIGHT',
  'AD_VALOREM',
  'GRIS',
  'TOLL',
  'INSURANCE',
  'PICKUP',
  'DELIVERY',
  'DISCOUNT_FIXED',
  'DISCOUNT_PERCENT',
  'OTHER',
];

export function BranchEditor({ id }: { id?: string }) {
  const router = useRouter(); const [form, setForm] = useState<BranchInput>(emptyBranch); const query = useQuery({ queryKey: ['branch', id], queryFn: () => getBranch(id as string), enabled: Boolean(id), retry: false });
  useEffect(() => { if (query.data) setForm({ ...emptyBranch, name: query.data.name, code: query.data.code, email: query.data.email ?? '', phone: query.data.phone ?? '', postalCode: query.data.postalCode ?? '', street: query.data.street ?? '', number: query.data.number ?? '', complement: query.data.complement ?? '', district: query.data.district ?? '', city: query.data.city ?? '', state: query.data.state ?? '', country: query.data.country ?? 'BR', main: query.data.main, active: query.data.active }); }, [query.data]);
  const mutation = useMutation({ mutationFn: () => saveBranch(form, id), onSuccess: () => router.push('/branches' as never) });
  return <EditorShell title={id ? 'Editar filial' : 'Nova filial'} error={query.error ?? mutation.error}>{query.isPending ? <p>Carregando dados...</p> : <form className={styles.form} onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}><Text label="Nome" value={form.name} required onChange={(value) => setForm({ ...form, name: value })} /><Text label="Código" value={form.code} required onChange={(value) => setForm({ ...form, code: value })} /><Text label="E-mail" value={form.email ?? ''} type="email" required onChange={(value) => setForm({ ...form, email: value })} /><Text label="Telefone" value={form.phone ?? ''} required onChange={(value) => setForm({ ...form, phone: value })} /><Text label="CEP" value={form.postalCode ?? ''} required onChange={(value) => setForm({ ...form, postalCode: value })} /><Text label="Logradouro" value={form.street ?? ''} required onChange={(value) => setForm({ ...form, street: value })} /><Text label="Número" value={form.number ?? ''} required onChange={(value) => setForm({ ...form, number: value })} /><Text label="Complemento" value={form.complement ?? ''} onChange={(value) => setForm({ ...form, complement: value })} /><Text label="Bairro" value={form.district ?? ''} required onChange={(value) => setForm({ ...form, district: value })} /><Text label="Cidade" value={form.city ?? ''} required onChange={(value) => setForm({ ...form, city: value })} /><Text label="Estado" value={form.state ?? ''} required onChange={(value) => setForm({ ...form, state: value.toUpperCase() })} /><Text label="País" value={form.country ?? 'BR'} required onChange={(value) => setForm({ ...form, country: value.toUpperCase() })} /><label><span> </span><span><input type="checkbox" checked={Boolean(form.main)} onChange={(event) => setForm({ ...form, main: event.target.checked })} /> Filial principal</span></label>{id ? <label><span> </span><span><input type="checkbox" checked={form.active !== false} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Ativa</span></label> : null}<button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Salvando...' : 'Salvar filial'}</button></form>}</EditorShell>;
}

export function CarrierEditor({ id }: { id?: string }) {
  const router = useRouter(); const [form, setForm] = useState<CarrierInput>(emptyCarrier); const [service, setService] = useState<ServiceInput>(emptyService); const [editingServiceId, setEditingServiceId] = useState<string | undefined>(); const [formError, setFormError] = useState<string | null>(null); const query = useQuery({ queryKey: ['carrier', id], queryFn: () => getCarrier(id as string), enabled: Boolean(id), retry: false });
  useEffect(() => { if (query.data) setForm({ ...emptyCarrier, name: query.data.name, code: query.data.code ?? '', document: query.data.document ?? '', legalName: query.data.legalName ?? '', stateRegistration: query.data.stateRegistration ?? '', email: query.data.email ?? '', phone: query.data.phone ?? '', contactName: query.data.contactName ?? '', site: query.data.site ?? '', notes: query.data.notes ?? '' }); }, [query.data]);
  const mutation = useMutation({ mutationFn: () => saveCarrier(normalizeCarrierInput(form), id), onSuccess: (carrier) => { setFormError(null); if (!id) router.push(`/carriers/${carrier.id}` as never); } });
  const serviceMutation = useMutation({ mutationFn: () => saveCarrierService(id as string, normalizeServiceInput(service), editingServiceId), onSuccess: () => { setFormError(null); setService(emptyService); setEditingServiceId(undefined); void query.refetch(); } });
  const logoMutation = useMutation({ mutationFn: (file: File) => uploadCarrierLogo(id as string, file), onSuccess: () => { setFormError(null); void query.refetch(); } });
  function submitCarrier(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const validation = validateCarrierInput(form);
    setFormError(validation);
    if (!validation) mutation.mutate();
  }
  function submitService(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const validation = validateServiceInput(service);
    setFormError(validation);
    if (!validation) serviceMutation.mutate();
  }
  if (!id) return <EditorShell title="Nova transportadora" error={formError ?? mutation.error}><form className={styles.form} onSubmit={submitCarrier}><CarrierFields form={form} setForm={setForm} /><button type="submit" disabled={mutation.isPending}>Salvar transportadora</button></form></EditorShell>;
  return <EditorShell title="Transportadora" error={formError ?? query.error ?? mutation.error ?? serviceMutation.error ?? logoMutation.error}><div className={styles.panel}><form className={styles.form} onSubmit={submitCarrier}><CarrierFields form={form} setForm={setForm} /><button type="submit" disabled={mutation.isPending}>Salvar dados gerais</button></form></div>{query.data ? <section className={styles.panel}><h2>Logo da transportadora</h2><div className={styles.logoBox}><span className={styles.logoPreview}>{query.data.logoUrl ? <img src={query.data.logoUrl} alt={`Logo da transportadora ${query.data.name}`} /> : <span className={styles.muted}>Sem logo</span>}</span><label className={styles.fileField}>Imagem PNG, JPG ou WebP até 2 MB<input accept="image/png,image/jpeg,image/webp" type="file" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const validation = validateLogoFile(file); setFormError(validation); if (!validation) logoMutation.mutate(file); event.target.value = ''; }} /></label>{logoMutation.isPending ? <span className={styles.muted}>Enviando imagem...</span> : null}</div></section> : null}{query.data ? <section className={styles.panel}><h2>Serviços</h2><form className={styles.form} onSubmit={submitService}><Text label="Código" value={service.code} required onChange={(value) => setService({ ...service, code: cleanCode(value) })} /><Text label="Nome" value={service.name} required onChange={(value) => setService({ ...service, name: value })} /><label>Modalidade<select required value={service.modality} onChange={(event) => setService({ ...service, modality: event.target.value })}>{serviceModalities.map((modality) => <option key={modality.value} value={modality.value}>{modality.label}</option>)}</select></label><Text label="Descrição" value={service.description ?? ''} onChange={(value) => setService({ ...service, description: value })} /><NumberField integer label="Prazo base" min={1} value={service.defaultDeadlineDays} onChange={(value) => setService({ ...service, defaultDeadlineDays: value })} /><NumberField label="Fator cubagem" min={1} value={service.cubicFactor} onChange={(value) => setService({ ...service, cubicFactor: value })} /><NumberField label="Peso mínimo" value={service.minWeightKg ?? 0} onChange={(value) => setService({ ...service, minWeightKg: value })} /><NumberField label="Peso máximo" value={service.maxWeightKg ?? 0} onChange={(value) => setService({ ...service, maxWeightKg: value })} /><NumberField label="Comprimento máximo" value={service.maxLengthCm ?? 0} onChange={(value) => setService({ ...service, maxLengthCm: value })} /><NumberField label="Largura máxima" value={service.maxWidthCm ?? 0} onChange={(value) => setService({ ...service, maxWidthCm: value })} /><NumberField label="Altura máxima" value={service.maxHeightCm ?? 0} onChange={(value) => setService({ ...service, maxHeightCm: value })} /><NumberField money label="Valor mínimo" value={service.minimumValue} onChange={(value) => setService({ ...service, minimumValue: value })} /><label>Status<select value={service.status ?? 'ACTIVE'} onChange={(event) => setService({ ...service, status: event.target.value as 'ACTIVE' | 'INACTIVE' })}><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></label><div className={styles.actions}><button type="submit" disabled={serviceMutation.isPending}>{editingServiceId ? 'Salvar serviço' : 'Adicionar serviço'}</button>{editingServiceId ? <button type="button" onClick={() => { setEditingServiceId(undefined); setService(emptyService); }}>Cancelar edição</button> : null}</div></form><div className={styles.serviceList}>{query.data.services?.map((item) => <div className={styles.service} key={item.id}><span>{item.code} · {item.name} · {item.status}</span><button type="button" onClick={() => { setEditingServiceId(item.id); setService({ code: item.code, name: item.name, modality: item.modality, description: item.description ?? '', defaultDeadlineDays: item.defaultDeadlineDays, cubicFactor: item.cubicFactor, minWeightKg: item.minWeightKg ?? 0, maxWeightKg: item.maxWeightKg ?? 0, maxLengthCm: item.maxLengthCm ?? 0, maxWidthCm: item.maxWidthCm ?? 0, maxHeightCm: item.maxHeightCm ?? 0, minimumValue: item.minimumValue, status: item.status }); }}>Editar</button></div>)}</div></section> : null}</EditorShell>;
}

export function RateTableEditor({ id }: { id?: string }) {
  const router = useRouter(); const [form, setForm] = useState<any>({ name: '', carrierServiceId: '', currency: 'BRL', validFrom: new Date().toISOString().slice(0, 10), validTo: '', notes: '', status: 'INACTIVE', coverageIds: [], ranges: [{ minWeightKg: 0, maxWeightKg: 10, basePrice: 0, pricePerKg: 0, excessPricePerKg: 0, deadlineDays: 1, priority: 0 }], charges: [] }); const [formError, setFormError] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['rate-table', id], queryFn: () => getRateTable(id as string), enabled: Boolean(id), retry: false });
  useEffect(() => { if (query.data) setForm({ ...form, ...query.data, validFrom: query.data.validFrom.slice(0, 10), validTo: query.data.validTo?.slice(0, 10) ?? '', ranges: query.data.ranges, charges: query.data.charges }); }, [query.data]);
  const mutation = useMutation({ mutationFn: () => saveRateTable(normalizeRateTableInput(form), id), onSuccess: (result: any) => router.push(`/freight-tables/${result.id}` as never) });
  const versionMutation = useMutation({ mutationFn: () => createRateTableVersion(id as string), onSuccess: (result: any) => router.push(`/freight-tables/${result.id}/edit` as never) });
  const isLocked = Boolean(query.data?.usedInSimulations && query.data.usedInSimulations > 0);
  function submitRateTable(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const validation = validateRateTableInput(form, isLocked);
    setFormError(validation);
    if (!validation) mutation.mutate();
  }
  return <EditorShell title={id ? 'Editar tabela de frete' : 'Nova tabela de frete'} error={formError ?? query.error ?? mutation.error}>{isLocked ? <p className={styles.error} role="alert">Esta tabela já foi usada em {query.data?.usedInSimulations} simulação(ões). Para preservar o histórico, crie uma nova versão antes de alterar valores.</p> : null}<form className={styles.form} onSubmit={submitRateTable}><Text label="Nome" value={form.name} required onChange={(value) => setForm({ ...form, name: value })} /><Text label="Serviço ID" value={form.carrierServiceId} required onChange={(value) => setForm({ ...form, carrierServiceId: cleanText(value) })} /><Text label="Moeda" value={form.currency} required onChange={(value) => setForm({ ...form, currency: cleanText(value).toUpperCase().slice(0, 3) })} /><Text label="Início da vigência" value={form.validFrom} type="date" required onChange={(value) => setForm({ ...form, validFrom: value })} /><Text label="Fim da vigência" value={form.validTo} type="date" onChange={(value) => setForm({ ...form, validTo: value })} /><Text label="Observações" value={form.notes ?? ''} onChange={(value) => setForm({ ...form, notes: value })} /><h2 className={styles.wide}>Faixas de peso</h2>{form.ranges.map((range: any, index: number) => <div className={styles.service} key={`${index}-${range.id ?? 'new'}`}><NumberField label="Min kg" value={range.minWeightKg} onChange={(value) => updateArray(setForm, form, 'ranges', index, { minWeightKg: value })} /><NumberField label="Max kg" value={range.maxWeightKg} onChange={(value) => updateArray(setForm, form, 'ranges', index, { maxWeightKg: value })} /><NumberField money label="Base" value={range.basePrice} onChange={(value) => updateArray(setForm, form, 'ranges', index, { basePrice: value })} /><NumberField money label="Por kg" value={range.pricePerKg} onChange={(value) => updateArray(setForm, form, 'ranges', index, { pricePerKg: value })} /><NumberField money label="Excedente" value={range.excessPricePerKg ?? 0} onChange={(value) => updateArray(setForm, form, 'ranges', index, { excessPricePerKg: value })} /><NumberField integer label="Prazo" min={1} value={range.deadlineDays} onChange={(value) => updateArray(setForm, form, 'ranges', index, { deadlineDays: value })} /><NumberField integer label="Prioridade" value={range.priority ?? 0} onChange={(value) => updateArray(setForm, form, 'ranges', index, { priority: value })} /><button type="button" disabled={form.ranges.length <= 1 || isLocked} onClick={() => setForm({ ...form, ranges: form.ranges.filter((_item: any, itemIndex: number) => itemIndex !== index) })}>Remover</button></div>)}<button type="button" disabled={isLocked} onClick={() => setForm({ ...form, ranges: [...form.ranges, { minWeightKg: 0, maxWeightKg: 10, basePrice: 0, pricePerKg: 0, excessPricePerKg: 0, deadlineDays: 1, priority: form.ranges.length }] })}>Adicionar faixa</button><h2 className={styles.wide}>Adicionais</h2>{form.charges.map((charge: any, index: number) => <div className={styles.service} key={`${index}-${charge.id ?? 'new'}`}><Text label="Nome" value={charge.name} required onChange={(value) => updateArray(setForm, form, 'charges', index, { name: value })} /><label>Tipo<select required value={charge.type} onChange={(event) => updateArray(setForm, form, 'charges', index, { type: event.target.value })}>{chargeTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><span className={styles.help}>{chargeHelp(charge.type)}</span></label><NumberField money label="Valor fixo" value={charge.fixedAmount ?? 0} onChange={(value) => updateArray(setForm, form, 'charges', index, { fixedAmount: value })} /><NumberField percent label="Percentual" value={charge.percentage ?? 0} onChange={(value) => updateArray(setForm, form, 'charges', index, { percentage: value })} /><label>Status<select value={charge.active === false ? 'INACTIVE' : 'ACTIVE'} onChange={(event) => updateArray(setForm, form, 'charges', index, { active: event.target.value === 'ACTIVE' })}><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></label><button type="button" disabled={isLocked} onClick={() => setForm({ ...form, charges: form.charges.filter((_item: any, itemIndex: number) => itemIndex !== index) })}>Remover</button></div>)}<button type="button" disabled={isLocked} onClick={() => setForm({ ...form, charges: [...form.charges, { name: '', type: 'FIXED', fixedAmount: 0, percentage: 0, active: true }] })}>Adicionar adicional</button><div className={styles.actions}><button type="submit" disabled={mutation.isPending || isLocked}>Salvar tabela</button>{id ? <button type="button" disabled={versionMutation.isPending} onClick={() => versionMutation.mutate()}>Criar nova versão</button> : null}</div></form></EditorShell>;
}

export function RateTableStatusAction({ id }: { id: string }) {
  const query = useQuery({ queryKey: ['rate-table', id], queryFn: () => getRateTable(id), retry: false });
  const mutation = useMutation({ mutationFn: () => toggleRateTable(id, query.data?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'), onSuccess: () => void query.refetch() });
  if (query.isPending || !query.data) return null;
  return <div className={styles.toolbar}><span>Status: {query.data.status}</span><span>Uso histórico: {query.data.usedInSimulations ?? 0} simulação(ões)</span><button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()}>{query.data.status === 'ACTIVE' ? 'Desativar tabela' : 'Ativar tabela'}</button></div>;
}

function CarrierFields({ form, setForm }: { form: CarrierInput; setForm: (value: CarrierInput) => void }) { return <><Text label="Nome" value={form.name} required onChange={(value) => setForm({ ...form, name: value })} /><Text label="Razão social" value={form.legalName ?? ''} onChange={(value) => setForm({ ...form, legalName: value })} /><Text label="CNPJ" value={form.document ?? ''} required onChange={(value) => setForm({ ...form, document: value })} /><Text label="Inscrição estadual" value={form.stateRegistration ?? ''} onChange={(value) => setForm({ ...form, stateRegistration: value })} /><Text label="E-mail" value={form.email ?? ''} type="email" required onChange={(value) => setForm({ ...form, email: value })} /><Text label="Telefone" value={form.phone ?? ''} required onChange={(value) => setForm({ ...form, phone: value })} /><Text label="Contato" value={form.contactName ?? ''} onChange={(value) => setForm({ ...form, contactName: value })} /><Text label="Site" value={form.site ?? ''} onChange={(value) => setForm({ ...form, site: value })} /><Text label="Observações" value={form.notes ?? ''} onChange={(value) => setForm({ ...form, notes: value })} /></>; }
function Text({ label, value, onChange, required, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) { return <label>{label}<input required={required} type={type} value={value} onBlur={(event) => onChange(event.target.value.trim())} onChange={(event) => onChange(event.target.value)} /></label>; }
function NumberField({ integer, label, min = 0, money, onChange, percent, value }: { integer?: boolean; label: string; min?: number; money?: boolean; onChange: (value: number) => void; percent?: boolean; value: number }) {
  return <label>{label}<input inputMode="decimal" min={min} type="text" value={String(value).replace('.', ',')} onChange={(event) => { const parsed = percent ? parsePercent(event.target.value) : parseLocaleNumber(event.target.value); onChange(integer ? Math.trunc(parsed) : parsed); }} />{money ? <span className={styles.help}>Aceita 3500,00 ou 3500.00</span> : null}{percent ? <span className={styles.help}>Aceita 0,23, 0.23 ou 23%</span> : null}</label>;
}
function updateArray(setForm: (value: any) => void, form: any, key: string, index: number, patch: object) { const items = [...form[key]]; items[index] = { ...items[index], ...patch }; setForm({ ...form, [key]: items }); }
function EditorShell({ title, error, children }: { title: string; error: unknown; children: ReactNode }) { return <section className={styles.panel}><div className={styles.header}><h2>{title}</h2><Link href="/dashboard">Voltar</Link></div>{error ? <p className={styles.error} role="alert">{error instanceof ApiClientError ? error.response.message : 'Não foi possível carregar ou salvar os dados.'}</p> : null}{children}</section>; }

function normalizeCarrierInput(input: CarrierInput): CarrierInput {
  return {
    code: cleanOptionalText(input.code ? cleanCode(input.code) : ''),
    contactName: cleanOptionalText(input.contactName),
    document: cleanOptionalText(cleanDigits(input.document)),
    email: cleanOptionalText(input.email?.toLowerCase()),
    legalName: cleanOptionalText(input.legalName),
    name: cleanText(input.name),
    notes: cleanOptionalText(input.notes),
    phone: cleanOptionalText(cleanDigits(input.phone)),
    site: cleanOptionalText(input.site),
    stateRegistration: cleanOptionalText(input.stateRegistration),
  };
}

function normalizeServiceInput(input: ServiceInput): ServiceInput {
  return {
    code: cleanCode(input.code),
    cubicFactor: parseLocaleNumber(input.cubicFactor),
    defaultDeadlineDays: Math.trunc(parseLocaleNumber(input.defaultDeadlineDays)),
    description: cleanOptionalText(input.description),
    maxHeightCm: parseLocaleNumber(input.maxHeightCm),
    maxLengthCm: parseLocaleNumber(input.maxLengthCm),
    maxWeightKg: parseLocaleNumber(input.maxWeightKg),
    maxWidthCm: parseLocaleNumber(input.maxWidthCm),
    minWeightKg: parseLocaleNumber(input.minWeightKg),
    minimumValue: parseLocaleNumber(input.minimumValue),
    modality: cleanText(input.modality),
    name: cleanText(input.name),
    status: input.status ?? 'ACTIVE',
  };
}

function normalizeRateTableInput(form: any) {
  return {
    carrierServiceId: cleanText(form.carrierServiceId),
    charges: form.charges.map((charge: any) => ({
      active: charge.active !== false,
      fixedAmount: parseLocaleNumber(charge.fixedAmount),
      name: cleanText(charge.name),
      percentage: parsePercent(charge.percentage),
      type: charge.type,
    })),
    coverageIds: Array.isArray(form.coverageIds) ? form.coverageIds : [],
    currency: cleanText(form.currency).toUpperCase(),
    name: cleanText(form.name),
    notes: cleanOptionalText(form.notes),
    ranges: form.ranges.map((range: any) => ({
      basePrice: parseLocaleNumber(range.basePrice),
      deadlineDays: Math.trunc(parseLocaleNumber(range.deadlineDays)),
      excessPricePerKg: parseLocaleNumber(range.excessPricePerKg),
      maxWeightKg: parseLocaleNumber(range.maxWeightKg),
      minWeightKg: parseLocaleNumber(range.minWeightKg),
      pricePerKg: parseLocaleNumber(range.pricePerKg),
      priority: Math.trunc(parseLocaleNumber(range.priority)),
    })),
    status: form.status,
    validFrom: form.validFrom,
    validTo: form.validTo || undefined,
  };
}

function validateCarrierInput(input: CarrierInput): string | null {
  if (cleanText(input.name).length < 2) return 'Informe o nome da transportadora com pelo menos 2 caracteres.';
  if (input.document && cleanDigits(input.document).length !== 14) return 'Informe um CNPJ com 14 dígitos.';
  if (!isValidEmail(input.email)) return 'Informe um e-mail válido.';
  if (!isValidUrl(input.site)) return 'Informe uma URL válida para o site.';
  return null;
}

function validateServiceInput(input: ServiceInput): string | null {
  const service = normalizeServiceInput(input);
  if (service.code.length < 2) return 'Informe um código de serviço válido.';
  if (service.name.length < 2) return 'Informe o nome do serviço.';
  if (service.defaultDeadlineDays < 1) return 'O prazo base precisa ser maior que zero.';
  if (service.cubicFactor < 1) return 'O fator de cubagem precisa ser maior que zero.';
  if ((service.maxWeightKg ?? 0) > 0 && (service.maxWeightKg ?? 0) <= (service.minWeightKg ?? 0)) return 'O peso máximo deve ser maior que o peso mínimo.';
  if (service.minimumValue < 0) return 'O valor mínimo não pode ser negativo.';
  return null;
}

function validateLogoFile(file: File): string | null {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return 'Envie uma imagem PNG, JPG ou WebP.';
  if (file.size > 2 * 1024 * 1024) return 'A imagem deve ter no máximo 2 MB.';
  return null;
}

function validateRateTableInput(form: any, locked: boolean): string | null {
  const input = normalizeRateTableInput(form);
  if (locked) return 'Tabela já utilizada. Use Criar nova versão para preservar o histórico.';
  if (input.name.length < 2) return 'Informe o nome da tabela.';
  if (!input.carrierServiceId) return 'Informe o serviço da tabela.';
  if (input.currency.length !== 3) return 'A moeda deve usar 3 letras, como BRL.';
  if (input.validTo && new Date(input.validTo) <= new Date(input.validFrom)) return 'O fim da vigência deve ser posterior ao início.';
  if (input.ranges.length === 0) return 'Inclua ao menos uma faixa de peso.';
  const ordered = [...input.ranges].sort((a, b) => a.minWeightKg - b.minWeightKg);
  for (const range of ordered) {
    if (range.minWeightKg < 0 || range.maxWeightKg <= range.minWeightKg) return 'Revise as faixas: o peso máximo deve ser maior que o mínimo.';
    if (range.basePrice < 0 || range.pricePerKg < 0 || range.deadlineDays < 1) return 'Revise valores e prazo das faixas.';
  }
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index - 1] && ordered[index] && ordered[index - 1].maxWeightKg >= ordered[index].minWeightKg) return 'As faixas de peso não podem se sobrepor.';
  }
  if (input.charges.some((charge: any) => !charge.name || !charge.type)) return 'Informe nome e tipo para todos os adicionais.';
  return null;
}

function chargeHelp(type: string): string {
  if (['AD_VALOREM', 'GRIS', 'DISCOUNT_PERCENT'].includes(type)) return 'Calculado por percentual.';
  if (['FIXED', 'TOLL', 'INSURANCE', 'PICKUP', 'DELIVERY', 'DISCOUNT_FIXED'].includes(type)) return 'Calculado por valor fixo.';
  return 'Componente aplicado conforme regra do motor de frete.';
}
