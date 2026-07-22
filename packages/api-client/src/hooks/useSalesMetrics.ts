import { useQuery } from '@tanstack/react-query';
import { fetchSalesMetrics, SalesMetricsResult } from '../stores';

export const useSalesMetrics = (
  storeId: string | undefined,
  startDate?: string,
  endDate?: string
) => {
  return useQuery<SalesMetricsResult, Error>({
    queryKey: ['salesMetrics', storeId, startDate, endDate],
    queryFn: () => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }
      return fetchSalesMetrics(storeId, startDate, endDate);
    },
    enabled: !!storeId,
    retry: 2,
  });
};
