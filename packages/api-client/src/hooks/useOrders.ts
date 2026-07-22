import { useQuery } from '@tanstack/react-query';
import { fetchCustomerOrders } from '../orders';
import { OrderResult } from '../checkout';

export function useCustomerOrders(customerId: string | undefined) {
  return useQuery<OrderResult[], Error>({
    queryKey: ['orders', customerId],
    queryFn: () => {
      if (!customerId) throw new Error('Customer ID is required');
      return fetchCustomerOrders(customerId);
    },
    enabled: !!customerId,
  });
}
