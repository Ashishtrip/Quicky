import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors, Spacing, Typography } from '../theme/tokens';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectDropdownProps {
  label?: string;
  options: SelectOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const SelectDropdown = ({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder,
  error,
}: SelectDropdownProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[styles.pickerContainer, error ? styles.pickerContainerError : null]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(itemValue: string) => onValueChange(itemValue)}
          style={styles.picker}
          dropdownIconColor={Colors.textPrimary}
        >
          {placeholder && (
            <Picker.Item label={placeholder} value="" color={Colors.textSecondary} />
          )}
          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
              color={Colors.textPrimary}
            />
          ))}
        </Picker>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  pickerContainerError: {
    borderColor: Colors.error,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
