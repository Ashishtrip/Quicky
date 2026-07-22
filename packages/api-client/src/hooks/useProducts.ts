import { useQuery } from '@tanstack/react-query';
import { fetchProducts, ProductQueryParams, ProductResult } from '../products';

/**
 * React Query hook to fetch products with filters.
 * Automatically refetches when params change.
 * Stale time of 30s balances freshness with performance on mid-range devices.
 */
export function useProducts(params: ProductQueryParams) {
  return useQuery<ProductResult[], Error>({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    staleTime: 30_000,
    // Don't refetch on window focus for mobile (saves battery)
    refetchOnWindowFocus: false,
    // Keep previous data while refetching for smoother filter transitions
    placeholderData: (previousData) => previousData,
  });
}
