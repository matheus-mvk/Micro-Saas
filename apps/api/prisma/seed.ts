import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

import {
  AddressType,
  AuditAction,
  CarrierServiceStatus,
  CoverageStatus,
  FreightChargeType,
  FreightPriceComponentType,
  FreightRateTableStatus,
  FreightSimulationStatus,
  ImportRowStatus,
  ImportStatus,
  ImportType,
  InsightCategory,
  InsightSeverity,
  InsightStatus,
  OAuthProvider,
  Prisma,
  PrismaClient,
  ShipmentStatus,
  TrackingEventType,
  UserInvitationStatus,
  UserRole,
  UserStatus,
  type Branch,
  type Carrier,
  type CarrierCoverage,
  type CarrierService,
  type Customer,
  type FreightRateRange,
  type FreightRateTable,
  type FreightSimulation,
  type User,
} from '@prisma/client';

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

const DEMO_PASSWORD = '@DEV1512';
const DEMO_SLUGS = ['alpha-logistics', 'beta-transportes', 'demo-logistics', 'satellite-logistics'];

interface BranchSeed {
  city: string;
  code: string;
  district: string;
  email: string;
  main?: boolean;
  name: string;
  number: string;
  phone: string;
  postalCode: string;
  state: string;
  street: string;
}

interface CustomerSeed {
  city: string;
  contact: string;
  district: string;
  email: string;
  name: string;
  number: string;
  phone: string;
  postalCode: string;
  state: string;
  street: string;
}

interface CarrierSeed {
  code: string;
  contact: string;
  email: string;
  name: string;
  phone: string;
  site: string;
}

interface ServiceSeed {
  code: string;
  deadline: number;
  modality: string;
  name: string;
  priceLevel: number;
}

interface DemoTenantData {
  documentBase: string;
  slug: string;
  name: string;
  users: Array<{ email: string; name: string; role: UserRole; status?: UserStatus; branchIndex?: number; mfaEnabled?: boolean }>;
  branches: BranchSeed[];
  customers: CustomerSeed[];
  carriers: CarrierSeed[];
  routePairs: Array<{ origin: number; destination: number }>;
}

type SeedCarrierService = CarrierService & { carrier: Carrier; seed: ServiceSeed };
type SeedSimulation = {
  branch: Branch;
  chargeableWeight: number;
  customer: Customer;
  destination: BranchSeed;
  distance: number;
  index: number;
  origin: BranchSeed;
  realWeight: number;
  simulation: FreightSimulation;
  volume: number;
};

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Refusing to run demo seed in production without ALLOW_DEMO_SEED=true.');
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await removeDemoTenants();

  await seedTenant(alphaTenant(), passwordHash, 0);
  await seedTenant(betaTenant(), passwordHash, 1);

  await prisma.$disconnect();
}

async function removeDemoTenants(): Promise<void> {
  const tenants = await prisma.tenant.findMany({ where: { slug: { in: DEMO_SLUGS } }, select: { id: true } });
  const tenantIds = tenants.map((tenant) => tenant.id);
  if (tenantIds.length === 0) return;

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.insight.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.importRowResult.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.importJob.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.trackingEvent.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.shipmentPackage.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.shipmentAddress.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.shipment.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.freightSimulationPriceComponent.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.freightSimulationOption.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.freightSimulationPackage.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.freightSimulationAddress.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.freightSimulation.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.freightAdditionalCharge.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.freightRateTableCoverage.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.freightRateRange.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.freightRateTable.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.carrierCoverage.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.carrierService.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.carrier.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.customerAddress.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.customer.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.refreshToken.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.oAuthAccount.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.oAuthState.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.mfaRecoveryCode.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.mfaChallenge.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.passwordResetToken.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.userInvitation.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.user.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.tenantOnboarding.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.tenantSettings.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.branch.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await tx.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  });
}

