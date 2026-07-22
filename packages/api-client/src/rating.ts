import { getApiClient } from './client';
import { OrderResult } from './checkout';

export async function submitRating(orderId: string, rating: 'GOOD' | 'AVERAGE' | 'POOR'): Promise<OrderResult> {
  const api = getApiClient();
  const response = await api.post(`/orders/${orderId}/rating`, { rating });
  return response.data;
}
