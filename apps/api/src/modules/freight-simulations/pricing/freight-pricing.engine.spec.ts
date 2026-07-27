import { FreightChargeType, Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { FreightPricingEngine } from './freight-pricing.engine';

describe('FreightPricingEngine', () => {
  it('calculates volume, cubic weight, chargeable weight and deterministic breakdown', () => {
    const engine = new FreightPricingEngine();

    const result = engine.calculate({
      cargoValue: '2500.00',
      charges: [
        { fixedAmount: null, name: 'Ad valorem', percentage: decimal('0.004'), type: FreightChargeType.AD_VALOREM },
        { fixedAmount: decimal('18.00'), name: 'Pedagio', percentage: null, type: FreightChargeType.TOLL },
      ],
      cubicFactor: '300.000',
      desiredShipDate: new Date('2026-07-25T12:00:00.000Z'),
      minimumValue: '95.00',
      packages: [{ heightCm: 45, lengthCm: 80, quantity: 1, weightKg: 42.5, widthCm: 60 }],
      rate: {
        basePrice: decimal('85.00'),
        deadlineDays: 2,
        excessPricePerKg: null,
        maxWeightKg: decimal('300.000'),
        minWeightKg: decimal('1.000'),
        pricePerKg: decimal('2.4000'),
      },
    });

    expect(result.realWeightKg.toNumber()).toBe(42.5);
    expect(result.totalVolumeM3.toNumber()).toBe(0.216);
    expect(result.cubicWeightKg.toNumber()).toBe(64.8);
    expect(result.chargeableWeightKg.toNumber()).toBe(64.8);
    expect(result.totalPrice.toNumber()).toBe(266.12);
    expect(result.components.at(-1)).toMatchObject({ label: 'Total' });
  });
});

function decimal(value: string) {
  return new Prisma.Decimal(value);
}
