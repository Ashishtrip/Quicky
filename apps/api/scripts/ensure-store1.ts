import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.store.upsert({
    where: { id: 'store_1' },
    update: {},
    create: {
      id: 'store_1',
      name: 'Quicky Fresh Mart (Test)',
      address: 'Rohini Sector 7, New Delhi',
      latitude: 28.7495,
      longitude: 77.0565,
      phone: '9876543210',
      ownerName: 'Test Owner',
      ownerPhone: '9876543210',
      contactEmail: 'store@test.com',
      contactPhone: '9876543210',
      isVerified: true,
      isActive: true,
    }
  });
  console.log('Ensured store_1 exists');
  await prisma.$disconnect();
}
run().catch(console.error);
