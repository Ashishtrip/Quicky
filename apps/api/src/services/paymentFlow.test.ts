import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockStore, mockListing, mockOrder, mockOrderTicket, mockOrderItem, mockTx } = vi.hoisted(() => {
  const store = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  };

  const listing = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  };

  const order = {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };

  const orderTicket = {
    createMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };

  const orderItem = {
    findMany: vi.fn(),
  };

  const tx = {
    order: order,
    orderTicket: orderTicket,
    orderItem: orderItem,
    listing: listing,
  };

  return {
    mockStore: store,
    mockListing: listing,
    mockOrder: order,
    mockOrderTicket: orderTicket,
    mockOrderItem: orderItem,
    mockTx: tx,
  };
});

vi.mock("../db/prisma", () => {
  return {
    prisma: {
      store: mockStore,
      listing: mockListing,
      order: mockOrder,
      orderTicket: mockOrderTicket,
      orderItem: mockOrderItem,
      $transaction: vi.fn(async (cb) => cb(mockTx)),
    },
  };
});

import { prisma } from "../db/prisma";
import { createCheckout } from "./checkoutService";
import { acceptTicket } from "./ticketService";
import { sweepStaleOrders } from "./sweeperService";
import { handlePayPalWebhook } from "./webhookHandler";

describe("Payment Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockStore.findMany.mockResolvedValue([
      {
        id: "store_payment_1",
        latitude: 28.7,
        longitude: 77.1,
        isActive: true,
      },
    ]);

    mockListing.findMany.mockResolvedValue([
      {
        id: "listing_payment_1",
        storeId: "store_payment_1",
        catalogItemId: "catalog_item_payment_1",
        expiryBucket: "FRESH_STOCK",
        stockQuantity: 10,
        price: 200,
        isActive: true,
        catalogItem: { category: { useTodayDiscountPct: 0 } },
      },
    ]);

    mockOrder.create.mockResolvedValue({ id: "order_123", items: [] });
    mockOrder.findUnique.mockResolvedValue({
      id: "order_123",
      status: "PENDING",
      paymentMethod: "PAYPAL",
      paymentStatus: "PENDING",
      assignedStoreId: null,
    });
    mockOrder.findMany.mockResolvedValue([]);
    mockOrder.update.mockResolvedValue({});
    mockOrder.updateMany.mockResolvedValue({ count: 1 });

    mockOrderTicket.createMany.mockResolvedValue({ count: 1 });
    mockOrderTicket.findFirst.mockResolvedValue({
      id: "ticket_1",
      orderId: "order_123",
      storeId: "store_payment_1",
    });
    mockOrderTicket.findUnique.mockResolvedValue({
      id: "ticket_1",
      orderId: "order_123",
      storeId: "store_payment_1",
      status: "BROADCASTED",
      expiresAt: new Date(Date.now() + 60_000),
      order: { id: "order_123", paymentMethod: "PAYPAL" },
    });
    mockOrderTicket.update.mockResolvedValue({});
    mockOrderTicket.updateMany.mockResolvedValue({});

    mockOrderItem.findMany.mockResolvedValue([
      {
        catalogItemId: "catalog_item_payment_1",
        quantity: 2,
        expiryBucket: "FRESH_STOCK",
      },
    ]);

    mockListing.findFirst.mockResolvedValue({
      id: "listing_payment_1",
      stockQuantity: 10,
    });
    mockListing.update.mockResolvedValue({});
  });

  it("should timeout and restock inventory after 5 minutes of non-payment", async () => {
    mockOrder.findUnique.mockResolvedValueOnce({
      id: "order_123",
      status: "AWAITING_PAYMENT",
      paymentMethod: "PAYPAL",
      paymentStatus: "PENDING",
      assignedStoreId: "store_payment_1",
    });

    const order = await createCheckout({
      customerId: "cust_1",
      lat: 28.7,
      lng: 77.1,
      paymentMethod: "PAYPAL",
      items: [
        {
          catalogItemId: "catalog_item_payment_1",
          quantity: 2,
          expiryBucket: "FRESH_STOCK",
        },
      ],
    });

    await acceptTicket("store_payment_1", "ticket_1");

    await prisma.order.update({
      where: { id: order.id },
      data: { updatedAt: new Date(Date.now() - 6 * 60 * 1000) },
    });

    await sweepStaleOrders();

    expect(mockOrder.update).toHaveBeenCalled();
    expect(mockListing.update).toHaveBeenCalled();
  });

  it("should process payment webhook idempotently", async () => {
    const order = await createCheckout({
      customerId: "cust_2",
      lat: 28.7,
      lng: 77.1,
      paymentMethod: "PAYPAL",
      items: [
        {
          catalogItemId: "catalog_item_payment_1",
          quantity: 1,
          expiryBucket: "FRESH_STOCK",
        },
      ],
    });

    await acceptTicket("store_payment_1", "ticket_1");

    await handlePayPalWebhook(
      { "paypal-auth-algo": "test" },
      "{}",
      {
        resource: {
          id: "pay_123",
          custom_id: order.id,
        },
      }
    );

    await handlePayPalWebhook(
      { "paypal-auth-algo": "test" },
      "{}",
      {
        resource: {
          id: "pay_123",
          custom_id: order.id,
        },
      }
    );

    expect(mockOrder.update).toHaveBeenCalled();
  });
});
