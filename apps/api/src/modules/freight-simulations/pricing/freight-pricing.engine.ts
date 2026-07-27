import { Injectable } from '@nestjs/common';
import { FreightChargeType, FreightPriceComponentType, Prisma } from '@prisma/client';

export interface PackageInput {
  heightCm: Prisma.Decimal.Value;
  lengthCm: Prisma.Decimal.Value;
  quantity: number;
  weightKg: Prisma.Decimal.Value;
  widthCm: Prisma.Decimal.Value;
}

export interface ChargeInput {
  fixedAmount: Prisma.Decimal | null;
  name: string;
  percentage: Prisma.Decimal | null;
  type: FreightChargeType;
}

export interface RateInput {
  basePrice: Prisma.Decimal;
  deadlineDays: number;
  excessPricePerKg: Prisma.Decimal | null;
  maxWeightKg: Prisma.Decimal;
  minWeightKg: Prisma.Decimal;
  pricePerKg: Prisma.Decimal;
}

export interface FreightCalculationInput {
  cargoValue: Prisma.Decimal.Value;
  charges: ChargeInput[];
  cubicFactor: Prisma.Decimal.Value;
  desiredShipDate: Date;
  distanceKm?: Prisma.Decimal.Value | null;
  minimumValue: Prisma.Decimal.Value;
  packages: PackageInput[];
  rate: RateInput;
}

export interface PriceComponent {
  amount: Prisma.Decimal;
  label: string;
  sortOrder: number;
  type: FreightPriceComponentType;
}

export interface FreightCalculationResult {
  chargeableWeightKg: Prisma.Decimal;
  components: PriceComponent[];
  cubicWeightKg: Prisma.Decimal;
  deadlineDays: number;
  estimatedDeliveryAt: Date;
  realWeightKg: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  totalVolumeM3: Prisma.Decimal;
}

@Injectable()
export class FreightPricingEngine {
  calculate(input: FreightCalculationInput): FreightCalculationResult {
    const metrics = calculatePackageMetrics(input.packages, input.cubicFactor);
    const cargoValue = decimal(input.cargoValue);
    const minimumValue = money(input.minimumValue);
    const chargeableWeightKg = maxDecimal(metrics.realWeightKg, metrics.cubicWeightKg);
    const components: PriceComponent[] = [];

    const base = money(input.rate.basePrice);
    components.push(component(FreightPriceComponentType.BASE, 'Frete base', base, 10));

    const extraWeight = Prisma.Decimal.max(chargeableWeightKg.minus(input.rate.minWeightKg), 0);
    if (extraWeight.gt(0)) {
      components.push(
        component(FreightPriceComponentType.WEIGHT, 'Peso cobrado', money(extraWeight.mul(input.rate.pricePerKg)), 20),
      );
    }

    let subtotal = sumComponents(components);
    if (subtotal.lt(minimumValue)) {
      components.push(
        component(FreightPriceComponentType.MINIMUM_ADJUSTMENT, 'Ajuste ao valor minimo', minimumValue.minus(subtotal), 30),
      );
      subtotal = minimumValue;
    }

    for (const charge of input.charges) {
      const amount = calculateChargeAmount(charge, cargoValue, subtotal);
      if (amount.equals(0)) continue;
      components.push(component(toComponentType(charge.type), charge.name, amount, componentSort(charge.type)));
    }

    const total = sumComponents(components);
    components.push(component(FreightPriceComponentType.TOTAL, 'Total', total, 999));

    return {
      chargeableWeightKg: scale(chargeableWeightKg, 3),
      components,
      cubicWeightKg: scale(metrics.cubicWeightKg, 3),
      deadlineDays: input.rate.deadlineDays,
      estimatedDeliveryAt: addDays(input.desiredShipDate, input.rate.deadlineDays),
      realWeightKg: scale(metrics.realWeightKg, 3),
      totalPrice: total,
      totalVolumeM3: scale(metrics.totalVolumeM3, 6),
    };
  }
}

