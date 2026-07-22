import { prisma } from "../db/prisma";
import { redis } from "../utils/redis";

export async function getTicketsForStore(storeId: string) {
  // Return broadcasted tickets that haven't expired
  return prisma.orderTicket.findMany({
    where: {
      storeId,
      OR: [
        {
          status: "BROADCASTED",
          expiresAt: { gt: new Date() },
          order: { status: "PENDING" },
        },
        {
          status: "ACCEPTED",
          order: { status: { in: ["ACCEPTED", "AWAITING_PAYMENT"] } },
        },
      ],
    },
    include: {
      order: {
        include: {
          items: {
            include: {
              catalogItem: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function acceptTicket(storeId: string, ticketId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch the ticket
    const ticket = await tx.orderTicket.findUnique({
      where: { id: ticketId },
      include: { order: true },
    });

    if (!ticket) {
      throw new Error("Ticket not found.");
    }

    if (ticket.storeId !== storeId) {
      throw new Error("Unauthorized access to ticket.");
    }

    if (ticket.status !== "BROADCASTED") {
      if (ticket.status === "ACCEPTED") {
        // Idempotency: if network retries and it's already accepted by this store
        const finalOrder = await tx.order.findUnique({
          where: { id: ticket.orderId },
          include: { items: true, assignedStore: true, delivery: true },
        });
        return finalOrder;
      }
      throw new Error(`Ticket is already ${ticket.status}.`);
    }

    if (ticket.expiresAt < new Date()) {
      throw new Error("Ticket has expired.");
    }

    const order =
      ticket.order ??
      (await tx.order.findUnique({ where: { id: ticket.orderId }, include: { payment: true, user: true } }));
    if (!order) {
      throw new Error("Order not found.");
    }

    const nextStatus =
      // @ts-ignore
      order.payment?.paymentMethod === "COD" ? "ACCEPTED" : "AWAITING_PAYMENT";

    // Create a Delivery record and initial Tracking
    const store = await tx.store.findUnique({ where: { id: storeId } });
    const user = await tx.user.findUnique({ where: { id: order.userId } });

    // Fetch ETA from Redis
    const etaStr = await redis.get(`quicky:ticket:eta:${ticketId}`);
    const etaSeconds = etaStr ? parseInt(etaStr, 10) : 15 * 60; // fallback 15 mins

    if (store && user?.address) {
      const delivery = await tx.delivery.create({
        data: {
          orderId: order.id,
          deliveryAddress: user.address,
          deliveryStatus: "PENDING",
          estimatedDelivery: new Date(Date.now() + etaSeconds * 1000), // ETA in milliseconds
          trackings: {
            create: {
              currentStatus: "Order Assigned",
              location: `${store.latitude},${store.longitude}`
            }
          }
        }
      });
    }

    // 2. Conditionally update the Order to prevent double-assignment
    // updateMany is used here as an atomic conditional update
    const updateResult = await tx.order.updateMany({
      where: {
        id: order.id,
        status: "PENDING",
        assignedStoreId: null,
      },
      data: {
        status: nextStatus,
        assignedStoreId: storeId,
      },
    });

    if (updateResult.count === 0) {
      // Check if it was accepted by us in a concurrent request
      const currentOrder = await tx.order.findUnique({ where: { id: order.id } });
      if (currentOrder?.assignedStoreId === storeId) {
        // We already own this order, so we can proceed or just return it
        const finalOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: { items: true, assignedStore: true, delivery: true },
        });
        return finalOrder;
      }

      // The order was already accepted by someone else or cancelled
      // Mark this ticket as MISSED
      await tx.orderTicket.update({
        where: { id: ticketId },
        data: { status: "MISSED" },
      });
      throw new Error("Too late! Another store already accepted this order.");
    }

    // 3. Mark the winner ticket as ACCEPTED
    await tx.orderTicket.update({
      where: { id: ticketId },
      data: { status: "ACCEPTED" },
    });

    // 4. Mark all other tickets for this order as MISSED
    await tx.orderTicket.updateMany({
      where: {
        orderId: order.id,
        id: { not: ticketId },
      },
      data: { status: "MISSED" },
    });

    // 5. Decrement inventory stock
    const orderItems = await tx.orderItem.findMany({
      where: { orderId: order.id },
    });

    for (const item of orderItems) {
      // We know the listing exists and has stock because we checked during checkout
      // and MVP doesn't have high contention on kirana stock, but we should decrement safely
      const listing = await tx.listing.findFirst({
        where: {
          storeId,
          catalogItemId: item.catalogItemId,
          expiryBucket: item.expiryBucket,
        },
      });

      if (listing) {
        await tx.listing.update({
          where: { id: listing.id },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });
      }
    }

    const finalOrder = await tx.order.findUnique({
      where: { id: order.id },
      include: { items: true, assignedStore: true, delivery: true },
    });

    // Notify User
    await redis.publish('user-notifications', JSON.stringify({
      userId: finalOrder?.userId,
      event: 'order-accepted',
      payload: finalOrder
    }));

    return finalOrder;
  });
}

export async function declineTicket(storeId: string, ticketId: string) {
  const ticket = await prisma.orderTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket || ticket.storeId !== storeId) {
    throw new Error("Ticket not found or unauthorized.");
  }

  return prisma.orderTicket.update({
    where: { id: ticketId },
    data: { status: "DECLINED" },
  });
}

export async function markTicketPacked(storeId: string, ticketId: string) {
  const ticket = await prisma.orderTicket.findUnique({
    where: { id: ticketId },
    include: { order: true },
  });

  if (!ticket || ticket.storeId !== storeId) {
    throw new Error("Ticket not found or unauthorized.");
  }

  if (!ticket.order) {
    throw new Error("Order not found for this ticket.");
  }

  // Update order status to PACKED. 
  // You might want to make sure it is ACCEPTED first.
  if (ticket.order.status !== "ACCEPTED") {
    throw new Error(`Order cannot be marked as packed from status: ${ticket.order.status}`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: ticket.orderId },
    data: { status: "PACKED" },
    include: { items: true, assignedStore: true },
  });

  // Notify User
  await redis.publish('user-notifications', JSON.stringify({
    userId: updatedOrder.userId,
    event: 'order-packed',
    payload: updatedOrder
  }));

  return updatedOrder;
}
