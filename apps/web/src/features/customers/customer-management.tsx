'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle2, Plus, RefreshCw } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';

import styles from './customer-management.module.css';

import { EmptyState } from '@/components/feedback/empty-state';
import {
  createCustomer,
  customerQueryKeys,
  getCustomers,
  updateCustomerStatus,
} from '@/services/customers-service';
import { ApiClientError } from '@/services/http-client';

interface CustomerFormState {
  document: string;
  email: string;
  name: string;
  phone: string;
}

const initialFormState: CustomerFormState = {
  document: '',
  email: '',
  name: '',
  phone: '',
};

export function CustomerManagement() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CustomerFormState>(initialFormState);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const customers = useQuery({
    queryKey: customerQueryKeys.list,
    queryFn: getCustomers,
    retry: false,
  });
  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async () => {
      setForm(initialFormState);
      setSuccessMessage('Cliente cadastrado.');
      await queryClient.invalidateQueries({ queryKey: customerQueryKeys.list });
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ active, customerId }: { active: boolean; customerId: string }) =>
      updateCustomerStatus(customerId, active),
    onSuccess: async () => {
      setSuccessMessage('Status do cliente atualizado.');
      await queryClient.invalidateQueries({ queryKey: customerQueryKeys.list });
    },
  });

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSuccessMessage(null);
    createMutation.mutate({
      document: form.document || null,
      email: form.email || null,
      name: form.name,
      phone: form.phone || null,
    });
  }

  const errorMessage = messageFor(createMutation.error ?? statusMutation.error);

  return (
    <div className={styles.layout}>
      <section className={styles.formPanel} aria-labelledby="customer-form-title">
        <div className={styles.panelHeader}>
          <Building2 size={20} aria-hidden="true" />
          <div>
            <h2 id="customer-form-title">Novo cliente</h2>
            <p>Cadastro gravado no banco do tenant autenticado.</p>
          </div>
        </div>
        {successMessage ? (
          <p className={styles.success} role="status">
            <CheckCircle2 size={16} aria-hidden="true" />
            {successMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Nome
            <input
              required
              minLength={2}
              maxLength={160}
              value={form.name}
              onChange={(event) => {
                setForm((current) => ({ ...current, name: event.target.value }));
              }}
            />
          </label>
          <label>
            CPF ou CNPJ
            <input
              inputMode="numeric"
              maxLength={18}
              value={form.document}
              onChange={(event) => {
                setForm((current) => ({ ...current, document: event.target.value }));
              }}
            />
          </label>
          <label>
            E-mail
            <input
              type="email"
              maxLength={180}
              value={form.email}
              onChange={(event) => {
                setForm((current) => ({ ...current, email: event.target.value }));
              }}
            />
          </label>
          <label>
            Telefone
            <input
              maxLength={40}
              value={form.phone}
              onChange={(event) => {
                setForm((current) => ({ ...current, phone: event.target.value }));
              }}
            />
          </label>
          <button type="submit" disabled={createMutation.isPending}>
            <Plus size={16} aria-hidden="true" />
            {createMutation.isPending ? 'Salvando' : 'Cadastrar cliente'}
          </button>
        </form>
      </section>

      <section className={styles.listPanel} aria-labelledby="customers-list-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="customers-list-title">Clientes</h2>
            <p>Listagem paginada pelo backend.</p>
          </div>
          <button type="button" onClick={() => void customers.refetch()} disabled={customers.isFetching}>
            <RefreshCw size={16} aria-hidden="true" />
            Atualizar
          </button>
        </div>

        {customers.isPending ? <p className={styles.muted}>Carregando clientes...</p> : null}

        {customers.error ? (
          <div className={styles.errorBlock} role="alert">
            <strong>Nao foi possivel carregar clientes</strong>
            <button type="button" onClick={() => void customers.refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {customers.data?.data.length === 0 ? (
          <EmptyState title="Nenhum cliente cadastrado" description="Use o formulario para adicionar o primeiro cliente deste tenant." />
        ) : null}

        {customers.data && customers.data.data.length > 0 ? (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Documento</th>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {customers.data.data.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.document ?? 'Nao informado'}</td>
                    <td>{customer.email ?? 'Nao informado'}</td>
                    <td>{customer.active ? 'Ativo' : 'Inativo'}</td>
                    <td>
                      <button
                        type="button"
                        disabled={statusMutation.isPending}
                        onClick={() => {
                          setSuccessMessage(null);
                          statusMutation.mutate({ active: !customer.active, customerId: customer.id });
                        }}
                      >
                        {customer.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function messageFor(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiClientError) return error.response.message;
  return 'Nao foi possivel concluir a operacao.';
}
