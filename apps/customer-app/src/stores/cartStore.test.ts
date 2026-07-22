import { act } from '@testing-library/react-native';

jest.mock('@react-native-firebase/app', () => ({
  app: jest.fn(),
  apps: [],
}));
jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestoreInstance = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ data: () => null }),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const mockFirestore = jest.fn(() => mockFirestoreInstance);
  (mockFirestore as any).FieldValue = {
    serverTimestamp: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockFirestore,
  };
});
jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: { uid: 'test-user-123' },
}));

import {
  useCartStore,
  selectUseTodayItems,
  selectFreshStockItems,
  selectSubtotal,
  selectDiscountTotal,
  selectItemCount,
  CartItem,
} from './cartStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const makeCartItem = (
  overrides: Partial<Omit<CartItem, 'quantity'>> = {}
): Omit<CartItem, 'quantity'> => ({
  id: 'item-1_FRESH_STOCK',
  catalogItemId: 'item-1',
  productName: 'Amul Butter',
  unit: '500g',
  price: 100,
  discountedPrice: null,
  discountPct: 0,
  expiryBucket: 'FRESH_STOCK',
  freshnessMeter: 'GREEN',
  imageUrl: null,
  ...overrides,
});

describe('cartStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    act(() => {
      useCartStore.getState().clearCart();
    });
  });

  describe('addItem', () => {
    it('adds a new item with quantity 1', () => {
      const item = makeCartItem();

      act(() => {
        useCartStore.getState().addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]!.quantity).toBe(1);
      expect(state.items[0]!.productName).toBe('Amul Butter');
    });

    it('increments quantity if same id already in cart', () => {
      const item = makeCartItem();

      act(() => {
        useCartStore.getState().addItem(item);
        useCartStore.getState().addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]!.quantity).toBe(2);
    });
  });

  describe('removeItem', () => {
    it('removes an item by id', () => {
      act(() => {
        useCartStore.getState().addItem(makeCartItem({ id: 'a' }));
        useCartStore.getState().addItem(makeCartItem({ id: 'b', catalogItemId: 'item-2' }));
      });

      act(() => {
        useCartStore.getState().removeItem('a');
      });

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0]!.id).toBe('b');
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity of an item', () => {
      act(() => {
        useCartStore.getState().addItem(makeCartItem());
      });

      act(() => {
        useCartStore.getState().updateQuantity('item-1_FRESH_STOCK', 5);
      });

      expect(useCartStore.getState().items[0]!.quantity).toBe(5);
    });

    it('removes item if quantity set to 0', () => {
      act(() => {
        useCartStore.getState().addItem(makeCartItem());
      });

      act(() => {
        useCartStore.getState().updateQuantity('item-1_FRESH_STOCK', 0);
      });

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('removes all items', () => {
      act(() => {
        useCartStore.getState().addItem(makeCartItem({ id: 'a' }));
        useCartStore.getState().addItem(makeCartItem({ id: 'b', catalogItemId: 'item-2' }));
      });

      act(() => {
        useCartStore.getState().clearCart();
      });

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('selectors', () => {
    it('separates USE_TODAY and FRESH_STOCK items', () => {
      act(() => {
        useCartStore.getState().addItem(
          makeCartItem({ id: 'a', expiryBucket: 'USE_TODAY', freshnessMeter: 'RED' })
        );
        useCartStore.getState().addItem(
          makeCartItem({ id: 'b', catalogItemId: 'item-2', expiryBucket: 'FRESH_STOCK' })
        );
      });

      const state = useCartStore.getState();
      expect(selectUseTodayItems(state)).toHaveLength(1);
      expect(selectFreshStockItems(state)).toHaveLength(1);
      expect(selectUseTodayItems(state)[0]!.id).toBe('a');
      expect(selectFreshStockItems(state)[0]!.id).toBe('b');
    });

    it('computes subtotal correctly', () => {
      act(() => {
        useCartStore.getState().addItem(
          makeCartItem({ id: 'a', price: 100, discountedPrice: null })
        );
        useCartStore.getState().addItem(
          makeCartItem({
            id: 'b',
            catalogItemId: 'item-2',
            price: 80,
            discountedPrice: 60,
            discountPct: 25,
            expiryBucket: 'USE_TODAY',
          })
        );
      });

      // item a: 100 × 1 = 100
      // item b: 60 × 1 = 60 (discounted)
      const state = useCartStore.getState();
      expect(selectSubtotal(state)).toBe(160);
    });

    it('computes discount total correctly', () => {
      act(() => {
        useCartStore.getState().addItem(
          makeCartItem({
            id: 'a',
            price: 100,
            discountedPrice: 80,
            discountPct: 20,
            expiryBucket: 'USE_TODAY',
          })
        );
        useCartStore.getState().addItem(
          makeCartItem({
            id: 'b',
            catalogItemId: 'item-2',
            price: 50,
            discountedPrice: null,
            discountPct: 0,
          })
        );
      });

      // Saving: (100 - 80) × 1 = 20
      const state = useCartStore.getState();
      expect(selectDiscountTotal(state)).toBe(20);
    });

    it('computes total item count', () => {
      act(() => {
        useCartStore.getState().addItem(makeCartItem({ id: 'a' }));
        useCartStore.getState().addItem(makeCartItem({ id: 'a' })); // qty → 2
        useCartStore.getState().addItem(
          makeCartItem({ id: 'b', catalogItemId: 'item-2' })
        );
      });

      expect(selectItemCount(useCartStore.getState())).toBe(3); // 2 + 1
    });
  });
});
