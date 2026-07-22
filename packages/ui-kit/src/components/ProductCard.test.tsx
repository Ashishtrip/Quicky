import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const baseProps = {
    productName: 'Amul Butter',
    unit: '500g',
    imageUrl: null,
    price: 100,
    discountedPrice: null,
    discountPct: null,
    freshnessMeter: 'GREEN' as const,
    storeName: 'Ramesh Store',
    distanceKm: 1.2,
    quantity: 0,
    onAddToCart: jest.fn(),
    onIncrement: jest.fn(),
    onDecrement: jest.fn(),
  };

  it('renders product name, unit, and store info', () => {
    const { getByText } = render(<ProductCard {...baseProps} />);

    expect(getByText('Amul Butter')).toBeTruthy();
    expect(getByText('500g')).toBeTruthy();
    expect(getByText('Ramesh Store · 1.2 km')).toBeTruthy();
  });

  it('shows regular price without discount for FRESH_STOCK', () => {
    const { getByText, queryByText } = render(<ProductCard {...baseProps} />);

    expect(getByText('₹100')).toBeTruthy();
    // No discount badge
    expect(queryByText(/-\d+%/)).toBeNull();
  });

  it('shows discounted price and badge for USE_TODAY items', () => {
    const { getByText } = render(
      <ProductCard
        {...baseProps}
        freshnessMeter="RED"
        discountedPrice={80}
        discountPct={20}
      />
    );

    expect(getByText('₹80')).toBeTruthy();
    expect(getByText('₹100')).toBeTruthy(); // strikethrough original
    expect(getByText('-20%')).toBeTruthy();
  });

  it('shows Add button when quantity is 0', () => {
    const onAddToCart = jest.fn();
    const { getByText } = render(
      <ProductCard {...baseProps} quantity={0} onAddToCart={onAddToCart} />
    );

    const addButton = getByText('ADD');
    fireEvent.press(addButton);
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  it('shows quantity stepper when quantity > 0', () => {
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();
    const { getByText } = render(
      <ProductCard
        {...baseProps}
        quantity={3}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />
    );

    expect(getByText('3')).toBeTruthy();

    fireEvent.press(getByText('+'));
    expect(onIncrement).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('−'));
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });
});
