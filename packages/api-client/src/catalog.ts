import { getApiClient } from './client';

export interface CategoryResult {
  id: string;
  name: string;
  nameHindi: string | null;
  description: string | null;
  useTodayDiscountPct: number;
  estimatedShelfLifeDays: number | null;
  sortOrder: number;
}

/**
 * Fetch all active categories sorted by sortOrder
 */
export async function fetchCategories(): Promise<CategoryResult[]> {
  const client = getApiClient();
  const { data } = await client.get<CategoryResult[]>('/catalog/categories');
  return data;
}
