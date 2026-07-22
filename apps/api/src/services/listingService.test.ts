import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStoreListings, upsertListing } from './listingService';
import { prisma } from '../db/prisma';

// Mock Prisma Client
vi.mock('../db/prisma', () => ({
  prisma: {
    listing: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe('listingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStoreListings', () => {
    it('should return listings for a given storeId', async () => {
      const mockListings = [
        { id: '1', storeId: 'store-1', price: 100, stockQuantity: 10, expiryBucket: 'FRESH_STOCK' }
      ];
      (prisma.listing.findMany as any).mockResolvedValue(mockListings);

      const result = await getStoreListings('store-1');

      expect(prisma.listing.findMany).toHaveBeenCalledWith({
        where: { storeId: 'store-1' },
        include: { catalogItem: true }
      });
      expect(result).toEqual(mockListings);
    });
  });

  describe('upsertListing', () => {
    it('should upsert a listing with the correct parameters', async () => {
      const mockListing = {
        storeId: 'store-1',
        catalogItemId: 'item-1',
        price: 90,
        stockQuantity: 5,
        expiryBucket: 'USE_TODAY',
        lastConfirmedAt: new Date()
      };
      (prisma.listing.upsert as any).mockResolvedValue(mockListing);

      const data = { price: 90, stockQuantity: 5, expiryBucket: 'USE_TODAY' };
      const result = await upsertListing('store-1', 'item-1', data);

      expect(prisma.listing.upsert).toHaveBeenCalledTimes(1);
      
      const callArgs = (prisma.listing.upsert as any).mock.calls[0][0];
      expect(callArgs.where).toEqual({
        storeId_catalogItemId: { storeId: 'store-1', catalogItemId: 'item-1' }
      });
      expect(callArgs.update.price).toBe(90);
      expect(callArgs.create.expiryBucket).toBe('USE_TODAY');
      
      expect(result).toEqual(mockListing);
    });
  });
});
