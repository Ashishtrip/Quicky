import { getApiClient } from './client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileInput {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
}

/**
 * Fetch a user profile by ID
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const client = getApiClient();
  const response = await client.get<UserProfile>(`/users/${userId}`);
  return response.data;
}

/**
 * Update (or create) a user profile
 */
export async function updateUserProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
  const client = getApiClient();
  const response = await client.post<UserProfile>('/users/profile', input);
  return response.data;
}
