import { ShipmentStatus } from '@logistics/shared';

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  ARRIVED_AT_HUB: 'No centro de distribuicao',
  CANCELED: 'Cancelado',
  CREATED: 'Criado',
  DELIVERED: 'Entregue',
  DELIVERY_FAILED: 'Falha na entrega',
  IN_TRANSIT: 'Em transito',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  PICKED_UP: 'Coletado',
  PICKUP_SCHEDULED: 'Coleta agendada',
  RETURNED: 'Devolvido',
  RETURNING: 'Em devolucao',
};

export function formatShipmentStatus(status: string | null | undefined): string {
  if (!status) return 'Sem status';
  return shipmentStatusLabels[status as ShipmentStatus] ?? status;
}
