import React from 'react';
import { render } from '@testing-library/react-native';
import { FreshnessBadge } from './FreshnessBadge';

describe('FreshnessBadge', () => {
  it('renders RED state correctly', () => {
    const { getByText } = render(<FreshnessBadge state="RED" />);
    const textElement = getByText('Use Today');
    expect(textElement).toBeTruthy();
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#FFFFFF' })])
    );
  });

  it('renders AMBER state correctly', () => {
    const { getByText } = render(<FreshnessBadge state="AMBER" />);
    const textElement = getByText('Soon');
    expect(textElement).toBeTruthy();
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#000000' })])
    );
  });

  it('renders GREEN state correctly', () => {
    const { getByText } = render(<FreshnessBadge state="GREEN" />);
    const textElement = getByText('Fresh');
    expect(textElement).toBeTruthy();
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#FFFFFF' })])
    );
  });

  it('hides text when showText is false', () => {
    const { queryByText } = render(
      <FreshnessBadge state="RED" showText={false} />
    );
    expect(queryByText('Use Today')).toBeNull();
  });
});
