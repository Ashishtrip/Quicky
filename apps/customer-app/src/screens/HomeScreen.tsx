import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { useProducts, useCategories, ProductResult } from '@quicky/api-client';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  ProductCard,
  FreshnessFilter,
  CategoryChipRow,
  SearchBar,
  Colors,
  Typography,
  Spacing,
} from '@quicky/ui-kit';
import { useProductFilters } from '../hooks/useProductFilters';
import { useCartStore } from '../stores/cartStore';
import { FloatingCartButton } from '../components/FloatingCartButton';

/**
 * HomeScreen — Customer browse screen.
 *
 * Nothing OS aesthetic: pure white background, black typography,
 * no emojis as icons, stark loading/error states.
 *
 * 1. Category chips (horizontal scroll)
 * 2. Freshness filter (three-state toggle — prominent)
 * 3. Product grid (2-column FlatList)
 * 4. Clear loading / empty / error states
 */
export function HomeScreen() {
  const {
    freshness,
    categoryId,
    search,
    setFreshness,
    setCategoryId,
    setSearch,
    queryParams,
  } = useProductFilters();

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data: products, isLoading, isError, error, refetch } = useProducts(queryParams);
  const { data: categories = [] } = useCategories();

  // Refetch products whenever the home screen comes into focus (e.g. from background or another tab)
  // to ensure delisted/out of stock items are removed promptly
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const getCartQuantity = useCallback(
    (id: string) => {
      const item = cartItems.find((i) => i.id === id);
      return item?.quantity ?? 0;
    },
    [cartItems]
  );

  const handleAddToCart = useCallback(
    (product: ProductResult) => {
      const id = `${product.catalogItem.id}_${product.expiryBucket}`;
      addItem({
        id,
        catalogItemId: product.catalogItem.id,
        productName: product.catalogItem.name,
        unit: product.catalogItem.unit,
        price: product.price,
        discountedPrice: product.discountedPrice,
        discountPct: product.discountPct ?? 0,
        expiryBucket: product.expiryBucket,
        freshnessMeter: product.freshnessMeter,
        imageUrl: product.catalogItem.imageUrl ?? null,
      });
    },
    [addItem]
  );

  const handleIncrement = useCallback(
    (id: string) => {
      const current = getCartQuantity(id);
      updateQuantity(id, current + 1);
    },
    [getCartQuantity, updateQuantity]
  );

  const handleDecrement = useCallback(
    (id: string) => {
      const current = getCartQuantity(id);
      updateQuantity(id, current - 1);
    },
    [getCartQuantity, updateQuantity]
  );

  const renderProduct = useCallback(
    ({ item }: { item: ProductResult }) => {
      const id = `${item.catalogItem.id}_${item.expiryBucket}`;
      const qty = getCartQuantity(id);
      return (
        <ProductCard
          productName={item.catalogItem.name}
          unit={item.catalogItem.unit}
          imageUrl={item.catalogItem.imageUrl}
          price={item.price}
          discountedPrice={item.discountedPrice}
          discountPct={item.discountPct}
          freshnessMeter={item.freshnessMeter}
          storeName="Available Nearby"
          distanceKm={0} // Hidden in UI if 0
          quantity={qty}
          onAddToCart={() => handleAddToCart(item)}
          onIncrement={() => handleIncrement(id)}
          onDecrement={() => handleDecrement(id)}
          onPress={() => navigation.navigate('ProductDetail', { product: item })}
        />
      );
    },
    [getCartQuantity, handleAddToCart, handleIncrement, handleDecrement, navigation]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header — stark black typography */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headerTitle}>Quicky</Text>
            <Text style={styles.headerSubtitle}>Rohini, Delhi</Text>
          </View>
          <Pressable
            onPress={() => auth().signOut()}
            style={{ padding: 8, backgroundColor: '#f3f4f6', borderRadius: 8 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#dc2626' }}>Logout</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      {/* Category chips */}
      <CategoryChipRow
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      {/* Freshness filter — prominent, not hidden */}
      <View style={styles.filterRow}>
        <FreshnessFilter selected={freshness} onFilterChange={setFreshness} />
      </View>

      {/* Product grid */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.black} />
          <Text style={styles.stateText}>Finding products near you…</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerState}>
          <Text style={styles.stateIcon}>!</Text>
          <Text style={styles.stateText}>
            Something went wrong.{'\n'}
            {error?.message || 'Check your connection and try again.'}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.retryButtonText}>Tap to retry</Text>
          </Pressable>
        </View>
      ) : products && products.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateIcon}>◻</Text>
          <Text style={styles.stateText}>
            No products found.{'\n'}Try a different filter or category.
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => `${item.catalogItem.id}_${item.expiryBucket}`}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.h1.fontSize,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    paddingHorizontal: Spacing.sm,
  },
  gridContent: {
    padding: Spacing.sm,
    paddingBottom: 80, // Space for tab bar
  },
  // States — no emojis, styled text icons
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  stateIcon: {
    fontSize: 40,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  stateText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md - 4,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: Spacing.md - 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: 9999,
  },
  retryButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
