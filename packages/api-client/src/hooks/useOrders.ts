import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCustomerOrders, cancelOrder } from '../orders';
import { OrderResult } from '../checkout';

export function useCustomerOrders(customerId: string | undefined, options?: { refetchInterval?: number }) {
  return useQuery<OrderResult[], Error>({
    queryKey: ['orders', customerId],
    queryFn: () => {
      if (!customerId) throw new Error('Customer ID is required');
      return fetchCustomerOrders(customerId);
    },
    enabled: !!customerId,
    refetchInterval: options?.refetchInterval,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: () => {
      // Invalidate customer orders to refresh the list
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
