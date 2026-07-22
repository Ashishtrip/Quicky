import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Radii, Typography, Interaction } from '../theme';

export type FreshnessFilterValue = 'ANY' | 'USE_TODAY' | 'FRESH_STOCK';

export interface FreshnessFilterProps {
  selected: FreshnessFilterValue;
  onFilterChange: (value: FreshnessFilterValue) => void;
}

const FILTER_OPTIONS: { value: FreshnessFilterValue; label: string; labelHindi: string }[] = [
  { value: 'ANY', label: 'Any', labelHindi: 'सभी' },
  { value: 'USE_TODAY', label: 'Use Today', labelHindi: 'आज उपयोग करें' },
  { value: 'FRESH_STOCK', label: 'Fresh Stock', labelHindi: 'ताज़ा स्टॉक' },
];

const ACTIVE_COLORS: Record<FreshnessFilterValue, string> = {
  ANY: Colors.black,
  USE_TODAY: Colors.freshRed,
  FRESH_STOCK: Colors.freshGreen,
};

const ACTIVE_BG_COLORS: Record<FreshnessFilterValue, string> = {
  ANY: Colors.surface,
  USE_TODAY: Colors.freshRedBg,
  FRESH_STOCK: Colors.freshGreenBg,
};

/**
 * Three-state freshness filter toggle — the single most important
 * customer-facing control. Highly discoverable pill row.
 *
 * "Any" is the neutral default. "Use Today" and "Fresh Stock" use
 * distinct accent colours so the active state is instantly legible.
 *
 * Colour is never the only signal — always paired with dot indicator.
 * Large tap targets (minHeight 48) for mid-range Android.
 */
export const FreshnessFilter: React.FC<FreshnessFilterProps> = ({
  selected,
  onFilterChange,
}) => {
  return (
    <View style={styles.container}>
      {FILTER_OPTIONS.map((option) => {
        const isActive = selected === option.value;
        const activeColor = ACTIVE_COLORS[option.value];
        const activeBg = ACTIVE_BG_COLORS[option.value];

        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.pill,
              isActive
                ? { backgroundColor: activeBg, borderColor: activeColor }
                : styles.pillInactive,
              pressed && styles.pillPressed,
            ]}
            onPress={() => onFilterChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Filter: ${option.label}`}
          >
            {/* Colour dot — never the only signal (a11y) */}
            {option.value !== 'ANY' && (
              <View
                style={[
                  styles.dot,
                  { backgroundColor: isActive ? activeColor : Colors.disabled },
                ]}
              />
            )}
            <Text
              style={[
                styles.pillText,
                { color: isActive ? activeColor : Colors.textSecondary },
                isActive && styles.pillTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    minHeight: Interaction.minTapTarget,
    gap: 6,
  },
  pillInactive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  pillPressed: {
    opacity: 0.7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextActive: {
    fontWeight: '700',
  },
});
