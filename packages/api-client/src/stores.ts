import { getApiClient } from './client';

export interface SalesMetricsResult {
  fulfilledOrders: number;
  nearExpirySold: number;
  todayEarnings: number;
}

export const fetchSalesMetrics = async (
  storeId: string,
  startDate?: string,
  endDate?: string
): Promise<SalesMetricsResult> => {
  const client = getApiClient();
  
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  
  const response = await client.get(`/stores/${storeId}/sales-metrics${queryString}`);
  return response.data;
};

export interface StoreProfileUpdate {
  isOpen?: boolean;
  deliveryRadius?: number;
  latitude?: number;
  longitude?: number;
  name?: string;
  address?: string;
  phone?: string;
  ownerName?: string;
  ownerPhone?: string;
  contactEmail?: string;
  contactPhone?: string;
  gstNumber?: string;
}

export const updateStoreProfile = async (storeId: string, updates: StoreProfileUpdate) => {
  const client = getApiClient();
  const response = await client.patch(`/stores/${storeId}`, updates);
  return response.data;
};

export const fetchWeeklyVolume = async (
  storeId: string,
  weekStart: string,
  weekEnd: string
): Promise<number[]> => {
  const client = getApiClient();
  
  const params = new URLSearchParams();
  params.append('weekStart', weekStart);
  params.append('weekEnd', weekEnd);
  
  const response = await client.get(`/stores/${storeId}/weekly-volume?${params.toString()}`);
  return response.data;
};
