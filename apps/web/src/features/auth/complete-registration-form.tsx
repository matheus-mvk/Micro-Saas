'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import styles from './identity.module.css';

import { Button } from '@/components/ui/button';
import { completeOAuthRegistration, listTenantOptions } from '@/services/auth-service';

export function CompleteRegistrationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [search, setSearch] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const tenants = useQuery({ queryKey: ['auth', 'tenant-options', search], queryFn: () => listTenantOptions(search), retry: false });
  const mutation = useMutation({
    mutationFn: completeOAuthRegistration,
  });

  if (!token) {
    return <p className={styles.error} role="alert">Token de cadastro OAuth ausente ou inválido.</p>;
  }

  if (mutation.data?.pendingApproval) {
    return (
      <div className={styles.stack}>
        <p className={styles.success} role="status">Cadastro enviado. Aguardando aprovação do Administrador.</p>
        <Link href="/login">Voltar ao login</Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={(event) => { event.preventDefault(); mutation.mutate({ tenantSlug, token }); }}>
      <label className={styles.field}>
        Buscar empresa
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou slug da empresa" />
      </label>
      <label className={styles.field}>
        Empresa
        <select required value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)}>
          <option value="">Selecione</option>
          {tenants.data?.map((tenant) => <option key={tenant.id} value={tenant.slug}>{tenant.name}</option>)}
        </select>
      </label>
      {tenants.isPending ? <p>Carregando empresas...</p> : null}
      {tenants.isError ? <p className={styles.error}>Não foi possível carregar empresas.</p> : null}
      {mutation.error ? <p className={styles.error} role="alert">Não foi possível concluir o cadastro.</p> : null}
      <Button type="submit" disabled={!tenantSlug || mutation.isPending}>{mutation.isPending ? 'Enviando' : 'Enviar para aprovação'}</Button>
    </form>
  );
}
