import { useMutation } from '@tanstack/react-query';
import { createCheckout, CheckoutRequest, OrderResult } from '../checkout';

export function useCheckout() {
  return useMutation<OrderResult, Error, CheckoutRequest>({
    mutationFn: (req) => createCheckout(req),
  });
}