async function seedTenant(data: DemoTenantData, passwordHash: string, tenantOffset: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        active: true,
        document: cnpj(data.documentBase),
        name: data.name,
        slug: data.slug,
      },
    });

    await tx.tenantSettings.create({
      data: {
        country: 'BR',
        currency: 'BRL',
        onboardingCompleted: true,
        tenantId: tenant.id,
        timezone: 'America/Sao_Paulo',
      },
    });
    await tx.tenantOnboarding.create({
      data: {
        branchDone: true,
        companyDone: true,
        completed: true,
        currentStep: 'done',
        inviteDone: true,
        tenantId: tenant.id,
      },
    });

    const branches: Branch[] = [];
    for (const [index, branch] of data.branches.entries()) {
      branches.push(
        await tx.branch.create({
          data: {
            active: true,
            city: branch.city,
            code: branch.code,
            contactName: `Coordenação ${branch.city}`,
            country: 'BR',
            district: branch.district,
            email: branch.email,
            main: Boolean(branch.main),
            name: branch.name,
            notes: branch.main ? 'Matriz operacional e fiscal do tenant de demonstração.' : 'Filial operacional para coleta e cross-docking.',
            number: branch.number,
            phone: branch.phone,
            postalCode: branch.postalCode,
            state: branch.state,
            street: branch.street,
            tenantId: tenant.id,
          },
        }),
      );
    }

    const users: User[] = [];
    for (const [index, user] of data.users.entries()) {
      const branch = at(branches, user.branchIndex ?? index % branches.length, 'branch for user');
      users.push(
        await tx.user.create({
          data: {
            branchId: branch.id,
            email: user.email,
            lastLoginAt: user.status === UserStatus.DISABLED ? null : daysAgo(tenantOffset * 2 + index + 1),
            mfaEnabled: Boolean(user.mfaEnabled),
            mfaSecret: user.mfaEnabled ? `demo-secret-${data.slug}-${index}` : null,
            name: user.name,
            passwordHash,
            role: user.role,
            status: user.status ?? UserStatus.ACTIVE,
            tenantId: tenant.id,
          },
        }),
      );
    }
    const admin = at(users, 0, 'admin user');
    const manager = at(users, 1, 'manager user');

    await tx.oAuthAccount.create({
      data: {
        email: admin.email,
        provider: OAuthProvider.GOOGLE,
        providerUserId: `${data.slug}-google-admin`,
        tenantId: tenant.id,
        userId: admin.id,
      },
    });
    await tx.oAuthAccount.create({
      data: {
        email: manager.email,
        provider: OAuthProvider.GITHUB,
        providerUserId: `${data.slug}-github-supervisor`,
        tenantId: tenant.id,
        userId: manager.id,
      },
    });
    await tx.refreshToken.createMany({
      data: users.slice(0, 3).map((user, index) => ({
        expiresAt: daysFromNow(30 - index),
        familyId: uuid(tenantOffset, 70, index),
        ipHash: `ip-hash-${data.slug}-${index}`,
        tenantId: tenant.id,
        tokenHash: `refresh-hash-${data.slug}-${index}`,
        userAgent: index === 0 ? 'Chrome Windows Homologação' : 'Edge Windows Homologação',
        userId: user.id,
      })),
    });

    await tx.userInvitation.createMany({
      data: [
        {
          email: `planejamento@${data.slug}.dev`,
          expiresAt: daysFromNow(6),
          invitedById: admin.id,
          role: UserRole.MANAGER,
          status: UserInvitationStatus.PENDING,
          tenantId: tenant.id,
          tokenHash: `invite-${data.slug}-pending`,
        },
        {
          acceptedAt: daysAgo(12),
          acceptedById: at(users, 3, 'accepted invitation user').id,
          email: at(users, 3, 'accepted invitation user').email,
          expiresAt: daysFromNow(20),
          invitedById: admin.id,
          role: at(users, 3, 'accepted invitation user').role,
          status: UserInvitationStatus.ACCEPTED,
          tenantId: tenant.id,
          tokenHash: `invite-${data.slug}-accepted`,
        },
      ],
    });

    const customers: Customer[] = [];
    for (const [index, customer] of data.customers.entries()) {
      const created = await tx.customer.create({
        data: {
          active: index !== 5,
          document: cnpj(`${data.documentBase.slice(0, 8)}${String(index + 11).padStart(4, '0')}`),
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          tenantId: tenant.id,
        },
      });
      customers.push(created);
      await tx.customerAddress.create({
        data: {
          active: true,
          city: customer.city,
          country: 'BR',
          customerId: created.id,
          delivery: true,
          district: customer.district,
          label: `Entrega ${customer.city}`,
          latitude: decimal(-23.55 + index + tenantOffset / 10, 7),
          longitude: decimal(-46.63 + index / 2, 7),
          main: true,
          number: customer.number,
          pickup: index % 2 === 0,
          postalCode: customer.postalCode,
          state: customer.state,
          street: customer.street,
          tenantId: tenant.id,
          type: index % 2 === 0 ? AddressType.DELIVERY : AddressType.MAIN,
        },
      });
    }

    const carriers: Carrier[] = [];
    const services: SeedCarrierService[] = [];
    const coverages: CarrierCoverage[] = [];
    const tables: FreightRateTable[] = [];
    const currentTablesByService = new Map<string, { id: string; version: number }>();
    const rangesByTable = new Map<string, string[]>();
    for (const [carrierIndex, carrier] of data.carriers.entries()) {
      const createdCarrier = await tx.carrier.create({
        data: {
          active: carrierIndex !== 4,
          code: carrier.code,
          contactName: carrier.contact,
          document: cnpj(`${data.documentBase.slice(0, 7)}${String(30000 + carrierIndex).padStart(5, '0')}`),
          email: carrier.email,
          legalName: `${carrier.name} Ltda.`,
          name: carrier.name,
          notes: carrierIndex === 4 ? 'Parceiro mantido para consulta histórica; inativo para novas simulações.' : 'Parceiro operacional homologado.',
          phone: carrier.phone,
          site: carrier.site,
          stateRegistration: `ISENTO-${carrier.code}`,
          tenantId: tenant.id,
        },
      });
      carriers.push(createdCarrier);

      for (const [serviceIndex, serviceSeed] of serviceCatalog(carrier.code).entries()) {
        const service = await tx.carrierService.create({
          data: {
            carrierId: createdCarrier.id,
            code: serviceSeed.code,
            cubicFactor: decimal(serviceSeed.modality === 'aereo' ? 167 : 300, 3),
            defaultDeadlineDays: serviceSeed.deadline,
            description: `${serviceSeed.name} para rotas interestaduais com SLA controlado.`,
            maxHeightCm: decimal(serviceSeed.modality === 'same-day' ? 120 : 220, 2),
            maxLengthCm: decimal(serviceSeed.modality === 'same-day' ? 160 : 300, 2),
            maxWeightKg: decimal(serviceSeed.modality === 'aereo' ? 180 : 1200, 3),
            maxWidthCm: decimal(serviceSeed.modality === 'same-day' ? 120 : 220, 2),
            minWeightKg: decimal(1, 3),
            minimumValue: decimal(55 + serviceSeed.priceLevel * 18 + carrierIndex * 8, 2),
            modality: serviceSeed.modality,
            name: serviceSeed.name,
            status: carrierIndex === 4 && serviceIndex > 0 ? CarrierServiceStatus.INACTIVE : CarrierServiceStatus.ACTIVE,
            tenantId: tenant.id,
          },
        });
        services.push({ ...service, carrier: createdCarrier, seed: serviceSeed });

        const routeA = at(data.routePairs, (carrierIndex + serviceIndex) % data.routePairs.length, 'coverage route A');
        const routeB = at(data.routePairs, (carrierIndex + serviceIndex + 2) % data.routePairs.length, 'coverage route B');
        for (const [coverageIndex, route] of [routeA, routeB].entries()) {
          const origin = at(data.branches, route.origin, 'coverage origin branch seed');
          const destination = at(data.branches, route.destination, 'coverage destination branch seed');
          coverages.push(
            await tx.carrierCoverage.create({
              data: {
                carrierServiceId: service.id,
                destinationPostalCodeEnd: `${destination.postalCode.slice(0, 5)}999`,
                destinationPostalCodeStart: `${destination.postalCode.slice(0, 5)}000`,
                destinationState: destination.state,
                originPostalCodeEnd: `${origin.postalCode.slice(0, 5)}999`,
                originPostalCodeStart: `${origin.postalCode.slice(0, 5)}000`,
                originState: origin.state,
                status: CoverageStatus.ACTIVE,
                tenantId: tenant.id,
              },
            }),
          );
          void coverageIndex;
        }

        if (data.slug === 'alpha-logistics' && carrierIndex < 3 && serviceIndex < 2) {
          coverages.push(
            await tx.carrierCoverage.create({
              data: {
                carrierServiceId: service.id,
                destinationPostalCodeEnd: '20040999',
                destinationPostalCodeStart: '20040000',
                destinationState: 'RJ',
                originPostalCodeEnd: '01001999',
                originPostalCodeStart: '01001000',
                originState: 'SP',
                status: CoverageStatus.ACTIVE,
                tenantId: tenant.id,
              },
            }),
          );
        }

        const oldTable = await createRateTableWithDetails(tx, tenant.id, service.id, {
          name: `${serviceSeed.name} ${createdCarrier.code} - tabela anterior`,
          priceLevel: serviceSeed.priceLevel + carrierIndex,
          status: FreightRateTableStatus.INACTIVE,
          validFrom: daysAgo(180),
          validTo: daysAgo(91),
          version: 1,
        });
        const currentTable = await createRateTableWithDetails(tx, tenant.id, service.id, {
          name: `${serviceSeed.name} ${createdCarrier.code} - vigente`,
          previousVersionId: oldTable.table.id,
          priceLevel: serviceSeed.priceLevel + carrierIndex + 1,
          status: service.status === CarrierServiceStatus.ACTIVE ? FreightRateTableStatus.ACTIVE : FreightRateTableStatus.INACTIVE,
          validFrom: daysAgo(90),
          validTo: daysFromNow(120),
          version: 2,
        });
        tables.push(oldTable.table, currentTable.table);
        currentTablesByService.set(service.id, { id: currentTable.table.id, version: currentTable.table.version });
        rangesByTable.set(currentTable.table.id, currentTable.ranges.map((range) => range.id));
      }
    }

    for (const table of tables) {
      const matchingCoverage = coverages.find((coverage) => {
        const service = services.find((item) => item.id === coverage.carrierServiceId);
        return service?.id === table.carrierServiceId;
      });
      if (matchingCoverage) {
        await tx.freightRateTableCoverage.create({
          data: {
            coverageId: matchingCoverage.id,
            rateTableId: table.id,
            tenantId: tenant.id,
          },
        });
      }
    }

    const simulations: SeedSimulation[] = [];
    for (let index = 0; index < 14; index += 1) {
      const route = at(data.routePairs, index % data.routePairs.length, 'simulation route');
      const origin = at(data.branches, route.origin, 'simulation origin branch seed');
      const destination = at(data.branches, route.destination, 'simulation destination branch seed');
      const customer = at(customers, index % customers.length, 'simulation customer');
      const createdBy = at(users, index % users.length, 'simulation creator');
      const branch = at(branches, route.origin, 'simulation branch');
      const weight = 18 + index * 11.75;
      const volume = 0.08 + index * 0.027;
      const cubicWeight = volume * 300;
      const chargeableWeight = Math.max(weight, cubicWeight);
      const distance = 180 + Math.abs(route.destination - route.origin) * 260 + index * 17;
      const status = index === 13 ? FreightSimulationStatus.FAILED : FreightSimulationStatus.CALCULATED;

      const simulation = await tx.freightSimulation.create({
        data: {
          branchId: branch.id,
          cargoValue: decimal(1250 + index * 740, 2),
          chargeableWeightKg: decimal(chargeableWeight, 3),
          createdAt: daysAgo(88 - index * 5),
          createdById: createdBy.status === UserStatus.ACTIVE ? createdBy.id : admin.id,
          cubicWeightKg: decimal(cubicWeight, 3),
          customerId: customer.id,
          desiredShipDate: daysAgo(86 - index * 5),
          destinationPostalCode: destination.postalCode,
          distanceKm: decimal(distance, 2),
          estimatedDeadlineDays: 2 + (index % 5),
          estimatedPrice: status === FreightSimulationStatus.FAILED ? null : decimal(95 + chargeableWeight * 2.8 + index * 6, 2),
          heightCm: decimal(45 + index, 2),
          lengthCm: decimal(80 + index * 2, 2),
          metadata: {
            demo: true,
            unavailable: index % 4 === 0 ? ['Serviço same day indisponível para a rota solicitada.'] : [],
          },
          originPostalCode: origin.postalCode,
          realWeightKg: decimal(weight, 3),
          status,
          tenantId: tenant.id,
          totalVolumeM3: decimal(volume, 6),
          widthCm: decimal(55 + index, 2),
        },
      });
      simulations.push({ branch, chargeableWeight, customer, destination, distance, index, origin, realWeight: weight, simulation, volume });

      await tx.freightSimulationAddress.createMany({
        data: [
          simulationAddress(tenant.id, simulation.id, AddressType.PICKUP, origin),
          simulationAddress(tenant.id, simulation.id, AddressType.DELIVERY, destination),
        ],
      });
      await tx.freightSimulationPackage.create({
        data: {
          description: index % 2 === 0 ? 'Caixas de produtos acabados' : 'Pallet fracionado',
          heightCm: decimal(45 + index, 2),
          lengthCm: decimal(80 + index * 2, 2),
          quantity: 1 + (index % 3),
          simulationId: simulation.id,
          tenantId: tenant.id,
          volumeM3: decimal(volume, 6),
          weightKg: decimal(weight, 3),
          widthCm: decimal(55 + index, 2),
        },
      });

      if (status === FreightSimulationStatus.FAILED) continue;

      const eligibleServices = services
        .filter((service) => service.status === CarrierServiceStatus.ACTIVE)
        .filter((service) => currentTablesByService.has(service.id))
        .slice(index % 4, index % 4 + 3);
      const options = eligibleServices.length >= 2 ? eligibleServices : services.filter((service) => service.status === CarrierServiceStatus.ACTIVE).slice(0, 3);
      const totals = options.map((service, optionIndex) => 70 + chargeableWeight * (1.45 + service.seed.priceLevel / 10) + optionIndex * 22 + index * 4);
      const cheapestIndex = totals.indexOf(Math.min(...totals));
      const fastestIndex = options.reduce((best, service, optionIndex) => {
        const bestService = at(options, best, 'best option service');
        return service.defaultDeadlineDays < bestService.defaultDeadlineDays ? optionIndex : best;
      }, 0);
      const selectedIndex = index % 3 === 0 ? cheapestIndex : index % 3 === 1 ? fastestIndex : 0;

      for (const [optionIndex, service] of options.entries()) {
        const table = currentTablesByService.get(service.id);
        if (!table) continue;
        const rangeId = rangesByTable.get(table.id)?.[optionIndex % 3];
        if (!rangeId) continue;
        const total = at(totals, optionIndex, 'simulation option total');
        const option = await tx.freightSimulationOption.create({
          data: {
            carrierId: service.carrier.id,
            carrierName: service.carrier.name,
            carrierServiceId: service.id,
            chargeableWeightKg: decimal(chargeableWeight, 3),
            cheapest: optionIndex === cheapestIndex,
            cubicWeightKg: decimal(Math.max(chargeableWeight, 0), 3),
            deadlineDays: service.defaultDeadlineDays,
            distanceKm: decimal(distance, 2),
            estimatedDeliveryAt: addDays(simulation.createdAt, service.defaultDeadlineDays),
            fastest: optionIndex === fastestIndex,
            rateRangeId: rangeId,
            rateTableId: table.id,
            rateTableVersion: table.version,
            realWeightKg: decimal(weight, 3),
            selected: optionIndex === selectedIndex,
            selectedAt: optionIndex === selectedIndex ? addHours(simulation.createdAt, 2) : null,
            serviceCode: service.code,
            serviceName: service.name,
            simulationId: simulation.id,
            tenantId: tenant.id,
            totalPrice: decimal(total, 2),
          },
        });
        await createPriceComponents(tx, tenant.id, option.id, total, chargeableWeight, Number(simulation.cargoValue ?? 0));
      }
    }

    const selectedOptions = await tx.freightSimulationOption.findMany({
      where: { selected: true, tenantId: tenant.id },
      include: { simulation: true },
      orderBy: { createdAt: 'asc' },
      take: 9,
    });

    const shipmentStatuses = [
      ShipmentStatus.CREATED,
      ShipmentStatus.PICKED_UP,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
      ShipmentStatus.CANCELED,
      ShipmentStatus.DELIVERY_FAILED,
      ShipmentStatus.RETURNING,
      ShipmentStatus.RETURNED,
    ];

    for (const [index, option] of selectedOptions.entries()) {
      const status = at(shipmentStatuses, index % shipmentStatuses.length, 'shipment status');
      const delivered = status === ShipmentStatus.DELIVERED || status === ShipmentStatus.RETURNED;
      const shipment = await tx.shipment.create({
        data: {
          branchId: option.simulation.branchId,
          cargoValue: option.simulation.cargoValue,
          carrierId: option.carrierId,
          carrierServiceId: option.carrierServiceId,
          chargeableWeightKg: option.chargeableWeightKg,
          createdAt: option.simulation.createdAt,
          createdById: admin.id,
          customerId: option.simulation.customerId,
          deliveredAt: delivered ? addDays(option.simulation.createdAt, option.deadlineDays + (index % 2)) : null,
          estimatedDeliveryAt: option.estimatedDeliveryAt,
          externalReference: `${data.slug.toUpperCase()}-NF-${String(14000 + index).padStart(5, '0')}`,
          freightValue: option.totalPrice,
          realWeightKg: option.realWeightKg,
          selectedOptionId: option.id,
          simulationId: option.simulationId,
          status,
          tenantId: tenant.id,
          trackingCode: `${data.slug === 'alpha-logistics' ? 'ALP' : 'BET'}-${String(index + 1).padStart(6, '0')}`,
        },
      });

      const route = simulations.find((item) => item.simulation.id === option.simulationId);
      const origin = route?.origin ?? at(data.branches, 0, 'fallback shipment origin');
      const destination = route?.destination ?? at(data.branches, 1, 'fallback shipment destination');
      await tx.shipmentAddress.createMany({
        data: [
          shipmentAddress(tenant.id, shipment.id, AddressType.PICKUP, origin),
          shipmentAddress(tenant.id, shipment.id, AddressType.DELIVERY, destination),
        ],
      });
      await tx.shipmentPackage.create({
        data: {
          description: 'Volumes originados da simulação selecionada',
          heightCm: decimal(50 + index, 2),
          lengthCm: decimal(85 + index * 2, 2),
          quantity: 1 + (index % 3),
          shipmentId: shipment.id,
          tenantId: tenant.id,
          volumeM3: decimal(route?.volume ?? 0.1, 6),
          weightKg: option.realWeightKg,
          widthCm: decimal(60 + index, 2),
        },
      });
      await createTrackingTimeline(tx, tenant.id, shipment.id, admin.id, shipment.status, shipment.createdAt, origin.city, destination.city);
    }

    await createImportHistory(tx, tenant.id, admin.id, manager.id, data.slug, customers, carriers);
    await createInsights(tx, tenant.id, data.slug, customers, carriers, branches);
    await createAuditTrail(tx, tenant.id, data.slug, users, customers, carriers);
  });
}

