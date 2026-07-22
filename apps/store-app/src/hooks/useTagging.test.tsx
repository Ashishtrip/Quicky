import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('@react-native-firebase/app', () => ({
  app: jest.fn(),
  apps: [],
}));
jest.mock('@react-native-firebase/firestore', () => () => ({
  collection: jest.fn(() => ({
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ docs: [] }))
    }))
  })),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
}));

import { useTagging, useStoreListings, useCatalog } from './useTagging';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      gcTime: 0,
    },
  },
});

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTagging hooks', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    queryClient.clear();
  });

  describe('useCatalog', () => {
    it('fetches catalog successfully', async () => {
      const mockData = [{ id: '1', name: 'Milk' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useCatalog(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/catalog');
    });
  });

  describe('useStoreListings', () => {
    it('fetches store listings successfully', async () => {
      const mockData = [{ id: '1', storeId: 'store-123' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useStoreListings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/stores/store-123/listings');
    });
  });

  describe('useTagging', () => {
    it('mutates data successfully', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTagging(), {
        wrapper: createWrapper(),
      });

      const mutationData = {
        catalogItemId: 'item-1',
        price: 100,
        stockQuantity: 10,
        expiryBucket: 'USE_TODAY',
      };

      result.current.mutate(mutationData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/stores/store-123/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mutationData),
      });
    });

    it('mutates data successfully without optional price', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTagging(), {
        wrapper: createWrapper(),
      });

      const mutationData = {
        catalogItemId: 'item-2',
        stockQuantity: 5,
        expiryBucket: 'FRESH_STOCK',
      };

      result.current.mutate(mutationData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/stores/store-123/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mutationData),
      });
    });
  });
});
