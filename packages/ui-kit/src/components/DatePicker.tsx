import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, Spacing, Typography } from '../theme/tokens';

export interface DatePickerProps {
  label?: string;
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
}

export const DatePicker = ({ label, value, onChange, placeholder, error }: DatePickerProps) => {
  const [show, setShow] = useState(false);

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Hide picker for Android, iOS can keep it open if inline (but usually we dismiss it if modal)
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const formattedDate = value ? value.toLocaleDateString() : '';

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={[styles.input, error ? styles.inputError : null]} 
        onPress={showDatepicker}
        activeOpacity={0.7}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value ? formattedDate : (placeholder || 'Select Date')}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()} // Can't be born in the future
        />
      )}
      
      {/* For iOS, we might want a "Done" button if using 'spinner' display, but 'default' usually works well inline or as a modal on iOS 14+ */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  label: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
