import { useQuery } from '@tanstack/react-query';
import { fetchWeeklyVolume } from '../stores';

export const useWeeklyVolume = (
  storeId: string | undefined,
  weekStart: string,
  weekEnd: string
) => {
  return useQuery<number[], Error>({
    queryKey: ['weeklyVolume', storeId, weekStart, weekEnd],
    queryFn: () => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }
      return fetchWeeklyVolume(storeId, weekStart, weekEnd);
    },
    enabled: !!storeId,
    retry: 2,
  });
};
