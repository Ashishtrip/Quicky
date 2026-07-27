import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding Snacks & Beverages category...');

  const categorySnacks = await prisma.category.create({
    data: {
      name: 'Snacks & Beverages',
      useTodayDiscountPct: 35,
      sortOrder: 3,
    }
  });

  await prisma.catalogItem.create({
    data: {
      categoryId: categorySnacks.id,
      name: 'Lays Classic Salted',
      unit: '50 g',
      referenceMrp: 20,
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-e92383833545?auto=format&fit=crop&w=500&q=60',
      tags: ['snack', 'chips'],
    }
  });

  await prisma.catalogItem.create({
    data: {
      categoryId: categorySnacks.id,
      name: 'Coca Cola Can',
      unit: '300 ml',
      referenceMrp: 40,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60',
      tags: ['beverage', 'cola', 'drink'],
    }
  });

  console.log('Successfully added Snacks & Beverages and sample items.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