async function createRateTableWithDetails(
  tx: Tx,
  tenantId: string,
  carrierServiceId: string,
  input: {
    name: string;
    previousVersionId?: string;
    priceLevel: number;
    status: FreightRateTableStatus;
    validFrom: Date;
    validTo: Date;
    version: number;
  },
) {
  const table = await tx.freightRateTable.create({
    data: {
      carrierServiceId,
      currency: 'BRL',
      name: input.name,
      notes: input.version === 1 ? 'Versão histórica preservada para auditoria de simulações antigas.' : 'Tabela vigente para homologação de cálculo.',
      previousVersionId: input.previousVersionId,
      status: input.status,
      tenantId,
      validFrom: input.validFrom,
      validTo: input.validTo,
      version: input.version,
    },
  });
  const ranges: FreightRateRange[] = [];
  const rangeInputs = [
    { max: 50, min: 0.001, priority: 1 },
    { max: 200, min: 50.001, priority: 2 },
    { max: 1200, min: 200.001, priority: 3 },
  ];
  for (const range of rangeInputs) {
    ranges.push(
      await tx.freightRateRange.create({
        data: {
          basePrice: decimal(45 + input.priceLevel * 8 + range.priority * 12, 2),
          deadlineDays: Math.max(1, 2 + range.priority + (input.priceLevel % 3)),
          excessPricePerKg: decimal(1.1 + input.priceLevel / 15, 4),
          maxWeightKg: decimal(range.max, 3),
          minWeightKg: decimal(range.min, 3),
          pricePerKg: decimal(1.35 + input.priceLevel / 12 + range.priority / 10, 4),
          priority: range.priority,
          rateTableId: table.id,
          tenantId,
        },
      }),
    );
  }
  await tx.freightAdditionalCharge.createMany({
    data: [
      {
        active: true,
        fixedAmount: decimal(18 + input.priceLevel, 2),
        name: 'Pedágio operacional',
        percentage: null,
        rateTableId: table.id,
        tenantId,
        type: FreightChargeType.TOLL,
      },
      {
        active: true,
        fixedAmount: null,
        name: 'GRIS',
        percentage: decimal(0.0018 + input.priceLevel / 10000, 6),
        rateTableId: table.id,
        tenantId,
        type: FreightChargeType.GRIS,
      },
      {
        active: true,
        fixedAmount: null,
        name: 'Ad valorem',
        percentage: decimal(0.003 + input.priceLevel / 12000, 6),
        rateTableId: table.id,
        tenantId,
        type: FreightChargeType.AD_VALOREM,
      },
      {
        active: true,
        fixedAmount: decimal(9 + input.priceLevel, 2),
        name: 'Seguro mínimo',
        percentage: null,
        rateTableId: table.id,
        tenantId,
        type: FreightChargeType.INSURANCE,
      },
    ],
  });
  return { ranges, table };
}

