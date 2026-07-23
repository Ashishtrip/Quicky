import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../src/screens/LoginScreen';
import auth from '@react-native-firebase/auth';

jest.mock('@react-native-firebase/auth', () => {
  const mockSignInWithEmailAndPassword = jest.fn();
  const mockSignInWithCredential = jest.fn();
  return () => ({
    signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
    signInWithCredential: mockSignInWithCredential,
  });
});

describe('Customer App LoginScreen', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={{}} />);
    expect(getByText('Welcome to Quicky')).toBeTruthy();
  });

  it('handles email login', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={{}} />);
    const emailInput = getByPlaceholderText('Enter your email');
    const passInput = getByPlaceholderText('Enter your password');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passInput, 'password123');
    
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(auth().signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
