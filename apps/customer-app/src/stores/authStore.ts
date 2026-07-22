import { create } from 'zustand';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setIsOnboarded: (isOnboarded: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isOnboarded: false,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
}));
