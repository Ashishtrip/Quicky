import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISSED_KEY = 'LAST_DISMISSED_DATE';
const TAGGED_KEY = 'LAST_TAGGED_DATE';

export const useDailyReminder = () => {
  const [shouldShowReminder, setShouldShowReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkReminderState = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]!;
      const lastDismissed = await AsyncStorage.getItem(DISMISSED_KEY);
      const lastTagged = await AsyncStorage.getItem(TAGGED_KEY);
      
      if (lastDismissed === today || lastTagged === today) {
        setShouldShowReminder(false);
      } else {
        setShouldShowReminder(true);
      }
    } catch (e) {
      // Optimistically show on error
      setShouldShowReminder(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkReminderState();
  }, [checkReminderState]);

  const dismissReminder = useCallback(async () => {
    try {
      setShouldShowReminder(false);
      const today = new Date().toISOString().split('T')[0]!;
      await AsyncStorage.setItem(DISMISSED_KEY, today);
    } catch (e) {
      // Ignore
    }
  }, []);

  return { shouldShowReminder, dismissReminder, isLoading, refreshReminderState: checkReminderState };
};