async function createPriceComponents(tx: Tx, tenantId: string, optionId: string, total: number, chargeableWeight: number, cargoValue: number): Promise<void> {
  const base = Math.round((total * 0.42) * 100) / 100;
  const weight = Math.round((chargeableWeight * 1.55) * 100) / 100;
  const adValorem = Math.round((cargoValue * 0.0035) * 100) / 100;
  const toll = Math.round((total * 0.08) * 100) / 100;
  const gris = Math.round((cargoValue * 0.0018) * 100) / 100;
  const insurance = Math.max(8, Math.round((cargoValue * 0.0012) * 100) / 100);
  const subtotal = base + weight + adValorem + toll + gris + insurance;
  const adjustment = Math.round((total - subtotal) * 100) / 100;
  await tx.freightSimulationPriceComponent.createMany({
    data: [
      component(tenantId, optionId, FreightPriceComponentType.BASE, 'Frete base', base, 10),
      component(tenantId, optionId, FreightPriceComponentType.WEIGHT, 'Peso cobrável', weight, 20),
      component(tenantId, optionId, FreightPriceComponentType.AD_VALOREM, 'Ad valorem', adValorem, 30),
      component(tenantId, optionId, FreightPriceComponentType.GRIS, 'GRIS', gris, 40),
      component(tenantId, optionId, FreightPriceComponentType.TOLL, 'Pedágio', toll, 50),
      component(tenantId, optionId, FreightPriceComponentType.INSURANCE, 'Seguro', insurance, 60),
      component(tenantId, optionId, adjustment >= 0 ? FreightPriceComponentType.ADDITION : FreightPriceComponentType.DISCOUNT, adjustment >= 0 ? 'Ajuste operacional' : 'Desconto negociado', adjustment, 70),
      component(tenantId, optionId, FreightPriceComponentType.TOTAL, 'Total', total, 999),
    ],
  });
}

