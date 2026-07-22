import React from 'react';
import { describe, expect, it, jest } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react-native';
import { BucketSelector } from './BucketSelector';

describe('BucketSelector', () => {
  it('renders correctly with USE_TODAY selected', () => {
    const mockOnSelect = jest.fn();
    const { getByText } = render(
      <BucketSelector selected="USE_TODAY" onSelect={mockOnSelect} />
    );

    expect(getByText('Use Today')).toBeTruthy();
    expect(getByText('Fresh Stock')).toBeTruthy();
    expect(getByText('Discounted')).toBeTruthy();
    expect(getByText('Standard Price')).toBeTruthy();
  });

  it('calls onSelect with USE_TODAY when pressed', () => {
    const mockOnSelect = jest.fn();
    const { getByText } = render(
      <BucketSelector selected="FRESH_STOCK" onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('Use Today'));
    expect(mockOnSelect).toHaveBeenCalledWith('USE_TODAY');
  });

  it('calls onSelect with FRESH_STOCK when pressed', () => {
    const mockOnSelect = jest.fn();
    const { getByText } = render(
      <BucketSelector selected="USE_TODAY" onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('Fresh Stock'));
    expect(mockOnSelect).toHaveBeenCalledWith('FRESH_STOCK');
  });
});
