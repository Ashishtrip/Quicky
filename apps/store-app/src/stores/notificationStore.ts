import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (notification: NotificationItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) => 
        set((state) => ({ 
          notifications: [notification, ...state.notifications] 
        })),
      markAsRead: (id) => 
        set((state) => ({
          notifications: state.notifications.map((n) => 
            n.id === id ? { ...n, read: true } : n
          )
        })),
      markAllAsRead: () => 
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true }))
        })),
      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
