const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const stores = await prisma.store.findMany();
  console.log("Stores:", JSON.stringify(stores, null, 2));
  const listings = await prisma.listing.findMany();
  console.log("Listings:", JSON.stringify(listings, null, 2));
}
run().then(() => process.exit(0)).catch(console.error);
