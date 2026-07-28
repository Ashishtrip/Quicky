import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  await prisma.tracking.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderTicket.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.catalogItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.store.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '9988776655',
      address: 'Rohini Sector 7, New Delhi'
    }
  });

  console.log(`Created user: ${user.name}`);

  // 1. Create a dummy Store
  const store = await prisma.store.create({
    data: {
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
      isOpen: true,
    }
  });

  // Seed store location into Redis geo-index
  const { redis } = require('../src/utils/redis');
  await redis.geoadd('quicky:stores:locations', store.longitude, store.latitude, store.id);

  console.log(`Created store: ${store.id}`);

  // 2. Create Categories
  const categoryMeat = await prisma.category.create({ data: { name: 'Meat & poultry', useTodayDiscountPct: 40, sortOrder: 1 } });
  const categorySnacks = await prisma.category.create({ data: { name: 'Snacks', useTodayDiscountPct: 35, sortOrder: 2 } });
  const categoryBeverages = await prisma.category.create({ data: { name: 'Beverages', useTodayDiscountPct: 35, sortOrder: 3 } });
  const categoryFruits = await prisma.category.create({ data: { name: 'Fruits', useTodayDiscountPct: 40, sortOrder: 4 } });
  const categoryVeg = await prisma.category.create({ data: { name: 'Vegetables', useTodayDiscountPct: 40, sortOrder: 5 } });
  const categoryDairy = await prisma.category.create({ data: { name: 'Dairy', useTodayDiscountPct: 40, sortOrder: 6 } });
  
  console.log(`Created categories: ${categoryMeat.name}, ${categorySnacks.name}, ${categoryBeverages.name}, ${categoryFruits.name}, ${categoryVeg.name}, ${categoryDairy.name}`);

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    const { redis } = require('../src/utils/redis');
    if (redis) await redis.quit();
  });
