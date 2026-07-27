'use client';

import type { AddressDto, FreightPackageInputDto, FreightSimulationDto } from '@logistics/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MapPin, PackagePlus, RefreshCw, Route, Send, ShipWheel } from 'lucide-react';
import { useMemo, useState, type SyntheticEvent } from 'react';

import styles from './freight-simulation-workspace.module.css';

import { EmptyState } from '@/components/feedback/empty-state';
import { customerQueryKeys, getCustomers } from '@/services/customers-service';
import {
  createFreightSimulation,
  createShipmentFromSimulation,
  freightQueryKeys,
  getBranches,
  getCarriers,
  lookupAddress,
  selectFreightOption,
} from '@/services/freight-service';
import { ApiClientError } from '@/services/http-client';

const blankAddress: AddressDto = {
  city: '',
  complement: null,
  country: 'BR',
  district: null,
  number: null,
  postalCode: '',
  state: '',
  street: '',
};

const initialPackage: FreightPackageInputDto = {
  description: 'Volume',
  heightCm: 45,
  lengthCm: 80,
  quantity: 1,
  weightKg: 42.5,
  widthCm: 60,
};

export function FreightSimulationWorkspace() {
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [cargoValue, setCargoValue] = useState('2500');
  const [origin, setOrigin] = useState<AddressDto>({ ...blankAddress, postalCode: '01001000' });
  const [destination, setDestination] = useState<AddressDto>({ ...blankAddress, postalCode: '20040002' });
  const [packages, setPackages] = useState<FreightPackageInputDto[]>([initialPackage]);
  const [simulation, setSimulation] = useState<FreightSimulationDto | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const customers = useQuery({ queryKey: customerQueryKeys.list, queryFn: getCustomers, retry: false });
  const branches = useQuery({ queryKey: freightQueryKeys.branches, queryFn: getBranches, retry: false });
  const carriers = useQuery({ queryKey: freightQueryKeys.carriers, queryFn: getCarriers, retry: false });

  const originLookup = useMutation({ mutationFn: lookupAddress, onSuccess: setOrigin });
  const destinationLookup = useMutation({ mutationFn: lookupAddress, onSuccess: setDestination });
  const createMutation = useMutation({
    mutationFn: createFreightSimulation,
    onSuccess: async (result) => {
      setSimulation(result);
      setSuccessMessage('Simulação calculada e salva no histórico.');
      await queryClient.invalidateQueries({ queryKey: freightQueryKeys.historyRoot });
    },
  });
  const selectMutation = useMutation({
    mutationFn: ({ optionId, simulationId }: { optionId: string; simulationId: string }) =>
      selectFreightOption(simulationId, optionId),
    onSuccess: (result) => {
      setSimulation(result);
      setSuccessMessage('Opção selecionada.');
    },
  });
  const shipmentMutation = useMutation({
    mutationFn: createShipmentFromSimulation,
    onSuccess: (shipment) => {
      setSuccessMessage(`Shipment criada: ${shipment.trackingCode}`);
    },
  });

  const operationalDataReady = (branches.data?.data.length ?? 0) > 0 && carriersWithServices(carriers.data?.data ?? []).length > 0;
  const errorMessage = messageFor(createMutation.error ?? selectMutation.error ?? shipmentMutation.error ?? originLookup.error ?? destinationLookup.error);

  const packageMetrics = useMemo(() => {
    const realWeight = packages.reduce((total, item) => total + item.weightKg * item.quantity, 0);
    const volume = packages.reduce(
      (total, item) => total + (item.lengthCm / 100) * (item.widthCm / 100) * (item.heightCm / 100) * item.quantity,
      0,
    );
    return { realWeight, volume };
  }, [packages]);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSuccessMessage(null);
    createMutation.mutate({
      cargoValue: Number(cargoValue),
      customerId: customerId || null,
      destination,
      origin,
      packages,
    });
  }

  return (
    <div className={styles.layout}>
      <section className={styles.panel} aria-labelledby="simulation-form-title">
        <div className={styles.panelHeader}>
          <div>
            <p>Fluxo operacional</p>
            <h2 id="simulation-form-title">Nova simulação</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              void Promise.all([customers.refetch(), branches.refetch(), carriers.refetch()]);
            }}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Atualizar dados
          </button>
        </div>

        {!operationalDataReady && !branches.isPending && !carriers.isPending ? (
          <EmptyState
            title="Cadastros logísticos incompletos"
            description="Execute migrations e seed para criar filiais, transportadoras, serviços, cobertura e tabelas de frete."
          />
        ) : null}

        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className={styles.success} role="status">
            <CheckCircle2 size={16} aria-hidden="true" />
            {successMessage}
          </p>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Cliente
            <select
              value={customerId}
              onChange={(event) => {
                setCustomerId(event.target.value);
              }}
            >
              <option value="">Cliente opcional</option>
              {customers.data?.data.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Valor da carga
            <input
              inputMode="decimal"
              value={cargoValue}
              onChange={(event) => {
                setCargoValue(event.target.value);
              }}
              required
            />
          </label>

          <AddressFields
            title="Origem"
            address={origin}
            pending={originLookup.isPending}
            onLookup={() => {
              originLookup.mutate(origin.postalCode);
            }}
            onChange={setOrigin}
          />
          <AddressFields
            title="Destino"
            address={destination}
            pending={destinationLookup.isPending}
            onLookup={() => {
              destinationLookup.mutate(destination.postalCode);
            }}
            onChange={setDestination}
          />

          <div className={styles.packageHeader}>
            <h3>Volumes</h3>
            <button
              type="button"
              onClick={() => {
                setPackages((current) => [
                  ...current,
                  { ...initialPackage, description: `Volume ${String(current.length + 1)}` },
                ]);
              }}
            >
              <PackagePlus size={16} aria-hidden="true" />
              Adicionar
            </button>
          </div>
          {packages.map((item, index) => (
            <div className={styles.packageGrid} key={index}>
              <label>
                <span className={styles.labelHelp} title="Quantidade de volumes iguais nesta linha. Multiplica peso e dimensoes no calculo total.">Quantidade</span>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => {
                    updatePackage(setPackages, index, { quantity: Number(event.target.value) });
                  }}
                />
              </label>
              <label>
                <span className={styles.labelHelp} title="Peso real de cada volume em quilogramas. Usado junto com a cubagem para definir o peso cobrado.">Peso (kg)</span>
                <input
                  type="number"
                  min={0.001}
                  step="0.001"
                  value={item.weightKg}
                  onChange={(event) => {
                    updatePackage(setPackages, index, { weightKg: Number(event.target.value) });
                  }}
                />
              </label>
              <label>
                <span className={styles.labelHelp} title="Comprimento do volume em centimetros. Entra no calculo de cubagem do frete.">Comprimento (cm)</span>
                <input
                  type="number"
                  min={1}
                  value={item.lengthCm}
                  onChange={(event) => {
                    updatePackage(setPackages, index, { lengthCm: Number(event.target.value) });
                  }}
                />
              </label>
              <label>
                <span className={styles.labelHelp} title="Largura do volume em centimetros. Entra no calculo de cubagem do frete.">Largura (cm)</span>
                <input
                  type="number"
                  min={1}
                  value={item.widthCm}
                  onChange={(event) => {
                    updatePackage(setPackages, index, { widthCm: Number(event.target.value) });
                  }}
                />
              </label>
              <label>
                <span className={styles.labelHelp} title="Altura do volume em centimetros. Entra no calculo de cubagem do frete.">Altura (cm)</span>
                <input
                  type="number"
                  min={1}
                  value={item.heightCm}
                  onChange={(event) => {
                    updatePackage(setPackages, index, { heightCm: Number(event.target.value) });
                  }}
                />
              </label>
            </div>
          ))}

          <div className={styles.metrics} aria-label="Resumo dos volumes">
            <span>Peso real: {formatNumber(packageMetrics.realWeight)} kg</span>
            <span>Volume: {formatNumber(packageMetrics.volume)} m3</span>
          </div>

          <button className={styles.primary} type="submit" disabled={createMutation.isPending || !operationalDataReady}>
            <Send size={16} aria-hidden="true" />
            {createMutation.isPending ? 'Calculando' : 'Calcular frete'}
          </button>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="simulation-results-title">
        <div className={styles.panelHeader}>
          <div>
            <p>Comparação persistida</p>
            <h2 id="simulation-results-title">Opções calculadas</h2>
          </div>
          <Route size={20} aria-hidden="true" />
        </div>

        {!simulation ? <EmptyState title="Nenhuma simulação nesta sessão" description="Preencha os dados e calcule para comparar transportadoras." /> : null}

        {simulation ? (
          <div className={styles.results}>
            <div className={styles.metrics}>
              <span>Distância: {simulation.distanceKm ? `${formatNumber(simulation.distanceKm)} km` : 'não informada'}</span>
              <span>
                Peso cobrável: {simulation.chargeableWeightKg ? `${formatNumber(simulation.chargeableWeightKg)} kg` : '-'}
              </span>
              <span>Opções: {simulation.options.length}</span>
            </div>
            {simulation.options.map((option) => (
              <article className={styles.option} key={option.id}>
                <div>
                  <strong>{option.carrierName}</strong>
                  <span>{option.serviceName}</span>
                </div>
                <div className={styles.price}>{formatMoney(option.totalPrice)}</div>
                <div className={styles.badges}>
                  {option.cheapest ? <span>Menor preço</span> : null}
                  {option.fastest ? <span>Mais rápida</span> : null}
                  {option.selected ? <span>Selecionada</span> : null}
                </div>
                <dl className={styles.breakdown}>
                  {option.components.map((component) => (
                    <div key={`${option.id}-${String(component.sortOrder)}-${component.type}`}>
                      <dt>{component.label}</dt>
                      <dd>{formatMoney(component.amount)}</dd>
                    </div>
                  ))}
                </dl>
                <div className={styles.actions}>
                  <button
                    type="button"
                    disabled={selectMutation.isPending || option.selected}
                    onClick={() => {
                      selectMutation.mutate({ optionId: option.id, simulationId: simulation.id });
                    }}
                  >
                    Selecionar
                  </button>
                  {option.selected ? (
                    <button
                      type="button"
                      disabled={shipmentMutation.isPending}
                      onClick={() => {
                        shipmentMutation.mutate(simulation.id);
                      }}
                    >
                      <ShipWheel size={16} aria-hidden="true" />
                      Gerar Shipment
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function AddressFields({
  address,
  onChange,
  onLookup,
  pending,
  title,
}: {
  address: AddressDto;
  onChange: (address: AddressDto) => void;
  onLookup: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <fieldset className={styles.address}>
      <legend>
        <MapPin size={16} aria-hidden="true" />
        {title}
      </legend>
      <label>
        CEP
        <span className={styles.lookupLine}>
          <input
            value={address.postalCode}
            onChange={(event) => {
              onChange({ ...address, postalCode: event.target.value });
            }}
            required
          />
          <button type="button" onClick={onLookup} disabled={pending || address.postalCode.replace(/\D/g, '').length !== 8}>
            {pending ? 'Buscando' : 'Buscar'}
          </button>
        </span>
      </label>
      <label>
        Logradouro
        <input
          value={address.street}
          onChange={(event) => {
            onChange({ ...address, street: event.target.value });
          }}
          required
        />
      </label>
      <label>
        Cidade
        <input
          value={address.city}
          onChange={(event) => {
            onChange({ ...address, city: event.target.value });
          }}
          required
        />
      </label>
      <label>
        UF
        <input
          maxLength={2}
          value={address.state}
          onChange={(event) => {
            onChange({ ...address, state: event.target.value.toUpperCase() });
          }}
          required
        />
      </label>
    </fieldset>
  );
}

function updatePackage(
  setPackages: (updater: (current: FreightPackageInputDto[]) => FreightPackageInputDto[]) => void,
  index: number,
  patch: Partial<FreightPackageInputDto>,
): void {
  setPackages((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
}

function carriersWithServices(carriers: { services?: unknown[] }[]): { services?: unknown[] }[] {
  return carriers.filter((carrier) => (carrier.services?.length ?? 0) > 0);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(value);
}

function messageFor(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiClientError) return error.response.message;
  return 'Não foi possível concluir a operação.';
}
