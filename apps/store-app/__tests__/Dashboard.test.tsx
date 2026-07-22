import React from 'react';
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
import { render } from '@testing-library/react-native';
import { DashboardScreen } from '../src/screens/Dashboard';
import { useDailyReminder } from '../src/hooks/useDailyReminder';

jest.mock('../src/hooks/useDailyReminder', () => ({
  useDailyReminder: jest.fn(),
}));

jest.mock('../src/screens/BasicSalesScreen', () => ({
  BasicSalesScreen: () => <></>,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe('Store App Dashboard', () => {
  it('shows daily reminder when active', () => {
    (useDailyReminder as jest.Mock).mockReturnValue({
      shouldShowReminder: true,
      dismissReminder: jest.fn(),
    });

    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Items Expiring Today')).toBeTruthy();
  });

  it('hides daily reminder when dismissed', () => {
    (useDailyReminder as jest.Mock).mockReturnValue({
      shouldShowReminder: false,
      dismissReminder: jest.fn(),
    });

    const { queryByText } = render(<DashboardScreen />);
    expect(queryByText('Items Expiring Today')).toBeNull();
  });
});
