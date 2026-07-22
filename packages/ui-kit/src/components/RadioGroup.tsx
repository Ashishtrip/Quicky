import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme/tokens';

export interface RadioOption {
  id: string;
  label: string;
}

export interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  error?: string;
}

export const RadioGroup = ({ label, options, selectedValue, onValueChange, error }: RadioGroupProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedValue === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onValueChange(option.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                {isSelected && <View style={styles.radioInnerCircle} />}
              </View>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '10', // 10% opacity
  },
  radioCircle: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  radioCircleSelected: {
    borderColor: Colors.accent,
  },
  radioInnerCircle: {
    height: 9,
    width: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.accent,
  },
  optionText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
  },
  optionTextSelected: {
    color: Colors.accent,
    fontWeight: '600',
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
