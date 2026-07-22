import { prisma } from "../db/prisma";
import { verifyPayPalWebhook } from "./paymentService";

export const handlePayPalWebhook = async (
  headers: Record<string, string>,
  bodyString: string,
  bodyObj: any,
) => {
  // 1. Verify IPN
  const isValid = await verifyPayPalWebhook(headers, bodyString);
  if (!isValid && process.env["NODE_ENV"] === "production") {
    throw new Error("Invalid PayPal webhook signature");
  }

  const resource = bodyObj.resource;
  const orderId =
    resource.custom_id || resource.purchase_units?.[0]?.reference_id;

  if (!orderId) throw new Error("No order reference found in PayPal webhook");

  // 2. Process idempotently
  await processPaymentSuccess(orderId, resource.id, "PAYPAL");
};

async function processPaymentSuccess(
  orderId: string,
  transactionId: string,
  method: string,
) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ 
      where: { id: orderId },
      include: { payment: true }
    });
    if (!order) {
      console.error(`Order ${orderId} not found for webhook`);
      return;
    }

    // Idempotency check
    if (order.payment?.paymentStatus === "PAID" || order.status === "ACCEPTED") {
      console.log(`Order ${orderId} already marked as PAID. Skipping.`);
      return;
    }

    // Capture the payment and advance order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "ACCEPTED",
        payment: {
          update: {
            paymentStatus: "PAID"
          }
        }
      },
    });

    console.log(`Payment confirmed for Order ${orderId} via ${method}`);
  });
}
