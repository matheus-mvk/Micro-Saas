'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { useState, type ComponentType, type ReactNode } from 'react';
import NextLink from 'next/link';
import styles from './logistics-management.module.css';
import { EmptyState } from '@/components/feedback/empty-state';
import { ApiClientError } from '@/services/http-client';
import { getAdminShipments, getAuditLogs, getRateTables, updateShipmentStatus } from '@/services/logistics-operations-service';

const Link = NextLink as unknown as ComponentType<{ href: string; children?: ReactNode; [key: string]: unknown }>;


export function OperationsManagement({ kind }: { kind: 'shipments' | 'rates' | 'audit' }) {
  const [message, setMessage] = useState<string | null>(null);
  const shipments = useQuery({ queryKey: ['admin', 'shipments'], queryFn: getAdminShipments, enabled: kind === 'shipments', retry: false });
  const rates = useQuery({ queryKey: ['admin', 'rates'], queryFn: getRateTables, enabled: kind === 'rates', retry: false });
  const audit = useQuery({ queryKey: ['admin', 'audit'], queryFn: getAuditLogs, enabled: kind === 'audit', retry: false });
  const error = shipments.error ?? rates.error ?? audit.error;
  if (error) return <p className={styles.error} role="alert">{error instanceof ApiClientError ? error.response.message : 'Não foi possível carregar este módulo.'}</p>;
  return <section className={styles.panel}>
    <div className={styles.header}><div><h2>{kind === 'shipments' ? 'Shipments' : kind === 'rates' ? 'Tabelas de frete' : 'Auditoria administrativa'}</h2><p>{kind === 'shipments' ? 'Operações reais criadas a partir de simulações.' : kind === 'rates' ? 'Versões vigentes e componentes persistidos.' : 'Rastreabilidade do tenant autenticado.'}</p></div><div className={styles.toolbar}>{kind === 'rates' ? <Link href="/freight-tables/new">Nova tabela</Link> : null}<button type="button" onClick={() => { if (kind === 'shipments') void shipments.refetch(); if (kind === 'rates') void rates.refetch(); if (kind === 'audit') void audit.refetch(); }}><RefreshCw size={15} /> Atualizar</button></div></div>
    {message ? <p className={styles.success} role="status"><CheckCircle2 size={16} /> {message}</p> : null}
    {(shipments.isPending || rates.isPending || audit.isPending) ? <p className={styles.muted}>Carregando dados...</p> : null}
    {kind === 'shipments' && shipments.data?.data.length === 0 ? <EmptyState title="Nenhuma Shipment" description="Selecione uma opção em uma simulação para criar uma operação." /> : null}
    {kind === 'rates' && rates.data?.data.length === 0 ? <EmptyState title="Nenhuma tabela de frete" description="As tabelas podem ser criadas a partir da configuração de cada serviço." /> : null}
    {kind === 'audit' && audit.data?.data.length === 0 ? <EmptyState title="Nenhum evento de auditoria" description="As operações administrativas aparecerão aqui." /> : null}
    {kind === 'shipments' && shipments.data && shipments.data.data.length > 0 ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Rastreamento</th><th>Transportadora</th><th>Frete</th><th>Previsão</th><th>Status</th><th>Ação</th></tr></thead><tbody>{shipments.data.data.map((item) => <tr key={item.id}><td><strong>{item.trackingCode}</strong><br /><small>{item.externalReference ?? 'Sem referência'}</small></td><td>{item.carrierName}<br /><small>{item.carrierServiceName}</small></td><td>R$ {item.freightValue.toFixed(2)}</td><td>{new Date(item.estimatedDeliveryAt).toLocaleDateString('pt-BR')}</td><td>{item.status}</td><td><Link href={`/shipments/${item.id}` as never}>Abrir operação</Link></td></tr>)}</tbody></table></div> : null}
    {kind === 'rates' && rates.data && rates.data.data.length > 0 ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Tabela</th><th>Transportadora</th><th>Serviço</th><th>Vigência</th><th>Faixas</th><th>Status</th></tr></thead><tbody>{rates.data.data.map((item) => <tr key={item.id}><td><Link href={`/freight-tables/${item.id}`}>{item.name}</Link><br /><small>Versão {item.version} · {item.currency}</small></td><td>{item.carrierName}</td><td>{item.serviceName}</td><td>{new Date(item.validFrom).toLocaleDateString('pt-BR')} - {item.validTo ? new Date(item.validTo).toLocaleDateString('pt-BR') : 'aberta'}</td><td>{item.ranges.length} faixa(s)<br /><small>{item.charges.length} adicional(is)</small></td><td>{item.status}</td></tr>)}</tbody></table></div> : null}
    {kind === 'audit' && audit.data && audit.data.data.length > 0 ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Data</th><th>Ação</th><th>Recurso</th><th>Usuário</th><th>Request</th></tr></thead><tbody>{audit.data.data.map((item) => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleString('pt-BR')}</td><td>{item.action}</td><td>{item.entityType ?? '-'}<br /><small>{item.entityId ?? '-'}</small></td><td>{item.actor}<br /><small>{item.actorEmail ?? ''}</small></td><td>{item.requestId ?? '-'}</td></tr>)}</tbody></table></div> : null}
  </section>;
}
