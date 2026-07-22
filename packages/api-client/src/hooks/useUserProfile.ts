import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserProfile, updateUserProfile, UpdateUserProfileInput, UserProfile } from '../users';

export const USER_PROFILE_QUERY_KEY = 'userProfile';

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: [USER_PROFILE_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');
      try {
        return await fetchUserProfile(userId);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return null; // Return null for missing user profile
        }
        throw error;
      }
    },
    enabled: !!userId,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserProfileInput) => updateUserProfile(input),
    onSuccess: (data) => {
      queryClient.setQueryData([USER_PROFILE_QUERY_KEY, data.id], data);
    },
  });
}
