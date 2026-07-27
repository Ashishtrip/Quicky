import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const stores = await prisma.store.findMany();
  console.log("Stores:", JSON.stringify(stores, null, 2));
}
main().finally(() => prisma.$disconnect());
