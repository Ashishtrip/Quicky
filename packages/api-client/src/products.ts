import { getApiClient } from './client';

export interface ProductQueryParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  freshness?: 'USE_TODAY' | 'FRESH_STOCK' | 'ANY';
  categoryId?: string;
  search?: string;
}

export interface ProductResult {
  catalogItem: {
    id: string;
    name: string;
    nameHindi: string | null;
    description: string | null;
    unit: string;
    imageUrl: string | null;
    referenceMrp: number | null;
    barcode: string | null;
    tags: string[];
  };
  category: {
    id: string;
    name: string;
    nameHindi: string | null;
    useTodayDiscountPct: number;
  };
  expiryBucket: 'USE_TODAY' | 'FRESH_STOCK';
  price: number;
  discountedPrice: number | null;
  discountPct: number | null;
  freshnessMeter: 'GREEN' | 'AMBER' | 'RED';
  totalStockQuantity: number;
}

/**
 * Fetch products near a customer location with optional filters
 */
export async function fetchProducts(params: ProductQueryParams): Promise<ProductResult[]> {
  const client = getApiClient();
  const { data } = await client.get<ProductResult[]>('/products', { params });
  return data;
}
