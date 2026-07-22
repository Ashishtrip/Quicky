import { prisma } from "../db/prisma";
import { haversineKm, calculateDiscountedPrice } from "../utils/math";
import { storeAssignmentQueue } from "./store-assignment.service";
export interface CheckoutItem {
  catalogItemId: string;
  quantity: number;
  expiryBucket: "USE_TODAY" | "FRESH_STOCK";
}

export interface CheckoutRequest {
  customerId: string;
  lat: number;
  lng: number;
  radiusKm?: number;
  paymentMethod: "COD" | "PAYPAL";
  items: CheckoutItem[];
}

export async function createCheckout(req: CheckoutRequest) {
  const radiusKm = req.radiusKm ?? 3;
  const paymentMethod = req.paymentMethod ?? "COD";

  // 1. Find all active stores
  const allStores = await prisma.store.findMany({
    where: { isActive: true },
  });

  // Filter nearby
  const nearbyStores = allStores.filter(
    (s) => haversineKm(req.lat, req.lng, s.latitude, s.longitude) <= radiusKm,
  );

  if (nearbyStores.length === 0) {
    throw new Error("No stores found in your area.");
  }

  // 2. Fetch all relevant listings for nearby stores
  const catalogItemIds = req.items.map((i) => i.catalogItemId);
  const listings = await prisma.listing.findMany({
    where: {
      storeId: { in: nearbyStores.map((s) => s.id) },
      catalogItemId: { in: catalogItemIds },
      isActive: true,
      stockQuantity: { gt: 0 },
    },
    include: {
      catalogItem: {
        include: { category: true },
      },
    },
  });

  // 3. Find eligible stores (must have all items with enough stock and matching bucket)
  const eligibleStoreIds: string[] = [];

  let calculatedTotal = 0;
  let hasCalculatedTotal = false;
  const genericOrderItems: any[] = [];

  for (const store of nearbyStores) {
    let canFulfill = true;
    const storeListings = listings.filter((l) => l.storeId === store.id);
    let storeTotal = 0;
    const itemsData = [];

    for (const reqItem of req.items) {
      const match = storeListings.find(
        (l) =>
          l.catalogItemId === reqItem.catalogItemId &&
          l.expiryBucket === reqItem.expiryBucket &&
          l.stockQuantity >= reqItem.quantity,
      );

      if (!match) {
        canFulfill = false;
        break;
      }

      let discountedPrice = null;
      if (
        reqItem.expiryBucket === "USE_TODAY" &&
        match.catalogItem.category.useTodayDiscountPct > 0
      ) {
        discountedPrice = calculateDiscountedPrice(
          match.price,
          match.catalogItem.category.useTodayDiscountPct
        );
      }

      const finalPrice =
        discountedPrice !== null ? discountedPrice : match.price;
      storeTotal += finalPrice * reqItem.quantity;

      itemsData.push({
        catalogItemId: reqItem.catalogItemId,
        quantity: reqItem.quantity,
        price: match.price,
        discountedPrice,
        expiryBucket: reqItem.expiryBucket,
      });
    }

    if (canFulfill) {
      eligibleStoreIds.push(store.id);
      if (!hasCalculatedTotal) {
        calculatedTotal = storeTotal;
        genericOrderItems.push(...itemsData);
        hasCalculatedTotal = true;
      }
    }
  }

  if (eligibleStoreIds.length === 0) {
    throw new Error(
      "Items no longer available nearby in requested quantities.",
    );
  }

  // 4. Create the order
  const deliveryFee = calculatedTotal > 350 ? 0 : 25;

  // Ensure the user exists in the DB since Firebase manages auth
  await prisma.user.upsert({
    where: { id: req.customerId },
    update: {},
    create: {
      id: req.customerId,
      name: 'Quicky User',
      email: `${req.customerId}@quicky.local`,
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: req.customerId, // Using userId from updated schema
      status: "PENDING",
      totalAmount: calculatedTotal + deliveryFee,
      deliveryFee,
      items: {
        create: genericOrderItems,
      },
      payment: {
        create: {
          paymentMethod: paymentMethod,
          amount: calculatedTotal + deliveryFee,
          paymentStatus: "PENDING"
        }
      }
    },
    include: {
      items: true,
      payment: true,
    },
  });

  // 5. Enqueue into Store Assignment Queue
  await storeAssignmentQueue.add('assign_store', {
    orderId: order.id,
    latitude: req.lat,
    longitude: req.lng,
    attempt: 1,
    ignoredStoreIds: []
  });

  console.log(
    `[Store Assignment] Enqueued Order ${order.id} for store discovery and locking.`
  );

  return order;
}
