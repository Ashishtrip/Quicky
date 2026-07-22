import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProductResult } from '@quicky/api-client';
import { Colors, Typography, Spacing, FreshnessBadge, Radii } from '@quicky/ui-kit';
import { useCartStore } from '../stores/cartStore';
import { FloatingCartButton } from '../components/FloatingCartButton';

import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const { product } = route.params;
  const { catalogItem } = product;
  const id = `${catalogItem.id}_${product.expiryBucket}`;

  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const quantity = cartItems.find((i) => i.id === id)?.quantity ?? 0;

  const handleAddToCart = useCallback(() => {
    addItem({
      id,
      catalogItemId: catalogItem.id,
      productName: catalogItem.name,
      unit: catalogItem.unit,
      price: product.price,
      discountedPrice: product.discountedPrice,
      discountPct: product.discountPct ?? 0,
      expiryBucket: product.expiryBucket,
      freshnessMeter: product.freshnessMeter,
      imageUrl: catalogItem.imageUrl ?? null,
    });
  }, [addItem, product, catalogItem, id]);

  const handleIncrement = useCallback(() => {
    updateQuantity(id, quantity + 1);
  }, [updateQuantity, id, quantity]);

  const handleDecrement = useCallback(() => {
    updateQuantity(id, quantity - 1);
  }, [updateQuantity, id, quantity]);

  const hasDiscount =
    product.discountedPrice != null && product.discountPct != null && product.discountPct > 0;
  const displayPrice = hasDiscount ? product.discountedPrice : product.price;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {catalogItem.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Container */}
        <View style={styles.imageContainer}>
          {catalogItem.imageUrl ? (
            <Image source={{ uri: catalogItem.imageUrl }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderIcon}>◻</Text>
            </View>
          )}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{product.discountPct}%</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <FreshnessBadge state={product.freshnessMeter} showText />
          
          <Text style={styles.productName}>{catalogItem.name}</Text>
          <Text style={styles.unit}>{catalogItem.unit}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.displayPrice}>₹{displayPrice}</Text>
            {hasDiscount && <Text style={styles.originalPrice}>₹{product.price}</Text>}
          </View>
        </View>

        {/* Additional Details (Placeholder for description etc) */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.description}>
            {catalogItem.description || 'No description available for this product.'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {quantity === 0 ? (
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            onPress={handleAddToCart}
          >
            <Text style={styles.addButtonText}>ADD TO CART</Text>
          </Pressable>
        ) : (
          <View style={styles.stepperContainer}>
            <Pressable
              style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
              onPress={handleDecrement}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperCount}>{quantity}</Text>
            <Pressable
              style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
              onPress={handleIncrement}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        )}
      </View>
      <FloatingCartButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.surface,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
    color: Colors.textMuted,
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.freshRed,
    borderRadius: Radii.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  infoSection: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productName: {
    fontSize: Typography.h1.fontSize,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: Typography.bodyLarge.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 8,
  },
  displayPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  originalPrice: {
    fontSize: 18,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  detailsSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  metadataText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderStrong,
  },
  addButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.pill,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: Colors.accentText,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.borderStrong,
    borderRadius: Radii.pill,
    height: 56,
    paddingHorizontal: Spacing.sm,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  stepperBtnText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stepperCount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pressed: {
    opacity: 0.7,
  },
});
