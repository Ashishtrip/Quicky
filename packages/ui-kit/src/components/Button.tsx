import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radii, Typography, Interaction } from '../theme';

export interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  icon?: React.ReactNode;
}

/**
 * Quicky Button — Corporate / Modern aesthetic.
 *
 * Primary: Solid primary fill, white text, base radius (8px).
 * Secondary: Transparent, outline border, primary text.
 * Danger: Solid error fill, white text.
 *
 * Minimum height: 44px (low-tech-first).
 */
export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  style,
  textStyle,
  disabled,
  icon,
}) => {
  const variantStyles = VARIANT_STYLES[variant];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.container,
        variantStyles.container,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text
        style={[
          styles.text,
          variantStyles.text,
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {icon}
        {title}
      </Text>
    </Pressable>
  );
};

const VARIANT_STYLES = {
  primary: {
    container: {
      backgroundColor: Colors.primary,
      borderWidth: 0,
    } as ViewStyle,
    text: {
      color: Colors.onPrimary,
    } as TextStyle,
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.outline,
    } as ViewStyle,
    text: {
      color: Colors.primary,
    } as TextStyle,
  },
  danger: {
    container: {
      backgroundColor: Colors.error,
      borderWidth: 0,
    } as ViewStyle,
    text: {
      color: Colors.onPrimary,
    } as TextStyle,
  },
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radii.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Interaction.minTapTarget,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.bodyLarge.fontSize,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  disabledText: {
    color: Colors.disabledText,
  },
});
