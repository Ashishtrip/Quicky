import { getApiClient } from './client';
import { OrderResult } from './checkout';

export async function fetchCustomerOrders(customerId: string): Promise<OrderResult[]> {
  const client = getApiClient();
  const { data } = await client.get<{ data: OrderResult[] }>(`/orders/customer/${customerId}`);
  return data.data;
}
