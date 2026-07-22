import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DailyReminderBanner } from './DailyReminderBanner';

describe('DailyReminderBanner', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <DailyReminderBanner onPress={jest.fn()} onDismiss={jest.fn()} />
    );

    expect(getByText("Mark today's near-expiry items")).toBeTruthy();
    expect(getByText('⚠️')).toBeTruthy();
    expect(getByText('✕')).toBeTruthy();
  });

  it('calls onPress when banner is tapped', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <DailyReminderBanner onPress={onPressMock} onDismiss={jest.fn()} />
    );

    const text = getByText("Mark today's near-expiry items");
    fireEvent.press(text);
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when close button is tapped', () => {
    const onDismissMock = jest.fn();
    const { getByText } = render(
      <DailyReminderBanner onPress={jest.fn()} onDismiss={onDismissMock} />
    );

    const closeButton = getByText('✕');
    fireEvent.press(closeButton);
    
    expect(onDismissMock).toHaveBeenCalledTimes(1);
  });
});
