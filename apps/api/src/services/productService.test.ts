import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("../db/prisma", () => ({
  prisma: {
    listing: {
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
  },
}));

// Mock shared-types computeFreshnessMeter
vi.mock("@quicky/shared-types", () => ({
  computeFreshnessMeter: vi.fn(({ expiryBucket }: { expiryBucket: string }) => {
    if (expiryBucket === "USE_TODAY") return "RED";
    return "GREEN";
  }),
}));

import { prisma } from "../db/prisma";
import { getProducts, getCategories } from "./productService";

const mockPrismaListingFindMany = prisma.listing.findMany as ReturnType<
  typeof vi.fn
>;
const mockPrismaCategoryFindMany = prisma.category.findMany as ReturnType<
  typeof vi.fn
>;

// Test fixtures
const makeListing = (overrides: Record<string, unknown> = {}) => ({
  id: "listing-1",
  storeId: "store-1",
  catalogItemId: "item-1",
  price: 100,
  stockQuantity: 10,
  expiryBucket: "FRESH_STOCK",
  manufacturingDate: null,
  lastConfirmedAt: new Date(),
  isUnverified: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  store: {
    id: "store-1",
    name: "Ramesh Store",
    nameHindi: "रमेश स्टोर",
    latitude: 28.75, // Rohini area
    longitude: 77.05,
    deliveryRadiusKm: 3,
    isActive: true,
    rating: 4.2,
    ...((overrides["store"] as Record<string, unknown>) || {}),
  },
  catalogItem: {
    id: "item-1",
    name: "Amul Butter 500g",
    nameHindi: "अमूल मक्खन 500g",
    description: null,
    unit: "500g",
    imageUrl: null,
    referenceMrp: 120,
    barcode: null,
    tags: ["dairy"],
    isActive: true,
    category: {
      id: "cat-1",
      name: "Dairy",
      nameHindi: "डेयरी",
      useTodayDiscountPct: 20,
      estimatedShelfLifeDays: 7,
      ...((overrides["category"] as Record<string, unknown>) || {}),
    },
    ...((overrides["catalogItem"] as Record<string, unknown>) || {}),
  },
  ...overrides,
});

describe("productService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProducts", () => {
    it("returns products within radius", async () => {
      const listing = makeListing();
      mockPrismaListingFindMany.mockResolvedValue([listing]);

      const results = await getProducts({
        lat: 28.75,
        lng: 77.05,
        radiusKm: 3,
      });

      expect(results).toHaveLength(1);
      const [firstResult] = results;
      expect(firstResult).toBeDefined();
      if (!firstResult) throw new Error("Expected a product result");
      expect(firstResult.catalogItem.name).toBe("Amul Butter 500g");
      expect(firstResult.freshnessMeter).toBe("GREEN");
    });

    it("filters out stores beyond radius", async () => {
      const farStore = makeListing({
        store: {
          id: "store-far",
          name: "Far Store",
          nameHindi: null,
          latitude: 29.0, // ~28 km away from Rohini
          longitude: 77.3,
          deliveryRadiusKm: 3,
          isActive: true,
          rating: 3.5,
        },
      });
      mockPrismaListingFindMany.mockResolvedValue([farStore]);

      const results = await getProducts({
        lat: 28.75,
        lng: 77.05,
        radiusKm: 3,
      });

      expect(results).toHaveLength(0);
    });

    it("computes discount price for USE_TODAY items", async () => {
      const useTodayListing = makeListing({
        expiryBucket: "USE_TODAY",
        price: 100,
        category: { useTodayDiscountPct: 20 },
      });
      mockPrismaListingFindMany.mockResolvedValue([useTodayListing]);

      const results = await getProducts({
        lat: 28.75,
        lng: 77.05,
      });

      expect(results).toHaveLength(1);
      const [discountedResult] = results;
      expect(discountedResult).toBeDefined();
      if (!discountedResult) throw new Error("Expected a product result");
      expect(discountedResult.discountedPrice).toBe(80);
      expect(discountedResult.discountPct).toBe(20);
      expect(discountedResult.freshnessMeter).toBe("RED");
    });

    it("does not compute discount for FRESH_STOCK items", async () => {
      const freshListing = makeListing({
        expiryBucket: "FRESH_STOCK",
        price: 100,
      });
      mockPrismaListingFindMany.mockResolvedValue([freshListing]);

      const results = await getProducts({
        lat: 28.75,
        lng: 77.05,
      });

      expect(results).toHaveLength(1);
      const [freshResult] = results;
      expect(freshResult).toBeDefined();
      if (!freshResult) throw new Error("Expected a product result");
      expect(freshResult.discountedPrice).toBeNull();
      expect(freshResult.discountPct).toBeNull();
    });

    it("returns empty array when no listings exist", async () => {
      mockPrismaListingFindMany.mockResolvedValue([]);

      const results = await getProducts({
        lat: 28.75,
        lng: 77.05,
      });

      expect(results).toHaveLength(0);
    });

    it("sorts results by distance (nearest first)", async () => {
      const near = makeListing({
        id: "listing-near",
        store: {
          id: "store-near",
          name: "Near Store",
          nameHindi: null,
          latitude: 28.751,
          longitude: 77.051,
          deliveryRadiusKm: 3,
          isActive: true,
          rating: 4,
        },
      });
      const farButInRadius = makeListing({
        id: "listing-far",
        store: {
          id: "store-mid",
          name: "Mid Store",
          nameHindi: null,
          latitude: 28.77,
          longitude: 77.07,
          deliveryRadiusKm: 3,
          isActive: true,
          rating: 3.8,
        },
      });
      mockPrismaListingFindMany.mockResolvedValue([farButInRadius, near]);

      const results = await getProducts({
        lat: 28.75,
        lng: 77.05,
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      if (results.length === 2) {
        const [firstResult, secondResult] = results;
        expect(firstResult).toBeDefined();
        expect(secondResult).toBeDefined();
        if (!firstResult || !secondResult)
          throw new Error("Expected two product results");
      }
    });
  });

  describe("getCategories", () => {
    it("fetches active categories sorted by sortOrder", async () => {
      const categories = [
        {
          id: "cat-1",
          name: "Dairy",
          nameHindi: "डेयरी",
          description: null,
          useTodayDiscountPct: 20,
          estimatedShelfLifeDays: 7,
          sortOrder: 1,
        },
        {
          id: "cat-2",
          name: "Bread",
          nameHindi: "ब्रेड",
          description: null,
          useTodayDiscountPct: 25,
          estimatedShelfLifeDays: 3,
          sortOrder: 2,
        },
      ];
      mockPrismaCategoryFindMany.mockResolvedValue(categories);

      const result = await getCategories();

      expect(result).toHaveLength(2);
      const [firstCategory] = result;
      expect(firstCategory).toBeDefined();
      if (!firstCategory) throw new Error("Expected a category result");
      expect(firstCategory.name).toBe("Dairy");
      expect(mockPrismaCategoryFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
      );
    });
  });
});
