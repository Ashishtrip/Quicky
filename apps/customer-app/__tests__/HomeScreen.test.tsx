import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from '../src/screens/HomeScreen';
import { useProducts, useCategories } from '@quicky/api-client';

jest.mock('@quicky/api-client', () => ({
  useProducts: jest.fn(),
  useCategories: jest.fn(),
}));

jest.mock('../src/stores/cartStore', () => ({
  useCartStore: jest.fn().mockReturnValue([]),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe('Customer App HomeScreen', () => {
  beforeEach(() => {
    (useCategories as jest.Mock).mockReturnValue({
      data: [{ id: '1', name: 'Groceries' }],
    });
    (useProducts as jest.Mock).mockReturnValue({
      data: [
        {
          catalogItem: { id: 'p1', name: 'Milk', unit: '1L', imageUrl: null },
          price: 50,
          discountedPrice: 40,
          discountPct: 20,
          expiryBucket: 'Use Today',
          freshnessMeter: 'RED',
        },
      ],
      isLoading: false,
      isError: false,
    });
  });

  it('renders correctly and displays products', () => {
    const { getByText } = render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <HomeScreen />
      </SafeAreaProvider>
    );
    expect(getByText('Quicky')).toBeTruthy();
    expect(getByText('Groceries')).toBeTruthy();
    expect(getByText('Milk')).toBeTruthy();
    expect(getByText('₹40')).toBeTruthy();
  });

  it('shows loading state', () => {
    (useProducts as jest.Mock).mockReturnValue({ isLoading: true });
    const { getByText } = render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <HomeScreen />
      </SafeAreaProvider>
    );
    expect(getByText('Finding products near you…')).toBeTruthy();
  });

  it('shows error state', () => {
    (useProducts as jest.Mock).mockReturnValue({ isError: true, refetch: jest.fn() });
    const { getByText } = render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <HomeScreen />
      </SafeAreaProvider>
    );
    expect(getByText('Something went wrong.', { exact: false })).toBeTruthy();
  });
});
