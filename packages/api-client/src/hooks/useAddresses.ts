import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAddresses, createAddress, updateAddress, deleteAddress, Address, CreateAddressInput, UpdateAddressInput } from '../addresses';

export const useAddresses = (userId?: string) => {
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: () => fetchAddresses(userId as string),
    enabled: !!userId,
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAddressInput) => createAddress(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAddressInput) => updateAddress(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', data.userId] });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string, userId: string }) => {
      await deleteAddress(id);
      return { id, userId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', data.userId] });
    },
  });
};
