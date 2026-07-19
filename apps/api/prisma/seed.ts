import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-logistics' },
    update: {},
    create: {
      name: 'Demo Logistics',
      slug: 'demo-logistics',
      document: '00000000000100',
    },
  });

  const branch = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'HQ' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'HQ',
      name: 'Headquarters',
    },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@example.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Demo Admin',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: 'local-seed-placeholder-not-a-real-password',
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
