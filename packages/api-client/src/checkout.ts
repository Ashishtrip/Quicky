import { getApiClient } from './client';

export interface CheckoutItem {
  catalogItemId: string;
  quantity: number;
  expiryBucket: 'USE_TODAY' | 'FRESH_STOCK';
}

export interface CheckoutRequest {
  customerId: string;
  customerName?: string;
  deliveryAddress?: string;
  lat: number;
  lng: number;
  radiusKm?: number;
  paymentMethod: 'COD' | 'PAYPAL';
  items: CheckoutItem[];
}

export interface OrderResult {
  id: string;
  customerId: string;
  lat?: number;
  lng?: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  deliveryFee: number;
  createdAt: string;
  assignedStore?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  user?: {
    name: string;
    address: string;
  };
  delivery?: {
    deliveryStatus: string;
    estimatedDelivery?: string;
  };
  items?: {
    id: string;
    catalogItemId: string;
    quantity: number;
    price: number;
    discountedPrice?: number;
    expiryBucket: string;
    catalogItem?: {
      name: string;
      imageUrl?: string;
    };
  }[];
}

export async function createCheckout(req: CheckoutRequest): Promise<OrderResult> {
  const client = getApiClient();
  const { data } = await client.post<{ data: OrderResult }>('/checkout', req);
  return data.data;
}