async function createTrackingTimeline(
  tx: Tx,
  tenantId: string,
  shipmentId: string,
  userId: string,
  finalStatus: ShipmentStatus,
  createdAt: Date,
  originCity: string,
  destinationCity: string,
): Promise<void> {
  const baseEvents = [
    { description: 'Pedido criado e operação registrada.', location: originCity, status: ShipmentStatus.CREATED },
    { description: 'Coleta agendada com a filial de origem.', location: originCity, status: ShipmentStatus.PICKUP_SCHEDULED },
    { description: 'Coleta realizada pelo parceiro logístico.', location: originCity, status: ShipmentStatus.PICKED_UP },
    { description: 'Carga em trânsito para hub regional.', location: 'Hub de consolidação', status: ShipmentStatus.IN_TRANSIT },
    { description: 'Carga recebida no centro de distribuição.', location: 'Centro de distribuição', status: ShipmentStatus.ARRIVED_AT_HUB },
    { description: 'Carga saiu para entrega ao destinatário.', location: destinationCity, status: ShipmentStatus.OUT_FOR_DELIVERY },
  ];
  const terminalMap: Record<string, Array<{ description: string; eventType?: TrackingEventType; location: string; status?: ShipmentStatus }>> = {
    [ShipmentStatus.CREATED]: [],
    [ShipmentStatus.PICKED_UP]: [],
    [ShipmentStatus.IN_TRANSIT]: [],
    [ShipmentStatus.OUT_FOR_DELIVERY]: [],
    [ShipmentStatus.DELIVERED]: [{ description: 'Entrega concluída e comprovante recebido.', location: destinationCity, status: ShipmentStatus.DELIVERED }],
    [ShipmentStatus.CANCELED]: [{ description: 'Operação cancelada por solicitação administrativa.', location: originCity, status: ShipmentStatus.CANCELED }],
    [ShipmentStatus.DELIVERY_FAILED]: [{ description: 'Tentativa de entrega sem sucesso; destinatário ausente.', location: destinationCity, status: ShipmentStatus.DELIVERY_FAILED }],
    [ShipmentStatus.RETURNING]: [
      { description: 'Falha de entrega registrada.', location: destinationCity, status: ShipmentStatus.DELIVERY_FAILED },
      { description: 'Carga em processo de devolução.', location: destinationCity, status: ShipmentStatus.RETURNING },
    ],
    [ShipmentStatus.RETURNED]: [
      { description: 'Falha de entrega registrada.', location: destinationCity, status: ShipmentStatus.DELIVERY_FAILED },
      { description: 'Carga retornando ao remetente.', location: 'Malha de devolução', status: ShipmentStatus.RETURNING },
      { description: 'Carga devolvida à origem.', location: originCity, status: ShipmentStatus.RETURNED },
    ],
    [ShipmentStatus.PICKUP_SCHEDULED]: [],
    [ShipmentStatus.ARRIVED_AT_HUB]: [],
  };
  const cutoffStatusOrder: ShipmentStatus[] = [
    ShipmentStatus.CREATED,
    ShipmentStatus.PICKUP_SCHEDULED,
    ShipmentStatus.PICKED_UP,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.ARRIVED_AT_HUB,
    ShipmentStatus.OUT_FOR_DELIVERY,
  ];
  const cutoffIndex = isStatusIn(finalStatus, cutoffStatusOrder) ? cutoffStatusOrder.indexOf(finalStatus) : baseEvents.length - 1;
  const statusEvents = [...baseEvents.slice(0, cutoffIndex + 1), ...(terminalMap[finalStatus] ?? [])];
  const allEvents: Array<{ description: string; eventType?: TrackingEventType; location: string; status?: ShipmentStatus }> = [
    ...statusEvents,
    { description: 'Previsão revisada após atualização da malha.', eventType: TrackingEventType.ETA_UPDATED, location: 'Torre de controle' },
    { description: 'Observação operacional registrada para acompanhamento.', eventType: TrackingEventType.NOTE_ADDED, location: destinationCity },
  ];
  for (const [index, event] of allEvents.entries()) {
    await tx.trackingEvent.create({
      data: {
        createdById: userId,
        description: event.description,
        eventType: event.eventType ?? TrackingEventType.STATUS_CHANGED,
        externalCode: `TRK-${shipmentId.slice(0, 8)}-${index + 1}`,
        idempotencyKey: `seed-${shipmentId}-${index + 1}`,
        location: event.location,
        metadata: event.eventType === TrackingEventType.ETA_UPDATED ? { etaShiftHours: 6 } : { source: 'demo-seed' },
        occurredAt: addHours(createdAt, index * 8),
        receivedAt: addHours(createdAt, index * 8 + 1),
        shipmentId,
        status: event.status ?? null,
        tenantId,
      },
    });
  }
}

async function createImportHistory(
  tx: Tx,
  tenantId: string,
  adminId: string,
  managerId: string,
  slug: string,
  customers: Array<{ id: string; document: string | null; name: string }>,
  carriers: Array<{ id: string; code: string | null; name: string }>,
): Promise<void> {
  const jobs = [
    { errors: 0, file: 'clientes-onboarding.csv', progress: 100, skipped: 1, status: ImportStatus.COMPLETED, success: 18, total: 19, type: ImportType.CUSTOMERS },
    { errors: 3, file: 'clientes-atualizacao.xlsx', progress: 100, skipped: 2, status: ImportStatus.COMPLETED, success: 21, total: 26, type: ImportType.CUSTOMERS },
    { errors: 0, file: 'transportadoras-contratos.csv', progress: 100, skipped: 0, status: ImportStatus.COMPLETED, success: 8, total: 8, type: ImportType.CARRIERS },
    { errors: 6, file: 'transportadoras-invalidas.xlsx', progress: 100, skipped: 1, status: ImportStatus.FAILED, success: 2, total: 9, type: ImportType.CARRIERS },
    { errors: 1, file: 'clientes-processamento-lento.csv', progress: 62, skipped: 0, status: ImportStatus.PROCESSING, success: 31, total: 50, type: ImportType.CUSTOMERS },
  ];
  for (const [jobIndex, job] of jobs.entries()) {
    const importJob = await tx.importJob.create({
      data: {
        createdAt: daysAgo(70 - jobIndex * 9),
        createdById: jobIndex % 2 === 0 ? adminId : managerId,
        errorRows: job.errors,
        errorSummary: job.errors > 0 ? { firstError: 'Documento inválido ou duplicado no arquivo.', invalidRows: job.errors } : { invalidRows: 0 },
        failureReason: job.status === ImportStatus.FAILED ? 'Arquivo possui erro estrutural em colunas obrigatórias.' : null,
        fileHash: `hash-${slug}-${jobIndex}`,
        fileType: job.file.endsWith('.xlsx') ? 'xlsx' : 'csv',
        filename: job.file,
        finishedAt: job.status === ImportStatus.PROCESSING ? null : daysAgo(70 - jobIndex * 9 - 1),
        mapping: job.type === ImportType.CUSTOMERS ? { documento: 'document', nome: 'name' } : { cnpj: 'document', codigo: 'code' },
        mimeType: job.file.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
        options: { duplicatePolicy: jobIndex % 2 === 0 ? 'update' : 'skip' },
        processedRows: job.status === ImportStatus.PROCESSING ? Math.floor(job.total * 0.62) : job.total,
        progress: job.progress,
        sizeBytes: 20480 + jobIndex * 4096,
        skippedRows: job.skipped,
        startedAt: daysAgo(70 - jobIndex * 9),
        status: job.status,
        storedFilename: `${slug}/${job.file}`,
        successRows: job.success,
        tenantId,
        totalRows: job.total,
        type: job.type,
      },
    });
    for (let row = 1; row <= Math.min(job.total, 10); row += 1) {
      const isError = row <= job.errors;
      const customer = at(customers, row % customers.length, 'import row customer');
      const carrier = at(carriers, row % carriers.length, 'import row carrier');
      await tx.importRowResult.create({
        data: {
          createdResourceId: isError ? null : job.type === ImportType.CUSTOMERS ? customer.id : carrier.id,
          errorCode: isError ? (row % 2 === 0 ? 'DUPLICATE_DOCUMENT' : 'INVALID_DOCUMENT') : null,
          errorMessage: isError ? (row % 2 === 0 ? 'Documento já cadastrado no tenant.' : 'Documento não passou na validação.') : null,
          externalReference: job.type === ImportType.CUSTOMERS ? customer.document : carrier.code,
          importJobId: importJob.id,
          normalizedData: job.type === ImportType.CUSTOMERS ? { document: customer.document, name: customer.name } : { code: carrier.code, name: carrier.name },
          rowNumber: row,
          status: isError ? ImportRowStatus.ERROR : row === 10 && job.skipped > 0 ? ImportRowStatus.SKIPPED : ImportRowStatus.SUCCESS,
          tenantId,
        },
      });
    }
  }
}

