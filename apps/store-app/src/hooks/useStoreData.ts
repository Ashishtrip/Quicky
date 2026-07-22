import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useAuthStore } from '../stores/authStore';
import { updateStoreProfile } from '@quicky/api-client';
import * as Location from 'expo-location';

export interface StoreData {
  name: string;
  isOpen: boolean;
  deliveryRadius: number; // in meters (e.g., 250 to 2500)
  address?: string;
  latitude?: number;
  longitude?: number;
  ownerName?: string;
  phone?: string;
  contactEmail?: string;
  gstNumber?: string;
}

export const useStoreData = () => {
  const { user } = useAuthStore();
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStoreData(null);
      setLoading(false);
      return;
    }

    const subscriber = firestore()
      .collection('stores')
      .doc(user.uid)
      .onSnapshot(
        (documentSnapshot) => {
          if (documentSnapshot.exists()) {
            setStoreData(documentSnapshot.data() as StoreData);
          } else {
            setStoreData(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching store data: ", error);
          setLoading(false);
        }
      );

    return () => subscriber();
  }, [user]);

  const updateStore = async (updates: Partial<StoreData>) => {
    if (!user) return;
    try {
      // Remove undefined fields to prevent Firestore errors
      const cleanUpdates: Partial<StoreData> = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(cleanUpdates).length === 0) return;

      // Update backend via API (syncs to Prisma and Redis Geo Set)
      await updateStoreProfile(user.uid, cleanUpdates);

      // Also update Firestore for real-time UI state
      await firestore().collection('stores').doc(user.uid).set(cleanUpdates, { merge: true });
    } catch (error) {
      console.error("Error updating store data: ", error);
      throw error;
    }
  };

  return { storeData, loading, updateStore };
};
