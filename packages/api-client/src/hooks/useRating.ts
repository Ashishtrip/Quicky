import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitRating } from '../rating';
import { OrderResult } from '../checkout';

export function useSubmitRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, rating }: { orderId: string; rating: 'GOOD' | 'AVERAGE' | 'POOR' }) =>
      submitRating(orderId, rating),
    onSuccess: (updatedOrder: OrderResult) => {
      // Invalidate or update queries if needed
      // queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
