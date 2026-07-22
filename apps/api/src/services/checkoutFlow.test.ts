import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to mock prisma
vi.mock("../db/prisma", () => {
  const mockTx = {
    order: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
    orderTicket: {
      createMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
    },
    listing: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };

  return {
    prisma: {
      store: {
        findMany: vi.fn(),
      },
      listing: {
        findMany: vi.fn(),
      },
      orderTicket: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        return cb(mockTx);
      }),
      // export mockTx so we can inspect it in tests
      _mockTx: mockTx,
    },
  };
});

import { prisma } from "../db/prisma";
import { createCheckout } from "./checkoutService";
import { acceptTicket } from "./ticketService";

describe("E2E Ticket Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should complete full checkout to broadcast to accept flow", async () => {
    const mockStoreFindMany = prisma.store.findMany as ReturnType<typeof vi.fn>;
    const mockListingFindMany = prisma.listing.findMany as ReturnType<
      typeof vi.fn
    >;

    // @ts-ignore
    const mockTx = prisma._mockTx;

    // 1. Setup mock stores nearby
    mockStoreFindMany.mockResolvedValue([
      { id: "store-1", latitude: 28.7, longitude: 77.1, isActive: true },
      { id: "store-2", latitude: 28.71, longitude: 77.11, isActive: true },
    ]);

    // 2. Setup mock listings (both stores have the item)
    mockListingFindMany.mockResolvedValue([
      {
        id: "list-1",
        storeId: "store-1",
        catalogItemId: "item-a",
        price: 100,
        stockQuantity: 5,
        expiryBucket: "FRESH_STOCK",
        catalogItem: { category: { useTodayDiscountPct: 0 } },
      },
      {
        id: "list-2",
        storeId: "store-2",
        catalogItemId: "item-a",
        price: 100,
        stockQuantity: 5,
        expiryBucket: "FRESH_STOCK",
        catalogItem: { category: { useTodayDiscountPct: 0 } },
      },
    ]);

    // Mock tx.order.create
    mockTx.order.create.mockResolvedValue({ id: "order-123" });
    mockTx.orderTicket.createMany.mockResolvedValue({ count: 2 });

    // --- STEP 1: Customer Checkout ---
    const orderResult = await createCheckout({
      customerId: "user-1",
      lat: 28.705,
      lng: 77.105,
      paymentMethod: "COD",
      items: [
        { catalogItemId: "item-a", quantity: 2, expiryBucket: "FRESH_STOCK" },
      ],
    });

    expect(orderResult).toBeDefined();
    expect(orderResult.id).toBe("order-123");
    expect(mockTx.order.create).toHaveBeenCalled();
    expect(mockTx.orderTicket.createMany).toHaveBeenCalled();

    // The order and 2 tickets were created.
    // --- STEP 2: Store 1 accepts ticket ---

    // Mock the ticket
    mockTx.orderTicket.findUnique.mockResolvedValue({
      id: "ticket-1",
      orderId: "order-123",
      storeId: "store-1",
      status: "BROADCASTED",
      expiresAt: new Date(Date.now() + 100000),
    });

    // Mock updateMany for concurrency check (store wins)
    mockTx.order.updateMany.mockResolvedValue({ count: 1 });

    // Mock order items for inventory decrement
    mockTx.orderItem.findMany.mockResolvedValue([
      { catalogItemId: "item-a", quantity: 2, expiryBucket: "FRESH_STOCK" },
    ]);
    mockTx.listing.findFirst.mockResolvedValue({
      id: "list-1",
      stockQuantity: 5,
    });

    // Final order returned
    mockTx.order.findUnique.mockResolvedValue({
      id: "order-123",
      status: "ACCEPTED",
      assignedStoreId: "store-1",
    });

    const finalOrder = await acceptTicket("store-1", "ticket-1");

    expect(finalOrder).not.toBeNull();
    if (!finalOrder)
      throw new Error("Expected final order after ticket acceptance");

    expect(finalOrder.assignedStoreId).toBe("store-1");
    expect(finalOrder.status).toBe("ACCEPTED");

    // Verify ticket updates
    expect(mockTx.orderTicket.update).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { status: "ACCEPTED" },
    });

    expect(mockTx.orderTicket.updateMany).toHaveBeenCalledWith({
      where: { orderId: "order-123", id: { not: "ticket-1" } },
      data: { status: "MISSED" },
    });

    // Verify stock decrement
    expect(mockTx.listing.update).toHaveBeenCalledWith({
      where: { id: "list-1" },
      data: { stockQuantity: 3 },
    });

    // --- STEP 3: Store 2 tries to accept but is too late ---
    mockTx.orderTicket.findUnique.mockResolvedValue({
      id: "ticket-2",
      orderId: "order-123",
      storeId: "store-2",
      status: "BROADCASTED",
      expiresAt: new Date(Date.now() + 100000),
    });

    // Mock updateMany for concurrency check (returns 0 because order is no longer PENDING)
    mockTx.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(acceptTicket("store-2", "ticket-2")).rejects.toThrow(
      "Too late!",
    );

    // Store 2's ticket gets marked as MISSED
    expect(mockTx.orderTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket-2" },
        data: { status: "MISSED" },
      }),
    );
  });
});