export function calculatePackageMetrics(packages: PackageInput[], cubicFactor: Prisma.Decimal.Value): {
  cubicWeightKg: Prisma.Decimal;
  realWeightKg: Prisma.Decimal;
  totalVolumeM3: Prisma.Decimal;
} {
  const factor = decimal(cubicFactor);
  let realWeightKg = decimal(0);
  let totalVolumeM3 = decimal(0);

  for (const item of packages) {
    const quantity = decimal(item.quantity);
    const volumeM3 = decimal(item.lengthCm).div(100).mul(decimal(item.widthCm).div(100)).mul(decimal(item.heightCm).div(100)).mul(quantity);
    totalVolumeM3 = totalVolumeM3.add(volumeM3);
    realWeightKg = realWeightKg.add(decimal(item.weightKg).mul(quantity));
  }

  return {
    cubicWeightKg: scale(totalVolumeM3.mul(factor), 3),
    realWeightKg: scale(realWeightKg, 3),
    totalVolumeM3: scale(totalVolumeM3, 6),
  };
}

function calculateChargeAmount(charge: ChargeInput, cargoValue: Prisma.Decimal, subtotal: Prisma.Decimal): Prisma.Decimal {
  const fixed = charge.fixedAmount ?? decimal(0);
  const percentage = charge.percentage ?? decimal(0);
  const basis = charge.type === FreightChargeType.AD_VALOREM || charge.type === FreightChargeType.INSURANCE ? cargoValue : subtotal;
  const percentageAmount = basis.mul(percentage);
  const amount = money(fixed.add(percentageAmount));
  return charge.type === FreightChargeType.DISCOUNT ? amount.negated() : amount;
}

function component(type: FreightPriceComponentType, label: string, amount: Prisma.Decimal.Value, sortOrder: number): PriceComponent {
  return {
    amount: money(amount),
    label,
    sortOrder,
    type,
  };
}

function componentSort(type: FreightChargeType): number {
  const order: Record<FreightChargeType, number> = {
    [FreightChargeType.FIXED]: 40,
    [FreightChargeType.AD_VALOREM]: 50,
    [FreightChargeType.GRIS]: 60,
    [FreightChargeType.TOLL]: 70,
    [FreightChargeType.INSURANCE]: 80,
    [FreightChargeType.ADDITION]: 90,
    [FreightChargeType.DISCOUNT]: 100,
  };
  return order[type];
}

function toComponentType(type: FreightChargeType): FreightPriceComponentType {
  const map: Record<FreightChargeType, FreightPriceComponentType> = {
    [FreightChargeType.FIXED]: FreightPriceComponentType.FIXED,
    [FreightChargeType.AD_VALOREM]: FreightPriceComponentType.AD_VALOREM,
    [FreightChargeType.GRIS]: FreightPriceComponentType.GRIS,
    [FreightChargeType.TOLL]: FreightPriceComponentType.TOLL,
    [FreightChargeType.INSURANCE]: FreightPriceComponentType.INSURANCE,
    [FreightChargeType.ADDITION]: FreightPriceComponentType.ADDITION,
    [FreightChargeType.DISCOUNT]: FreightPriceComponentType.DISCOUNT,
  };
  return map[type];
}

function sumComponents(components: PriceComponent[]): Prisma.Decimal {
  return money(components.reduce((total, item) => total.add(item.amount), decimal(0)));
}

function maxDecimal(left: Prisma.Decimal, right: Prisma.Decimal): Prisma.Decimal {
  return left.greaterThan(right) ? left : right;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function decimal(value: Prisma.Decimal.Value): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function money(value: Prisma.Decimal.Value): Prisma.Decimal {
  return scale(value, 2);
}

export function scale(value: Prisma.Decimal.Value, decimals: number): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(decimals, Prisma.Decimal.ROUND_HALF_UP);
}
