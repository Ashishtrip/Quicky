import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initApiClient } from '@quicky/api-client';
import { useCartStore } from './stores/cartStore';
import { useAuthStore } from './stores/authStore';
import { AppNavigator } from './navigation/AppNavigator';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const envApiUrl = process.env['EXPO_PUBLIC_API_URL'];
let API_BASE_URL = envApiUrl || 'https://quicky-production.up.railway.app';
if (API_BASE_URL && !API_BASE_URL.startsWith('http')) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}
API_BASE_URL = API_BASE_URL.replace(/\/$/, '');
if (!__DEV__ && (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('10.0.2.2'))) {
  API_BASE_URL = 'https://quicky-production.up.railway.app';
}
if (!__DEV__ && API_BASE_URL.startsWith('http://') && !API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('10.0.2.2')) {
  API_BASE_URL = API_BASE_URL.replace('http://', 'https://');
}

initApiClient({ baseUrl: API_BASE_URL });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(true);
  const { isLoading: isAuthLoading, setUser, setLoading, setIsOnboarded } = useAuthStore();

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        // Always mark as onboarded — profile completion is optional
        setIsOnboarded(true);
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (!(typeof userDoc.exists === 'function' ? userDoc.exists() : userDoc.exists)) {
            // Auto-create a minimal user doc for new sign-ups
            await firestore().collection('users').doc(user.uid).set({
              name: user.displayName || '',
              email: user.email || '',
              phone: user.phoneNumber || '',
              role: 'customer',
              isOnboarded: true,
              createdAt: firestore.FieldValue.serverTimestamp(),
            });
          }
        } catch (e) {
          console.error('Error syncing user doc:', e);
        }
      }
      setLoading(false);
    });

    return subscriber;
  }, [setUser, setLoading, setIsOnboarded]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <AppNavigator isReady={isReady} isAuthLoading={isAuthLoading} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
