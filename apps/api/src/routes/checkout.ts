import { Router } from "express";
import { createCheckout } from "../services/checkoutService";

export const checkoutRouter = Router();

checkoutRouter.post("/", async (req, res) => {
  try {
    const { customerId, items, lat, lng, radiusKm, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const normalizedPaymentMethod = paymentMethod ?? "COD";
    if (!["COD", "PAYPAL"].includes(normalizedPaymentMethod)) {
      return res.status(400).json({ error: "Unsupported payment method." });
    }

    if (!customerId || customerId === "guest") {
      return res.status(401).json({ error: "User must be logged in to checkout." });
    }

    const order = await createCheckout({
      customerId,
      items,
      lat: Number(lat),
      lng: Number(lng),
      radiusKm: radiusKm ? Number(radiusKm) : 3,
      paymentMethod: normalizedPaymentMethod,
    });

    res.status(201).json({ data: order });
  } catch (error: any) {
    console.error("Checkout error:", error);
  res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});
