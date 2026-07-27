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

  // 3. Create Catalog Items
  const apple = await prisma.catalogItem.create({
    data: {
      categoryId: categoryFruits.id,
      name: 'Kashmiri Apples',
      unit: '1 kg',
      referenceMrp: 200,
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?auto=format&fit=crop&w=500&q=60',
      tags: ['fruit', 'apple', 'fresh'],
    }
  });

  const banana = await prisma.catalogItem.create({
    data: {
      categoryId: categoryFruits.id,
      name: 'Robusta Bananas',
      unit: '500 g',
      referenceMrp: 50,
      imageUrl: 'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?auto=format&fit=crop&w=500&q=60',
      tags: ['fruit', 'banana', 'fresh'],
    }
  });

  const onion = await prisma.catalogItem.create({
    data: {
      categoryId: categoryVeg.id,
      name: 'Red Onions',
      unit: '1 kg',
      referenceMrp: 40,
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=60',
      tags: ['vegetable', 'onion'],
    }
  });

  const chips = await prisma.catalogItem.create({
    data: {
      categoryId: categorySnacks.id,
      name: 'Lays Classic Salted',
      unit: '50 g',
      referenceMrp: 20,
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-e92383833545?auto=format&fit=crop&w=500&q=60',
      tags: ['snack', 'chips'],
    }
  });

  const cola = await prisma.catalogItem.create({
    data: {
      categoryId: categoryBeverages.id,
      name: 'Coca Cola Can',
      unit: '300 ml',
      referenceMrp: 40,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60',
      tags: ['beverage', 'cola', 'drink'],
    }
  });

  console.log(`Created catalog items: Apples, Bananas, Onions, Lays, Cola`);

  // 4. Create Listings for the Store
  // Apples - Use Today
  await prisma.listing.create({
    data: {
      storeId: store.id,
      catalogItemId: apple.id,
      price: 180, // Discount is applied dynamically based on category.useTodayDiscountPct
      stockQuantity: 5,
      expiryBucket: 'USE_TODAY',
    }
  });

  // Bananas - Only Fresh Stock
  await prisma.listing.create({
    data: {
      storeId: store.id,
      catalogItemId: banana.id,
      price: 45,
      stockQuantity: 20,
      expiryBucket: 'FRESH_STOCK',
    }
  });

  // Onions - Only Fresh Stock
  await prisma.listing.create({
    data: {
      storeId: store.id,
      catalogItemId: onion.id,
      price: 35,
      stockQuantity: 50,
      expiryBucket: 'FRESH_STOCK',
    }
  });

  console.log(`Created listings for store ${store.id}`);
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
