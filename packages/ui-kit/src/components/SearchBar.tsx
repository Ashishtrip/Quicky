import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Radii } from '../theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/**
 * SearchBar — Corporate / Modern aesthetic.
 *
 * 8px base radius, 1px border, subtle icon.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search Quicky...',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.base,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  icon: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: Typography.bodyLarge.fontSize,
    height: '100%',
  },
});
