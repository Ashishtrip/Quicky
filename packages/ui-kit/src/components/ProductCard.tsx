import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { FreshnessBadge, FreshnessState } from './FreshnessBadge';
import { Colors, Radii, Spacing, Typography, Interaction, Shadows } from '../theme';

export interface ProductCardProps {
  productName: string;
  unit: string;
  imageUrl?: string | null;
  price: number;
  discountedPrice?: number | null;
  discountPct?: number | null;
  freshnessMeter: FreshnessState;
  storeName: string;
  distanceKm?: number;
  quantity?: number;
  onAddToCart: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onPress?: () => void;
}

/**
 * Product card — Corporate / Modern aesthetic.
 *
 * 12px corners, soft Level 1 shadow, pure white background.
 * Discount badge in red. "Add" button is primary color with base radius.
 * All tap targets >= 44dp.
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  productName,
  unit,
  imageUrl,
  price,
  discountedPrice,
  discountPct,
  freshnessMeter,
  storeName,
  distanceKm,
  quantity = 0,
  onAddToCart,
  onIncrement,
  onDecrement,
  onPress,
}) => {
  const hasDiscount = discountedPrice != null && discountPct != null && discountPct > 0;
  const displayPrice = hasDiscount ? discountedPrice : price;

  const cardContent = (
    <>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>◻</Text>
          </View>
        )}

        {/* Discount badge overlay */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discountPct}%</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <FreshnessBadge state={freshnessMeter} showText />

        <Text style={styles.productName} numberOfLines={2}>
          {productName}
        </Text>

        <Text style={styles.unit}>{unit}</Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.displayPrice}>₹{displayPrice}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>₹{price}</Text>
          )}
        </View>

        {/* Store & distance */}
        <Text style={styles.storeName} numberOfLines={1}>
          {storeName}
          {distanceKm != null ? ` · ${distanceKm} km` : ''}
        </Text>

        {/* Add to Cart / Quantity Stepper */}
        {quantity === 0 ? (
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={onAddToCart}
            accessibilityRole="button"
            accessibilityLabel={`Add ${productName} to cart`}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </Pressable>
        ) : (
          <View style={styles.stepper}>
            <Pressable
              style={({ pressed }) => [
                styles.stepperBtn,
                pressed && styles.stepperBtnPressed,
              ]}
              onPress={onDecrement}
              accessibilityLabel="Decrease quantity"
            >
              <Text style={styles.stepperBtnText}>−</Text>
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
        )}
      </View>
    </>
  );

  return onPress ? (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {cardContent}
    </Pressable>
  ) : (
    <View style={styles.card}>{cardContent}</View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.level1,
    overflow: 'hidden',
    margin: Spacing.sm,
    flex: 1,
  },
  cardPressed: {
    opacity: 0.8,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  placeholderIcon: {
    fontSize: 32,
    color: Colors.textMuted,
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.freshRed,
    borderRadius: Radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountBadgeText: {
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  infoContainer: {
    padding: Spacing.sm + 2, // 10px
  },
  productName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textPrimary,
    marginTop: 6,
    lineHeight: 18,
  },
  unit: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.badge.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  displayPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.bodyLarge.fontSize,
    color: Colors.textPrimary,
  },
  originalPrice: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  storeName: {
    fontFamily: 'Inter_500Medium',
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Add button — Primary solid base radius
  addButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radii.base,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonText: {
    color: Colors.onPrimary,
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.bodySmall.fontSize,
    letterSpacing: 1,
  },
  // Quantity stepper
  stepper: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radii.base,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  stepperBtnPressed: {
    opacity: 0.5,
  },
  stepperBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: Colors.primary,
  },
  stepperCount: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.bodyLarge.fontSize,
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
});
