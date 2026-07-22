import { useQuery } from '@tanstack/react-query';
import { fetchCategories, CategoryResult } from '../catalog';

/**
 * React Query hook to fetch categories.
 * Categories change rarely — 5 min stale time is fine.
 */
export function useCategories() {
  return useQuery<CategoryResult[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
