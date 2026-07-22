import { useState, useCallback, useMemo } from 'react';
import type { FreshnessFilterValue } from '@quicky/ui-kit';
import type { ProductQueryParams } from '@quicky/api-client';

/**
 * Rohini pilot default coordinates (hardcoded for MVP).
 * Real geolocation will be swapped in later without architectural changes.
 */
export const ROHINI_LAT = 28.7495;
export const ROHINI_LNG = 77.0565;

export interface ProductFilters {
  freshness: FreshnessFilterValue;
  categoryId: string | null;
  search: string;
}

/**
 * Hook managing filter state for the customer browse screen.
 * Composes local filter state into ProductQueryParams for the API.
 */
export function useProductFilters() {
  const [freshness, setFreshness] = useState<FreshnessFilterValue>('ANY');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const queryParams: ProductQueryParams = useMemo(
    () => ({
      lat: ROHINI_LAT,
      lng: ROHINI_LNG,
      radiusKm: 3,
      freshness: freshness === 'ANY' ? undefined : freshness,
      categoryId: categoryId ?? undefined,
      search: search.trim() || undefined,
    }),
    [freshness, categoryId, search]
  );

  const resetFilters = useCallback(() => {
    setFreshness('ANY');
    setCategoryId(null);
    setSearch('');
  }, []);

  return {
    // State
    freshness,
    categoryId,
    search,
    // Setters
    setFreshness,
    setCategoryId,
    setSearch,
    resetFilters,
    // Composed query params for useProducts
    queryParams,
  };
}
