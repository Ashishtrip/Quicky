import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Radii, Spacing, Typography, Interaction } from '../theme';

export type Bucket = 'USE_TODAY' | 'FRESH_STOCK';

export interface BucketSelectorProps {
  selected: Bucket;
  onSelect: (bucket: Bucket) => void;
}

/**
 * Store-app bucket selector — the 3-tap tagging flow step 3.
 *
 * Two massive buttons for selecting expiry bucket.
 * Sharp 4px corners, high-contrast active states,
 * visually impossible to confuse (tracked failure mode).
 * Minimum 48px height with extra padding for store owners.
 */
export const BucketSelector: React.FC<BucketSelectorProps> = ({ selected, onSelect }) => {
  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          selected === 'USE_TODAY' ? styles.selectedRed : styles.unselected,
          pressed && styles.pressed,
        ]}
        onPress={() => onSelect('USE_TODAY')}
        accessibilityRole="button"
        accessibilityState={{ selected: selected === 'USE_TODAY' }}
        accessibilityLabel="Use Today — Discounted"
      >
        <Text style={[
          styles.icon,
          { color: selected === 'USE_TODAY' ? Colors.freshRed : Colors.textMuted },
        ]}>⬇</Text>
        <Text style={[
          styles.text,
          { color: selected === 'USE_TODAY' ? Colors.textPrimary : Colors.textSecondary },
        ]}>Use Today</Text>
        <Text style={[
          styles.subtext,
          { color: selected === 'USE_TODAY' ? Colors.freshRed : Colors.textMuted },
        ]}>Discounted</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          selected === 'FRESH_STOCK' ? styles.selectedGreen : styles.unselected,
          pressed && styles.pressed,
        ]}
        onPress={() => onSelect('FRESH_STOCK')}
        accessibilityRole="button"
        accessibilityState={{ selected: selected === 'FRESH_STOCK' }}
        accessibilityLabel="Fresh Stock — Standard Price"
      >
        <Text style={[
          styles.icon,
          { color: selected === 'FRESH_STOCK' ? Colors.freshGreen : Colors.textMuted },
        ]}>✓</Text>
        <Text style={[
          styles.text,
          { color: selected === 'FRESH_STOCK' ? Colors.textPrimary : Colors.textSecondary },
        ]}>Fresh Stock</Text>
        <Text style={[
          styles.subtext,
          { color: selected === 'FRESH_STOCK' ? Colors.freshGreen : Colors.textMuted },
        ]}>Standard Price</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md - 4,
    borderRadius: Radii.card,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Interaction.minTapTarget * 1.5, // Extra large for store owners
  },
  unselected: {
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  selectedRed: {
    borderColor: Colors.freshRed,
    backgroundColor: Colors.freshRedBg,
  },
  selectedGreen: {
    borderColor: Colors.freshGreen,
    backgroundColor: Colors.freshGreenBg,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  text: {
    fontSize: Typography.h2.fontSize - 2, // 18px
    fontWeight: '700',
    marginBottom: 4,
  },
  subtext: {
    fontSize: Typography.badge.fontSize,
    fontWeight: '500',
  },
});