async function createInsights(
  tx: Tx,
  tenantId: string,
  slug: string,
  customers: Array<{ id: string; name: string }>,
  carriers: Array<{ id: string; name: string }>,
  branches: Array<{ id: string; city: string | null; name: string }>,
): Promise<void> {
  const insightCarrierDelay = at(carriers, 1, 'insight carrier delay');
  const insightCarrierCoverage = at(carriers, 3, 'insight carrier coverage');
  const insightBranchMain = at(branches, 0, 'insight main branch');
  const insightBranchDestination = at(branches, 2, 'insight route destination branch');
  const insightBranchLate = at(branches, 3, 'insight late branch');
  const insightCustomerGrowth = at(customers, 0, 'insight growth customer');
  const insights = [
    {
      actionUrl: '/dashboard?status=late',
      category: InsightCategory.OPERATION,
      description: `${insightCarrierDelay.name} concentra atrasos em rotas para ${insightBranchLate.city}; revisar SLA e janela de coleta.`,
      metric: 18.4,
      severity: InsightSeverity.WARNING,
      title: 'Atraso elevado em rota crítica',
      type: 'carrier-delay-rate',
    },
    {
      actionUrl: '/freight/history',
      category: InsightCategory.COST,
      description: `A rota ${insightBranchMain.city} → ${insightBranchDestination.city} ficou 12,8% mais cara que o período anterior.`,
      metric: 12.8,
      severity: InsightSeverity.CRITICAL,
      title: 'Aumento de custo por rota',
      type: 'route-cost-increase',
    },
    {
      actionUrl: '/carriers',
      category: InsightCategory.CARRIER,
      description: `${insightCarrierCoverage.name} aparece em poucas opções elegíveis; cobertura pode estar insuficiente.`,
      metric: 2,
      severity: InsightSeverity.OPPORTUNITY,
      title: 'Cobertura de transportadora abaixo do esperado',
      type: 'carrier-low-coverage',
    },
    {
      actionUrl: `/customers?search=${encodeURIComponent(insightCustomerGrowth.name)}`,
      category: InsightCategory.CUSTOMER,
      description: `${insightCustomerGrowth.name} aumentou o volume de simulações e embarques nos últimos 30 dias.`,
      metric: 31,
      severity: InsightSeverity.INFO,
      title: 'Cliente com crescimento operacional',
      type: 'customer-growth',
    },
    {
      actionUrl: '/branches',
      category: InsightCategory.ROUTE,
      description: `${insightBranchMain.name} concentra maior volume de origens e deve ter capacidade monitorada.`,
      metric: 42,
      severity: InsightSeverity.OPPORTUNITY,
      title: 'Filial com maior volume de operações',
      type: 'branch-volume',
    },
    {
      actionUrl: '/imports',
      category: InsightCategory.IMPORT,
      description: 'Importações recentes apresentaram erros recorrentes de documento; revisar template enviado aos clientes.',
      metric: 15.3,
      severity: InsightSeverity.WARNING,
      title: 'Qualidade cadastral abaixo do ideal',
      type: 'import-error-rate',
    },
  ];
  for (const [index, insight] of insights.entries()) {
    await tx.insight.create({
      data: {
        actionUrl: insight.actionUrl,
        category: insight.category,
        comparisonValue: decimal(index % 2 === 0 ? insight.metric - 4 : insight.metric + 5, 4),
        dedupeKey: `${slug}-${insight.type}`,
        description: insight.description,
        dismissedAt: index === 5 ? daysAgo(2) : null,
        evidence: { sampleSize: 12 + index * 3, source: 'demo-seed' },
        generatedAt: daysAgo(10 - index),
        metadata: { rule: insight.type, threshold: index % 2 === 0 ? '>= 10%' : '>= 5 registros' },
        metricValue: decimal(insight.metric, 4),
        percentageChange: decimal(index % 2 === 0 ? insight.metric : -insight.metric / 2, 4),
        periodEnd: daysAgo(1),
        periodStart: daysAgo(31),
        readAt: index === 1 || index === 4 ? daysAgo(1) : null,
        resourceId: index === 2 ? insightCarrierCoverage.id : index === 3 ? insightCustomerGrowth.id : index === 4 ? insightBranchMain.id : null,
        resourceType: index === 2 ? 'Carrier' : index === 3 ? 'Customer' : index === 4 ? 'Branch' : null,
        severity: insight.severity,
        status: index === 5 ? InsightStatus.DISMISSED : index === 1 || index === 4 ? InsightStatus.READ : InsightStatus.NEW,
        tenantId,
        title: insight.title,
        type: insight.type,
      },
    });
  }
}

async function createAuditTrail(
  tx: Tx,
  tenantId: string,
  slug: string,
  users: Array<{ id: string; email: string }>,
  customers: Array<{ id: string; name: string }>,
  carriers: Array<{ id: string; name: string }>,
): Promise<void> {
  const actions: AuditAction[] = [
    AuditAction.LOGIN,
    AuditAction.AUTH_FAILURE,
    AuditAction.USER_CREATED,
    AuditAction.ROLE_CHANGED,
    AuditAction.CUSTOMER_CHANGED,
    AuditAction.CARRIER_CHANGED,
    AuditAction.FREIGHT_PRICING_CHANGED,
    AuditAction.FREIGHT_SIMULATION_CREATED,
    AuditAction.FREIGHT_OPTION_SELECTED,
    AuditAction.SHIPMENT_CREATED,
    AuditAction.IMPORT_CREATED,
    AuditAction.IMPORT_COMPLETED,
    AuditAction.INSIGHT_GENERATED,
    AuditAction.ADMIN_OPERATION,
    AuditAction.LOGOUT,
  ];
  for (let index = 0; index < 36; index += 1) {
    const action = at(actions, index % actions.length, 'audit action');
    const actor = at(users, index % users.length, 'audit actor');
    const customer = at(customers, index % customers.length, 'audit customer');
    const carrier = at(carriers, index % carriers.length, 'audit carrier');
    await tx.auditLog.create({
      data: {
        action,
        actorId: actor.id,
        createdAt: daysAgo(89 - index * 2),
        entityId: action === AuditAction.CUSTOMER_CHANGED ? customer.id : action === AuditAction.CARRIER_CHANGED ? carrier.id : actor.id,
        entityType: action === AuditAction.CUSTOMER_CHANGED ? 'Customer' : action === AuditAction.CARRIER_CHANGED ? 'Carrier' : isImportAuditAction(action) ? 'ImportJob' : 'TenantOperation',
        ipHash: `ip-${slug}-${index % 5}`,
        metadata: {
          operation: auditOperation(index),
          resourceName: action === AuditAction.CUSTOMER_CHANGED ? customer.name : action === AuditAction.CARRIER_CHANGED ? carrier.name : slug,
          result: index % 7 === 0 ? 'warning' : 'success',
        },
        requestId: `seed-${slug}-${String(index + 1).padStart(3, '0')}`,
        tenantId,
      },
    });
  }
}

