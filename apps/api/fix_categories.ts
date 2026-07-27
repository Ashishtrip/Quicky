import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to DB...');

  await prisma.category.updateMany({ where: { name: 'Fresh Fruits' }, data: { name: 'Fruits' } });
  await prisma.category.updateMany({ where: { name: 'Fresh Vegetables' }, data: { name: 'Vegetables' } });
  await prisma.category.updateMany({ where: { name: 'Snacks & Beverages' }, data: { name: 'Snacks' } });

  const existingBev = await prisma.category.findFirst({ where: { name: 'Beverages' } });
  if (!existingBev) await prisma.category.create({ data: { name: 'Beverages', useTodayDiscountPct: 35, sortOrder: 3 } });

  const existingMeat = await prisma.category.findFirst({ where: { name: 'Meat & poultry' } });
  if (!existingMeat) await prisma.category.create({ data: { name: 'Meat & poultry', useTodayDiscountPct: 40, sortOrder: 1 } });

  const existingDairy = await prisma.category.findFirst({ where: { name: 'Dairy' } });
  if (!existingDairy) await prisma.category.create({ data: { name: 'Dairy', useTodayDiscountPct: 40, sortOrder: 6 } });

  console.log('Categories updated!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
