import React, { forwardRef, useState } from 'react';
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps, View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Radii } from '../theme/tokens';

export interface TextInputProps extends RNTextInputProps {
  label: string;
  error?: string;
  helperText?: string;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ label, error, helperText, style, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={styles.container}>
        <Text style={[styles.label, error ? styles.labelError : null]}>{label}</Text>
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputFocused,
            error ? styles.inputError : null,
          ]}
        >
          <RNTextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={Colors.textMuted}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null}
      </View>
    );
  }
);

TextInput.displayName = 'TextInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodyLarge,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  labelError: {
    color: Colors.error,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.base,
    backgroundColor: Colors.surface,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    ...Typography.bodyLarge,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    minHeight: 48, // Minimum tap target
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    fontFamily: 'Inter_400Regular',
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    ...Typography.caption,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
