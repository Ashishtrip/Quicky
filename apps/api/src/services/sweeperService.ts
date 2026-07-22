import { prisma } from "../db/prisma";

export const sweepStaleOrders = async () => {
  // Find orders awaiting payment for more than 5 minutes
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

  const staleOrders = await prisma.order.findMany({
    where: {
      status: "AWAITING_PAYMENT",
      updatedAt: {
        lt: fiveMinsAgo
      }
    },
    include: {
      items: true
    }
  });

  if (staleOrders.length === 0) return;

  console.log(`Found ${staleOrders.length} stale orders awaiting payment. Cancelling and restocking...`);

  for (const order of staleOrders) {
    try {
      await prisma.$transaction(async (tx) => {
        // Double check status in case it was paid right before transaction
        const currentOrder = await tx.order.findUnique({ where: { id: order.id } });
        if (currentOrder?.status !== "AWAITING_PAYMENT") return;

        // Mark as CANCELLED and FAILED payment
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "CANCELLED",
            payment: {
              update: {
                paymentStatus: "FAILED"
              }
            }
          }
        });

        // Restock inventory for the assigned store
        if (order.assignedStoreId) {
          for (const item of order.items) {
            const listing = await tx.listing.findFirst({
              where: {
                storeId: order.assignedStoreId,
                catalogItemId: item.catalogItemId,
                expiryBucket: item.expiryBucket
              }
            });

            if (listing) {
              await tx.listing.update({
                where: { id: listing.id },
                data: {
                  stockQuantity: listing.stockQuantity + item.quantity
                }
              });
            }
          }
        }
      });
      console.log(`Successfully cancelled and restocked order ${order.id}`);
    } catch (e) {
      console.error(`Failed to sweep order ${order.id}`, e);
    }
  }
};

// In a real entrypoint (like index.ts), you'd call:
// setInterval(sweepStaleOrders, 60 * 1000); // run every minute
