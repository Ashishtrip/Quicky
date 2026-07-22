import { useQuery } from '@tanstack/react-query';
import { fetchStoreTickets, OrderTicket } from '../tickets';

export function useTickets(storeId: string) {
  return useQuery<OrderTicket[], Error>({
    queryKey: ['tickets', storeId],
    queryFn: () => fetchStoreTickets(storeId),
    refetchInterval: 5000, // Poll every 5 seconds for MVP
    enabled: !!storeId,
  });
}
