import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FreshnessState } from '@quicky/ui-kit';
import { firebaseStorage } from '../utils/firebaseStorage';

export interface CartItem {
  id: string; // Composite key: catalogItemId + expiryBucket
  catalogItemId: string;
  productName: string;
  unit: string;
  price: number;
  discountedPrice: number | null;
  discountPct: number;
  expiryBucket: 'USE_TODAY' | 'FRESH_STOCK';
  freshnessMeter: FreshnessState;
  quantity: number;
  imageUrl: string | null;
}

export interface CartStore {
  items: CartItem[];

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  // Read-only selectors — implemented as getters via helper functions
}

/**
 * Cart is now generic. Stores are assigned post-checkout via broadcast.
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const { items } = get();

        // Check if item already exists in cart
        const existingIndex = items.findIndex(
          (item) => item.id === newItem.id
        );

        if (existingIndex >= 0) {
          const item = items[existingIndex];
          if (!item) return true;
          // Increment quantity
          const updated = [...items];
          updated[existingIndex] = {
            ...item,
            quantity: item.quantity + 1,
          };
          set({ items: updated });
        } else {
          // Add new item with quantity 1
          set({ items: [...items, { ...newItem, quantity: 1 }] });
        }

        return true;
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          // Remove if quantity is 0 or less
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          }));
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'quicky-cart',
      storage: createJSONStorage(() => firebaseStorage),
      skipHydration: true, // We will manually hydrate after Firebase Auth is ready
    }
  )
);

// ─── Selector helpers (derived state) ──────────────────────────────

export function selectUseTodayItems(state: CartStore): CartItem[] {
  return state.items.filter((item) => item.expiryBucket === 'USE_TODAY');
}

export function selectFreshStockItems(state: CartStore): CartItem[] {
  return state.items.filter((item) => item.expiryBucket === 'FRESH_STOCK');
}

export function selectSubtotal(state: CartStore): number {
  return state.items.reduce((total, item) => {
    const unitPrice = item.discountedPrice ?? item.price;
    return total + unitPrice * item.quantity;
  }, 0);
}

export function selectDiscountTotal(state: CartStore): number {
  return state.items.reduce((total, item) => {
    if (item.discountedPrice != null && item.discountPct > 0) {
      const saving = (item.price - item.discountedPrice) * item.quantity;
      return total + saving;
    }
    return total;
  }, 0);
}

export function selectItemCount(state: CartStore): number {
  return state.items.reduce((count, item) => count + item.quantity, 0);
}
