import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

const envApiUrl = process.env['EXPO_PUBLIC_API_URL'];
let API_URL = envApiUrl || 'https://quicky-production.up.railway.app';
if (API_URL && !API_URL.startsWith('http')) {
  API_URL = `https://${API_URL}`;
}
API_URL = API_URL.replace(/\/$/, '');
if (!__DEV__ && (API_URL.includes('localhost') || API_URL.includes('10.0.2.2'))) {
  API_URL = 'https://quicky-production.up.railway.app';
}
if (!__DEV__ && API_URL.startsWith('http://') && !API_URL.includes('localhost') && !API_URL.includes('10.0.2.2')) {
  API_URL = API_URL.replace('http://', 'https://');
}
import { useAuthStore } from '../stores/authStore';
import auth from '@react-native-firebase/auth';

/**
 * Fetch the master catalog from the Express API.
 * Single source of truth — no Firestore merge.
 */
export const useCatalog = () => {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const token = await auth().currentUser?.getIdToken();
      const res = await fetch(`${API_URL}/catalog`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Failed to fetch catalog');
      return await res.json();
    },
  });
};

/**
 * Fetch this store's listings from the Express API.
 * Single source of truth — no Firestore merge.
 * Custom products are also here because useTagging writes them
 * to the API via upsertListing (which creates a CatalogItem + Listing).
 */
export const useStoreListings = () => {
  const user = useAuthStore(state => state.user);
  const STORE_ID = user!.uid;
  return useQuery({
    queryKey: ['listings', STORE_ID],
    queryFn: async () => {
      const token = await auth().currentUser?.getIdToken();
      const res = await fetch(`${API_URL}/stores/${STORE_ID}/listings`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Failed to fetch listings');
      return await res.json();
    },
  });
};

/**
 * Tag a product with expiry bucket and stock quantity.
 * Writes to Express API → Prisma/Postgres.
 * This is the single write path for both catalog and custom items.
 */
export const useTagging = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const STORE_ID = user!.uid;

  return useMutation({
    mutationFn: async (data: { catalogItemId: string, price?: number, stockQuantity: number, expiryBucket: string, isCustom?: boolean, name?: string, unit?: string, imageUrl?: string }) => {
      const token = await auth().currentUser?.getIdToken();
      const res = await fetch(`${API_URL}/stores/${STORE_ID}/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save listing');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', STORE_ID] });
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      // Record that a tag was made today
      const today = new Date().toISOString().split('T')[0]!;
      AsyncStorage.setItem('LAST_TAGGED_DATE', today).catch(() => {});
    },
  });
};

/**
 * Delete a listing.
 */
export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const STORE_ID = user!.uid;

  return useMutation({
    mutationFn: async (listingId: string) => {
      const token = await auth().currentUser?.getIdToken();
      const res = await fetch(`${API_URL}/stores/${STORE_ID}/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Failed to delete listing');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', STORE_ID] });
    },
  });
};

