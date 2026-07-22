import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CartItemCard } from './CartItemCard';

describe('CartItemCard', () => {
  const baseProps = {
    productName: 'Amul Milk 1L',
    unit: '1 Litre',
    price: 60,
    discountedPrice: null,
    discountPct: null,
    freshnessMeter: 'GREEN' as const,
    quantity: 2,
    onIncrement: jest.fn(),
    onDecrement: jest.fn(),
    onRemove: jest.fn(),
  };

  it('renders product name, unit, and line total', () => {
    const { getByText } = render(<CartItemCard {...baseProps} />);

    expect(getByText('Amul Milk 1L')).toBeTruthy();
    expect(getByText('1 Litre')).toBeTruthy();
    expect(getByText('₹120')).toBeTruthy(); // 60 × 2
  });

  it('shows discounted price for RED items', () => {
    const { getByText } = render(
      <CartItemCard
        {...baseProps}
        freshnessMeter="RED"
        discountedPrice={48}
        discountPct={20}
        quantity={2}
      />
    );

    expect(getByText('₹48')).toBeTruthy(); // discounted unit price
    expect(getByText('₹60')).toBeTruthy(); // original strikethrough
    expect(getByText('(-20%)')).toBeTruthy();
    expect(getByText('₹96')).toBeTruthy(); // line total: 48 × 2
  });

  it('calls onIncrement when + pressed', () => {
    const onIncrement = jest.fn();
    const { getByText } = render(
      <CartItemCard {...baseProps} onIncrement={onIncrement} />
    );

    fireEvent.press(getByText('+'));
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });

  it('shows trash icon at quantity=1 and calls onRemove', () => {
    const onRemove = jest.fn();
    const { getByText } = render(
      <CartItemCard {...baseProps} quantity={1} onRemove={onRemove} />
    );

    const trashButton = getByText('✕');
    fireEvent.press(trashButton);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('shows − button at quantity > 1 and calls onDecrement', () => {
    const onDecrement = jest.fn();
    const { getByText } = render(
      <CartItemCard {...baseProps} quantity={3} onDecrement={onDecrement} />
    );

    fireEvent.press(getByText('−'));
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });
});
