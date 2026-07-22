import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDailyReminder } from './useDailyReminder';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('useDailyReminder', () => {
  const DISMISSED_KEY = 'LAST_DISMISSED_DATE';
  const TAGGED_KEY = 'LAST_TAGGED_DATE';
  const today = new Date().toISOString().split('T')[0]!;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shouldShowReminder is true when neither dismissed nor tagged today', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useDailyReminder());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowReminder).toBe(true);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(DISMISSED_KEY);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(TAGGED_KEY);
  });

  it('shouldShowReminder is false when dismissed today', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) => {
      if (key === DISMISSED_KEY) return today;
      return null;
    });

    const { result } = renderHook(() => useDailyReminder());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowReminder).toBe(false);
  });

  it('shouldShowReminder is false when tagged today', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) => {
      if (key === TAGGED_KEY) return today;
      return null;
    });

    const { result } = renderHook(() => useDailyReminder());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shouldShowReminder).toBe(false);
  });

  it('dismissReminder saves today to AsyncStorage and hides banner', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useDailyReminder());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.shouldShowReminder).toBe(true);

    await act(async () => {
      await result.current.dismissReminder();
    });

    expect(result.current.shouldShowReminder).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(DISMISSED_KEY, today);
  });
});
