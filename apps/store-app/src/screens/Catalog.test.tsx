import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CatalogScreen } from './Catalog';
import { useCatalog } from '../hooks/useTagging';

// Mock the hook
jest.mock('../hooks/useTagging', () => ({
  useCatalog: jest.fn(),
}));

const mockNavigate = jest.fn();

describe('CatalogScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (useCatalog as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<CatalogScreen navigation={{ navigate: mockNavigate } as any} />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders error state when fetch fails', () => {
    (useCatalog as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    render(<CatalogScreen navigation={{ navigate: mockNavigate } as any} />);
    expect(screen.getByText('Error loading catalog.')).toBeTruthy();
  });

  it('renders a list of items on success', () => {
    const mockData = [
      { id: '1', name: 'Milk', unit: '1 L' },
      { id: '2', name: 'Bread', unit: '1 Loaf' },
    ];
    (useCatalog as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    render(<CatalogScreen navigation={{ navigate: mockNavigate } as any} />);
    expect(screen.getByText('Milk')).toBeTruthy();
    expect(screen.getByText('1 L · ₹49')).toBeTruthy();
    expect(screen.getByText('Bread')).toBeTruthy();
  });

  it('navigates to Tagging screen on item press', () => {
    const mockData = [
      { id: '1', name: 'Milk', unit: '1 L' },
    ];
    (useCatalog as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    render(<CatalogScreen navigation={{ navigate: mockNavigate } as any} />);
    
    const itemCard = screen.getByText('Milk');
    fireEvent.press(itemCard);

    expect(mockNavigate).toHaveBeenCalledWith('Tagging', {
      catalogItemId: '1',
      name: 'Milk',
    });
  });
});
