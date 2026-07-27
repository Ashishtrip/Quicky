import { getApiClient } from './client';
import { OrderResult } from './checkout';

export interface OrderTicket {
  id: string;
  orderId: string;
  storeId: string;
  status: 'BROADCASTED' | 'ACCEPTED' | 'MISSED' | 'DECLINED';
  expiresAt: string;
  createdAt: string;
  order: OrderResult & {
    items: {
      id: string;
      catalogItem: {
        name: string;
        nameHindi: string | null;
        imageUrl: string | null;
      };
      quantity: number;
      price: number;
      discountedPrice: number | null;
      expiryBucket: 'USE_TODAY' | 'FRESH_STOCK';
    }[];
  };
}

export async function fetchStoreTickets(storeId: string): Promise<OrderTicket[]> {
  const client = getApiClient();
  const { data } = await client.get<{ data: OrderTicket[] }>(`/tickets/store/${storeId}`);
  return data.data;
}

export async function acceptTicket(storeId: string, ticketId: string): Promise<OrderResult> {
  const client = getApiClient();
  const { data } = await client.post<{ data: OrderResult }>(`/tickets/${ticketId}/accept`, { storeId });
  return data.data;
}

export async function declineTicket(storeId: string, ticketId: string): Promise<void> {
  const client = getApiClient();
  await client.post(`/tickets/${ticketId}/decline`, { storeId });
}

export async function packTicket(storeId: string, ticketId: string): Promise<OrderResult> {
  const client = getApiClient();
  const { data } = await client.post<{ data: OrderResult }>(`/tickets/${ticketId}/pack`, { storeId });
  return data.data;
}

export async function readyTicket(storeId: string, ticketId: string): Promise<OrderResult> {
  const client = getApiClient();
  const { data } = await client.post<{ data: OrderResult }>(`/tickets/${ticketId}/ready`, { storeId });
  return data.data;
}

export async function deliverTicket(storeId: string, ticketId: string): Promise<OrderResult> {
  const client = getApiClient();
  const { data } = await client.post<{ data: OrderResult }>(`/tickets/${ticketId}/deliver`, { storeId });
  return data.data;
}
