import { Router, Request, Response } from "express";
import { prisma } from "../db/prisma";

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
