import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FreshnessFilter, FreshnessFilterValue } from './FreshnessFilter';

describe('FreshnessFilter', () => {
  const defaultProps = {
    selected: 'ANY' as FreshnessFilterValue,
    onFilterChange: jest.fn(),
  };

  it('renders all three filter options', () => {
    const { getByText } = render(<FreshnessFilter {...defaultProps} />);

    expect(getByText('Any')).toBeTruthy();
    expect(getByText('Use Today')).toBeTruthy();
    expect(getByText('Fresh Stock')).toBeTruthy();
  });

  it('fires onFilterChange with correct value when pressed', () => {
    const onFilterChange = jest.fn();
    const { getByText } = render(
      <FreshnessFilter selected="ANY" onFilterChange={onFilterChange} />
    );

    fireEvent.press(getByText('Use Today'));
    expect(onFilterChange).toHaveBeenCalledWith('USE_TODAY');

    fireEvent.press(getByText('Fresh Stock'));
    expect(onFilterChange).toHaveBeenCalledWith('FRESH_STOCK');

    fireEvent.press(getByText('Any'));
    expect(onFilterChange).toHaveBeenCalledWith('ANY');
  });

  it('applies accessibility state for selected pill', () => {
    const { getByLabelText } = render(
      <FreshnessFilter selected="USE_TODAY" onFilterChange={jest.fn()} />
    );

    const useTodayButton = getByLabelText('Filter: Use Today');
    expect(useTodayButton.props.accessibilityState).toEqual({ selected: true });

    const anyButton = getByLabelText('Filter: Any');
    expect(anyButton.props.accessibilityState).toEqual({ selected: false });
  });
});