function alphaTenant(): DemoTenantData {
  return {
    documentBase: '124578960001',
    name: 'Alpha Logistics',
    slug: 'alpha-logistics',
    users: [
      { branchIndex: 0, email: 'administrador@dev.com', mfaEnabled: false, name: 'Marina Albuquerque - Administradora', role: UserRole.ADMIN },
      { branchIndex: 0, email: 'supervisor@alphalogistics.dev', mfaEnabled: true, name: 'Rafael Nogueira - Supervisor', role: UserRole.MANAGER },
      { branchIndex: 1, email: 'operador@alphalogistics.dev', name: 'Camila Torres - Operadora', role: UserRole.OPERATOR },
      { branchIndex: 2, email: 'analista@alphalogistics.dev', name: 'Bruno Meireles - Analista', role: UserRole.MANAGER },
      { branchIndex: 3, email: 'visualizador@alphalogistics.dev', name: 'Lívia Sampaio - Visualizadora', role: UserRole.OPERATOR },
      { branchIndex: 4, email: 'inativo@alphalogistics.dev', name: 'Usuário Desativado Homologação', role: UserRole.OPERATOR, status: UserStatus.DISABLED },
      { branchIndex: 0, email: 'admin.test@dev.com', name: 'Admin Teste - Visão Administrativa', role: UserRole.ADMIN },
      { branchIndex: 1, email: 'manager.test@dev.com', name: 'Manager Teste - Visão Gerencial', role: UserRole.MANAGER },
      { branchIndex: 2, email: 'operator.test@dev.com', name: 'Operator Teste - Visão Operacional', role: UserRole.OPERATOR },
    ],
    branches: [
      branch('Matriz São Paulo', 'SP-MTZ', '01001000', 'Praça da Sé', '100', 'Sé', 'São Paulo', 'SP', true),
      branch('Filial Campinas', 'SP-CPS', '13010001', 'Avenida Francisco Glicério', '1240', 'Centro', 'Campinas', 'SP'),
      branch('Hub Uberlândia', 'MG-UDI', '38400010', 'Avenida Afonso Pena', '860', 'Centro', 'Uberlândia', 'MG'),
      branch('Filial Goiânia', 'GO-GYN', '74000010', 'Avenida Goiás', '510', 'Setor Central', 'Goiânia', 'GO'),
      branch('Filial Curitiba', 'PR-CWB', '80010000', 'Rua XV de Novembro', '700', 'Centro', 'Curitiba', 'PR'),
    ],
    carriers: [
      carrier('RAPIDA', 'Rápida Brasil Transportes', 'relacionamento@rapidabrasil.dev', 'https://rapidabrasil.dev'),
      carrier('SULMINAS', 'SulMinas Cargo', 'operacoes@sulminascargo.dev', 'https://sulminascargo.dev'),
      carrier('CERRADO', 'Cerrado Express', 'malha@cerradoexpress.dev', 'https://cerradoexpress.dev'),
      carrier('PONTEAEREA', 'Ponte Aérea Logística', 'aereo@ponteaerea.dev', 'https://ponteaerea.dev'),
      carrier('INATIVA', 'Atlântico Histórico Transportes', 'arquivo@atlanticohistorico.dev', 'https://atlanticohistorico.dev'),
    ],
    customers: [
      customer('Mercado Aurora Distribuição', 'operacoes@mercadoaurora.dev', '01031000', 'Rua Boa Vista', '210', 'Centro', 'São Paulo', 'SP'),
      customer('Biofarma Minas', 'logistica@biofarmaminas.dev', '30140071', 'Rua da Bahia', '950', 'Lourdes', 'Belo Horizonte', 'MG'),
      customer('Casa Verde E-commerce', 'expedicao@casaverde.dev', '74015010', 'Rua 4', '88', 'Setor Central', 'Goiânia', 'GO'),
      customer('Paraná Autopeças', 'supply@paranaautopecas.dev', '80020010', 'Rua Marechal Deodoro', '1400', 'Centro', 'Curitiba', 'PR'),
      customer('Triângulo Equipamentos', 'embarques@trianguloequip.dev', '38400678', 'Avenida João Naves de Ávila', '2245', 'Santa Mônica', 'Uberlândia', 'MG'),
      customer('Solar Varejo Regional', 'cadastro@solarvarejo.dev', '13025000', 'Rua Barão de Jaguara', '1022', 'Centro', 'Campinas', 'SP'),
    ],
    routePairs: [
      { destination: 2, origin: 0 },
      { destination: 3, origin: 0 },
      { destination: 3, origin: 2 },
      { destination: 4, origin: 2 },
      { destination: 4, origin: 1 },
      { destination: 0, origin: 4 },
    ],
  };
}

