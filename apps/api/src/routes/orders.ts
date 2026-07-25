import { Router, Request, Response } from "express";
import { prisma } from "../db/prisma";
import { redis } from "../utils/redis";

export const ordersRouter = Router();

ordersRouter.get("/customer/:customerId", async (req: Request<{ customerId: string }>, res: Response) => {
  try {
    const { customerId } = req.params;

    if (!customerId || customerId === "guest") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orders = await prisma.order.findMany({
      where: { userId: customerId },
      include: {
        items: {
          include: {
            catalogItem: true,
          }
        },
        delivery: true,
        assignedStore: {
          select: {
            name: true,
            latitude: true,
            longitude: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ data: orders });
  } catch (error: any) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

ordersRouter.post("/:orderId/cancel", async (req: Request<{ orderId: string }>, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "PENDING" && order.status !== "ACCEPTED") {
      return res.status(400).json({ error: `Cannot cancel order in status: ${order.status}` });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    // Fetch all stores that received a ticket for this order
    const tickets = await prisma.orderTicket.findMany({
      where: { orderId: orderId },
      select: { storeId: true, id: true }
    });

    // Mark tickets as missed or cancelled
    await prisma.orderTicket.updateMany({
      where: { orderId: orderId },
      data: { status: "MISSED" } // or "DECLINED" 
    });

    // Notify any store that might be viewing this ticket
    for (const ticket of tickets) {
      await redis.publish("store-notifications", JSON.stringify({
        storeId: ticket.storeId,
        event: "ticket-cancelled",
        payload: { orderId: orderId, ticketId: ticket.id }
      }));
    }

    return res.status(200).json({ data: updatedOrder });
  } catch (error: any) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});
