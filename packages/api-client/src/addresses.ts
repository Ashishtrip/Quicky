import { getApiClient } from './client';

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput extends Partial<CreateAddressInput> {
  id: string;
}

export const fetchAddresses = async (userId: string): Promise<Address[]> => {
  const client = getApiClient();
  const response = await client.get(`/addresses/${userId}`);
  return response.data;
};

export const createAddress = async (data: CreateAddressInput): Promise<Address> => {
  const client = getApiClient();
  const response = await client.post('/addresses', data);
  return response.data;
};

export const updateAddress = async ({ id, ...data }: UpdateAddressInput): Promise<Address> => {
  const client = getApiClient();
  const response = await client.put(`/addresses/${id}`, data);
  return response.data;
};

export const deleteAddress = async (id: string): Promise<{ success: boolean }> => {
  const client = getApiClient();
  const response = await client.delete(`/addresses/${id}`);
  return response.data;
};
