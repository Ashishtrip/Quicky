import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptTicket, declineTicket, packTicket, readyTicket, deliverTicket } from '../tickets';
import { OrderResult } from '../checkout';

export function useTicketActions(storeId: string) {
  const queryClient = useQueryClient();

  const accept = useMutation<OrderResult, Error, string>({
    mutationFn: (ticketId) => acceptTicket(storeId, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', storeId] });
    },
  });

  const decline = useMutation<void, Error, string>({
    mutationFn: (ticketId) => declineTicket(storeId, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', storeId] });
    },
  });

  const pack = useMutation<OrderResult, Error, string>({
    mutationFn: (ticketId) => packTicket(storeId, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', storeId] });
    },
  });

  const ready = useMutation<OrderResult, Error, string>({
    mutationFn: (ticketId) => readyTicket(storeId, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', storeId] });
    },
  });

  const deliver = useMutation<OrderResult, Error, string>({
    mutationFn: (ticketId) => deliverTicket(storeId, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', storeId] });
    },
  });

  return { accept, decline, pack, ready, deliver };
}
