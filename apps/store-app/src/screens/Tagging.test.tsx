import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { TaggingScreen } from './Tagging';
import { useTagging } from '../hooks/useTagging';
import { Alert } from 'react-native';

// Mock the hook and UI kit
jest.mock('../hooks/useTagging', () => ({
  useTagging: jest.fn(),
}));

jest.mock('@quicky/ui-kit', () => {
  const React = require('react');
  const { View, Text, Pressable } = require('react-native');
  return {
    Button: ({ onPress, title, disabled }: any) => (
      <Pressable onPress={onPress} disabled={disabled} testID="submit-btn">
        <Text>{title}</Text>
      </Pressable>
    ),
    BucketSelector: ({ selected, onSelect }: any) => (
      <View>
        <Pressable onPress={() => onSelect('USE_TODAY')} testID="bucket-use-today">
          <Text>{selected === 'USE_TODAY' ? '[SELECTED] Use Today' : 'Use Today'}</Text>
        </Pressable>
        <Pressable onPress={() => onSelect('FRESH_STOCK')} testID="bucket-fresh-stock">
          <Text>{selected === 'FRESH_STOCK' ? '[SELECTED] Fresh Stock' : 'Fresh Stock'}</Text>
        </Pressable>
      </View>
    ),
  };
});

describe('TaggingScreen', () => {
  const mockGoBack = jest.fn();
  const mockMutate = jest.fn();
  const mockRoute = {
    params: {
      catalogItemId: '123',
      name: 'Test Milk',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useTagging as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('renders correctly with default state', () => {
    render(<TaggingScreen route={mockRoute as any} navigation={{ goBack: mockGoBack } as any} />);
    
    expect(screen.getByText('Test Milk')).toBeTruthy();
    expect(screen.getByText('ITEMS TO TAG')).toBeTruthy();
    expect(screen.getByText('Save Tags')).toBeTruthy();
    
    // Fresh stock should be default
    expect(screen.getByText('FRESH STOCK')).toBeTruthy();
  });

  it('shows validation alert if quantity is missing', () => {
    render(<TaggingScreen route={mockRoute as any} navigation={{ goBack: mockGoBack } as any} />);
    
    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.changeText(quantityInput, '');

    const submitBtn = screen.getByText('Save Tags');
    fireEvent.press(submitBtn);

    expect(Alert.alert).toHaveBeenCalledWith('Invalid Quantity', 'Please enter a valid quantity.');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits correctly with quantity and default bucket', () => {
    render(<TaggingScreen route={mockRoute as any} navigation={{ goBack: mockGoBack } as any} />);
    
    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.changeText(quantityInput, '5');

    const submitBtn = screen.getByText('Save Tags');
    fireEvent.press(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      {
        catalogItemId: '123',
        stockQuantity: 5,
        expiryBucket: 'FRESH_STOCK',
      },
      expect.any(Object)
    );
  });

  it('submits correctly with changed bucket', () => {
    render(<TaggingScreen route={mockRoute as any} navigation={{ goBack: mockGoBack } as any} />);
    
    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.changeText(quantityInput, '20');

    const useTodayBtn = screen.getByText('USE TODAY');
    fireEvent.press(useTodayBtn);

    const submitBtn = screen.getByText('Save Tags');
    fireEvent.press(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      {
        catalogItemId: '123',
        stockQuantity: 20,
        expiryBucket: 'USE_TODAY',
      },
      expect.any(Object)
    );
  });

  it('shows saving state when pending', () => {
    (useTagging as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });

    render(<TaggingScreen route={mockRoute as any} navigation={{ goBack: mockGoBack } as any} />);
    expect(screen.getByText('Saving...')).toBeTruthy();
  });
});
