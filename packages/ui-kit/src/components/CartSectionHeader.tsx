import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../theme';

export interface CartSectionHeaderProps {
  type: 'USE_TODAY' | 'FRESH_STOCK';
  itemCount: number;
}

/**
 * Section header for cart grouping.
 * "Use Today (Discounted)" with red accent, "Fresh Stock" with green accent.
 * Sharp 4px corners matching the widget aesthetic.
 */
export const CartSectionHeader: React.FC<CartSectionHeaderProps> = ({
  type,
  itemCount,
}) => {
  const isUseToday = type === 'USE_TODAY';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isUseToday ? Colors.freshRedBg : Colors.freshGreenBg },
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.dot,
            { backgroundColor: isUseToday ? Colors.freshRed : Colors.freshGreen },
          ]}
        />
        <Text
          style={[
            styles.title,
            { color: isUseToday ? Colors.freshRed : Colors.freshGreen },
          ]}
        >
          {isUseToday ? 'Use Today' : 'Fresh Stock'}
        </Text>
        {isUseToday && (
          <View style={styles.discountTag}>
            <Text style={styles.discountTagText}>DISCOUNTED</Text>
          </View>
        )}
      </View>
      <Text style={styles.itemCount}>
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2, // 10px
    marginHorizontal: Spacing.md - 4, // 12px
    marginTop: Spacing.md - 4,
    borderRadius: Radii.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  discountTag: {
    backgroundColor: Colors.freshRed,
    borderRadius: Radii.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  discountTagText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  itemCount: {
    fontSize: Typography.badge.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
    marginLeft: 18,
  },
});