function betaTenant(): DemoTenantData {
  return {
    documentBase: '198765430001',
    name: 'Beta Transportes',
    slug: 'beta-transportes',
    users: [
      { branchIndex: 0, email: 'admin@betatransportes.dev', name: 'Helena Duarte - Administradora', role: UserRole.ADMIN },
      { branchIndex: 1, email: 'supervisor@betatransportes.dev', mfaEnabled: true, name: 'Igor Martins - Supervisor', role: UserRole.MANAGER },
      { branchIndex: 2, email: 'operador@betatransportes.dev', name: 'Patrícia Barros - Operadora', role: UserRole.OPERATOR },
      { branchIndex: 3, email: 'analista@betatransportes.dev', name: 'Daniel Fontes - Analista', role: UserRole.MANAGER },
      { branchIndex: 4, email: 'visualizador@betatransportes.dev', name: 'Renata Silveira - Visualizadora', role: UserRole.OPERATOR },
      { branchIndex: 4, email: 'bloqueado@betatransportes.dev', name: 'Usuário Bloqueado Homologação', role: UserRole.OPERATOR, status: UserStatus.DISABLED },
    ],
    branches: [
      branch('Matriz Ribeirão Preto', 'SP-RPO', '14010010', 'Rua General Osório', '455', 'Centro', 'Ribeirão Preto', 'SP', true),
      branch('Filial Contagem', 'MG-CNT', '32010010', 'Avenida João César de Oliveira', '900', 'Eldorado', 'Contagem', 'MG'),
      branch('Hub Anápolis', 'GO-APS', '75020010', 'Avenida Brasil', '1200', 'Jundiaí', 'Anápolis', 'GO'),
      branch('Filial Londrina', 'PR-LDB', '86010010', 'Avenida Paraná', '300', 'Centro', 'Londrina', 'PR'),
      branch('Filial Sorocaba', 'SP-SOD', '18010000', 'Rua São Bento', '615', 'Centro', 'Sorocaba', 'SP'),
    ],
    carriers: [
      carrier('BRAVO', 'Bravo Rodoviário', 'operacao@bravorodoviario.dev', 'https://bravorodoviario.dev'),
      carrier('EIXO', 'Eixo Centro-Oeste Cargas', 'malha@eixocargas.dev', 'https://eixocargas.dev'),
      carrier('ARAUCARIA', 'Araucária Log Express', 'atendimento@araucaria.dev', 'https://araucaria.dev'),
      carrier('NUVEM', 'Nuvem Aérea Cargo', 'aereo@nuvemcargo.dev', 'https://nuvemcargo.dev'),
      carrier('LEGADO', 'Legado Transportes Arquivados', 'arquivo@legadotransportes.dev', 'https://legadotransportes.dev'),
    ],
    customers: [
      customer('TechMais Componentes', 'logistica@techmais.dev', '14015040', 'Avenida Nove de Julho', '1500', 'Centro', 'Ribeirão Preto', 'SP'),
      customer('Minas Farma Distribuidora', 'operacoes@minasfarma.dev', '32041080', 'Rua Tiradentes', '221', 'Eldorado', 'Contagem', 'MG'),
      customer('AgroNorte Peças', 'expedicao@agronorte.dev', '75024010', 'Rua Barão do Rio Branco', '390', 'Jundiaí', 'Anápolis', 'GO'),
      customer('LondriStore Marketplace', 'transportes@londristore.dev', '86020000', 'Rua Sergipe', '987', 'Centro', 'Londrina', 'PR'),
      customer('Sorocaba Health Supply', 'embarques@sorocabahealth.dev', '18035000', 'Avenida Barão de Tatuí', '810', 'Jardim Faculdade', 'Sorocaba', 'SP'),
      customer('Beta Varejo Interior', 'cadastro@betavarejo.dev', '13050000', 'Avenida John Boyd Dunlop', '420', 'Jardim Londres', 'Campinas', 'SP'),
    ],
    routePairs: [
      { destination: 1, origin: 0 },
      { destination: 2, origin: 0 },
      { destination: 2, origin: 1 },
      { destination: 3, origin: 1 },
      { destination: 4, origin: 3 },
      { destination: 0, origin: 4 },
    ],
  };
}

function branch(name: string, code: string, postalCode: string, street: string, number: string, district: string, city: string, state: string, main = false): BranchSeed {
  return {
    city,
    code,
    district,
    email: `${code.toLowerCase()}@demo-logistica.dev`,
    main,
    name,
    number,
    phone: `+55 ${state === 'SP' ? '11' : state === 'MG' ? '31' : state === 'GO' ? '62' : '41'} 4000-${code.slice(-3).replace(/\D/g, '7').padStart(4, '0')}`,
    postalCode,
    state,
    street,
  };
}

function customer(name: string, email: string, postalCode: string, street: string, number: string, district: string, city: string, state: string): CustomerSeed {
  return {
    city,
    contact: 'Operações Logísticas',
    district,
    email,
    name,
    number,
    phone: `+55 ${state === 'SP' ? '11' : state === 'MG' ? '31' : state === 'GO' ? '62' : '41'} 3000-${postalCode.slice(0, 4)}`,
    postalCode,
    state,
    street,
  };
}

function carrier(code: string, name: string, email: string, site: string): CarrierSeed {
  return {
    code,
    contact: `Mesa ${name}`,
    email,
    name,
    phone: `+55 11 5000-${String(code.length * 137).padStart(4, '0')}`,
    site,
  };
}

function serviceCatalog(carrierCode: string): ServiceSeed[] {
  return [
    { code: `${carrierCode}-ECO`, deadline: 5, modality: 'rodoviario-economico', name: 'Rodoviário Econômico', priceLevel: 1 },
    { code: `${carrierCode}-EXP`, deadline: 3, modality: 'rodoviario-expresso', name: 'Rodoviário Expresso', priceLevel: 3 },
    { code: `${carrierCode}-AIR`, deadline: 2, modality: 'aereo', name: 'Aéreo Prioritário', priceLevel: 5 },
  ];
}

function simulationAddress(tenantId: string, simulationId: string, type: AddressType, branch: BranchSeed) {
  return {
    city: branch.city,
    country: 'BR',
    district: branch.district,
    number: branch.number,
    postalCode: branch.postalCode,
    simulationId,
    state: branch.state,
    street: branch.street,
    tenantId,
    type,
  };
}

function shipmentAddress(tenantId: string, shipmentId: string, type: AddressType, branch: BranchSeed) {
  return {
    city: branch.city,
    country: 'BR',
    district: branch.district,
    number: branch.number,
    postalCode: branch.postalCode,
    shipmentId,
    state: branch.state,
    street: branch.street,
    tenantId,
    type,
  };
}

function component(tenantId: string, optionId: string, type: FreightPriceComponentType, label: string, amount: number, sortOrder: number) {
  return {
    amount: decimal(amount, 2),
    label,
    optionId,
    sortOrder,
    tenantId,
    type,
  };
}

function auditOperation(index: number): string {
  return at(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'IMPORT', 'EXPORT', 'SIMULATION', 'TRACKING'], index % 8, 'audit operation');
}

function isImportAuditAction(action: AuditAction): boolean {
  const importAuditActions: AuditAction[] = [
    AuditAction.IMPORT_CREATED,
    AuditAction.IMPORT_STARTED,
    AuditAction.IMPORT_COMPLETED,
    AuditAction.IMPORT_FAILED,
    AuditAction.IMPORT_CANCELED,
    AuditAction.IMPORT_RETRIED,
    AuditAction.IMPORT_FILE_DOWNLOADED,
  ];

  return importAuditActions.includes(action);
}

function isStatusIn(status: ShipmentStatus, allowed: ShipmentStatus[]): boolean {
  return allowed.includes(status);
}

function at<T>(items: readonly T[], index: number, label: string): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`Demo seed misconfiguration: missing ${label} at index ${index}.`);
  }
  return item;
}

function cnpj(base12: string): string {
  const digits = base12.replace(/\D/g, '').padEnd(12, '0').slice(0, 12);
  const first = cnpjDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = cnpjDigit(`${digits}${first}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${digits}${first}${second}`;
}

function cnpjDigit(value: string, weights: number[]): number {
  const sum = value.split('').reduce((total, digit, index) => total + Number(digit) * at(weights, index, 'CNPJ weight'), 0);
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

function decimal(value: number, places: number): string {
  return value.toFixed(places);
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addHours(date: Date, hours: number): Date {
  const next = new Date(date);
  next.setUTCHours(next.getUTCHours() + hours);
  return next;
}

function uuid(tenantOffset: number, group: number, index: number): string {
  const suffix = `${tenantOffset}${group}${index}`.padStart(12, '0').slice(-12);
  return `00000000-0000-4000-8000-${suffix}`;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${key.toString('base64url')}`;
}

type Tx = Prisma.TransactionClient;

main().catch(async (error: unknown) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
