import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FreshnessBadge, FreshnessState } from './FreshnessBadge';
import { Colors, Radii, Spacing, Typography } from '../theme';

export interface CartItemCardProps {
  productName: string;
  unit: string;
  price: number;
  discountedPrice?: number | null;
  discountPct?: number | null;
  freshnessMeter: FreshnessState;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

/**
 * Cart line item card — sharp widget aesthetic.
 *
 * 4px corners, 1px border, no soft shadows.
 * High-contrast stepper with black outline.
 * Text-based remove icon (✕) instead of emoji.
 */
export const CartItemCard: React.FC<CartItemCardProps> = ({
  productName,
  unit,
  price,
  discountedPrice,
  discountPct,
  freshnessMeter,
  quantity,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  const hasDiscount = discountedPrice != null && discountPct != null && discountPct > 0;
  const unitPrice = hasDiscount ? discountedPrice : price;
  const lineTotal = unitPrice * quantity;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {productName}
          </Text>
          <Text style={styles.unit}>{unit}</Text>
          <FreshnessBadge state={freshnessMeter} showText />
        </View>

        {/* Quantity stepper */}
        <View style={styles.stepperColumn}>
          <View style={styles.stepper}>
            <Pressable
              style={({ pressed }) => [
                styles.stepperBtn,
                pressed && styles.stepperBtnPressed,
              ]}
              onPress={quantity === 1 ? onRemove : onDecrement}
              accessibilityLabel={quantity === 1 ? 'Remove item' : 'Decrease quantity'}
            >
              <Text style={styles.stepperBtnText}>
                {quantity === 1 ? '✕' : '−'}
              </Text>
            </Pressable>
            <Text style={styles.stepperCount}>{quantity}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.stepperBtn,
                pressed && styles.stepperBtnPressed,
              ]}
              onPress={onIncrement}
              accessibilityLabel="Increase quantity"
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Price row */}
      <View style={styles.priceRow}>
        <View style={styles.priceDetail}>
          {hasDiscount ? (
            <>
              <Text style={styles.discountedUnitPrice}>₹{unitPrice}</Text>
              <Text style={styles.originalUnitPrice}>₹{price}</Text>
              <Text style={styles.savingText}>(-{discountPct}%)</Text>
            </>
          ) : (
            <Text style={styles.unitPrice}>₹{price}</Text>
          )}
          <Text style={styles.qtyMultiplier}> × {quantity}</Text>
        </View>
        <Text style={styles.lineTotal}>₹{lineTotal.toFixed(0)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md - 4, // 12px
    marginVertical: 4,
    marginHorizontal: Spacing.md - 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: {
    flex: 1,
    marginRight: Spacing.md - 4,
    gap: 4,
  },
  productName: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  unit: {
    fontSize: Typography.badge.fontSize,
    color: Colors.textSecondary,
  },
  stepperColumn: {
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radii.pill,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  stepperBtnPressed: {
    opacity: 0.5,
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stepperCount: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  priceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  discountedUnitPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.freshGreen,
  },
  originalUnitPrice: {
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
  savingText: {
    fontSize: 11,
    color: Colors.freshRed,
    marginLeft: 4,
  },
  qtyMultiplier: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  lineTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
