import { getApiClient } from './client';
import { OrderResult } from './checkout';

export async function fetchCustomerOrders(customerId: string): Promise<OrderResult[]> {
  const client = getApiClient();
  const { data } = await client.get<{ data: OrderResult[] }>(`/orders/customer/${customerId}`);
  return data.data;
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
  const client = getApiClient();
  const { data } = await client.post<{ success: boolean; message: string }>(`/orders/${orderId}/cancel`);
  return data;
}
