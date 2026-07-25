import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CartItemCard, CartSectionHeader, Colors, Typography, Spacing, Radii } from '@quicky/ui-kit';
import {
  useCartStore,
  selectUseTodayItems,
  selectFreshStockItems,
  selectSubtotal,
  selectDiscountTotal,
  selectItemCount,
} from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useAddresses, useAddAddress, Address } from '@quicky/api-client';
import { ROHINI_LAT, ROHINI_LNG } from '../hooks/useProductFilters';

// Dynamic delivery fees based on PRD
const SMALL_BASKET_FEE = 30;
const SMALL_BASKET_THRESHOLD = 250;
const STANDARD_DELIVERY_FEE = 15;
const FREE_DELIVERY_THRESHOLD = 349;

export function CartScreen() {
  const items = useCartStore((s) => s.items);
  const useTodayItems = useCartStore(selectUseTodayItems);
  const freshStockItems = useCartStore(selectFreshStockItems);
  const subtotal = useCartStore(selectSubtotal);
  const discountTotal = useCartStore(selectDiscountTotal);
  const itemCount = useCartStore(selectItemCount);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();

  // Saved addresses
  const { data: savedAddresses, isLoading: addressesLoading } = useAddresses(user?.uid);
  const addAddressMutation = useAddAddress();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [fullName, setFullName] = useState(user?.displayName || '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [instructions, setInstructions] = useState('');

  // Auto-select the default address on load
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = savedAddresses.find((a: Address) => a.isDefault) || savedAddresses[0];
      if (defaultAddr) {
        handleSelectAddress(defaultAddr);
      }
    }
  }, [savedAddresses]);

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setStreet(addr.street);
    setCity(addr.city);
    setPincode(addr.pincode);
    setState(addr.state);
  };

  const handleSaveAddress = () => {
    if (!user?.uid || !street || !city || !pincode) return;
    addAddressMutation.mutate(
      {
        userId: user.uid,
        label: 'Delivery',
        street,
        city,
        state: state || 'Delhi',
        pincode,
        isDefault: !savedAddresses || savedAddresses.length === 0,
      },
      {
        onSuccess: () => {
          Alert.alert('Saved', 'Address saved for future orders.');
        },
      }
    );
  };

  const isAddressAlreadySaved = selectedAddressId != null;

  const deliveryFee = 
    subtotal >= FREE_DELIVERY_THRESHOLD ? 0 
    : subtotal < SMALL_BASKET_THRESHOLD ? SMALL_BASKET_FEE 
    : STANDARD_DELIVERY_FEE;
  const totalAmount = subtotal + deliveryFee;

  const handleContinueToPayment = () => {
    if (items.length === 0) return;
    if (!fullName || !street || !city || !pincode) {
      Alert.alert('Missing Details', 'Please fill in all delivery address fields.');
      return;
    }
    navigation.navigate('PaymentMethod', {
      address: { fullName, street, city, pincode },
      instructions,
    });
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Pressable onPress={() => navigation.canGoBack() && navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>Cart</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons name="shopping-cart" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse products and add items to get started
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Pressable onPress={() => navigation.canGoBack() && navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Cart</Text>
        </View>
        <Pressable
          onPress={clearCart}
          style={({ pressed }) => pressed && { opacity: 0.5 }}
        >
          <Text style={styles.clearButton}>Clear</Text>
        </Pressable>
      </View>

      <SectionList
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        sections={[
          ...(useTodayItems.length > 0 ? [{ title: 'USE_TODAY' as const, data: useTodayItems }] : []),
          ...(freshStockItems.length > 0 ? [{ title: 'FRESH_STOCK' as const, data: freshStockItems }] : []),
        ]}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <CartSectionHeader type={section.title} itemCount={section.data.length} />
        )}
        renderItem={({ item }) => (
          <CartItemCard
            productName={item.productName}
            unit={item.unit}
            price={item.price}
            discountedPrice={item.discountedPrice}
            discountPct={item.discountPct}
            freshnessMeter={item.freshnessMeter}
            quantity={item.quantity}
            onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
            onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
            onRemove={() => removeItem(item.id)}
          />
        )}
        ListFooterComponent={
          <>
            {/* Order Summary — Stitch Bill Details */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Bill Details</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item Total</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toFixed(0)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            {deliveryFee === 0 ? (
              <Text style={styles.freeDelivery}>FREE</Text>
            ) : (
              <Text style={styles.summaryValue}>₹{deliveryFee}</Text>
            )}
          </View>

          {discountTotal > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.savingLabel}>Item Discount</Text>
              <Text style={styles.savingValue}>
                -₹{discountTotal.toFixed(0)}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toFixed(0)}</Text>
          </View>
        </View>

        {/* Saved Addresses */}
        {savedAddresses && savedAddresses.length > 0 && (
          <View style={styles.formCard}>
            <Text style={styles.summaryTitle}>Saved Addresses</Text>
            {savedAddresses.map((addr: Address) => (
              <Pressable
                key={addr.id}
                style={[
                  styles.savedAddressChip,
                  selectedAddressId === addr.id && styles.savedAddressChipSelected,
                ]}
                onPress={() => handleSelectAddress(addr)}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons
                      name={addr.label === 'Work' ? 'work' : 'home'}
                      size={16}
                      color={selectedAddressId === addr.id ? Colors.primary : Colors.textSecondary}
                    />
                    <Text style={[
                      styles.savedAddressLabel,
                      selectedAddressId === addr.id && { color: Colors.primary },
                    ]}>
                      {addr.label}
                    </Text>
                    {addr.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.savedAddressText} numberOfLines={2}>
                    {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                  </Text>
                </View>
                <MaterialIcons
                  name={selectedAddressId === addr.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={22}
                  color={selectedAddressId === addr.id ? Colors.primary : Colors.textMuted}
                />
              </Pressable>
            ))}
            <Pressable
              style={styles.newAddressButton}
              onPress={() => {
                setSelectedAddressId(null);
                setStreet('');
                setCity('');
                setPincode('');
                setState('');
              }}
            >
              <MaterialIcons name="add" size={18} color={Colors.primary} />
              <Text style={styles.newAddressButtonText}>Enter new address</Text>
            </Pressable>
          </View>
        )}

        {/* Delivery Details Form */}
        <View style={styles.formCard}>
          <Text style={styles.summaryTitle}>Delivery Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={Colors.textMuted}
            value={fullName}
            onChangeText={(t) => { setFullName(t); }}
          />
          <TextInput
            style={styles.input}
            placeholder="Street Address"
            placeholderTextColor={Colors.textMuted}
            value={street}
            onChangeText={(t) => { setSelectedAddressId(null); setStreet(t); }}
          />
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: Spacing.sm }]}
              placeholder="City"
              placeholderTextColor={Colors.textMuted}
              value={city}
              onChangeText={(t) => { setSelectedAddressId(null); setCity(t); }}
            />
            <TextInput
              style={[styles.input, { width: 120 }]}
              placeholder="Pincode"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={pincode}
              onChangeText={(t) => { setSelectedAddressId(null); setPincode(t); }}
            />
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Delivery Instructions (Optional)"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            value={instructions}
            onChangeText={setInstructions}
          />

          {/* Save Address Button — only show for new addresses */}
          {!isAddressAlreadySaved && street.length > 0 && city.length > 0 && pincode.length > 0 && (
            <Pressable
              style={styles.saveAddressButton}
              onPress={handleSaveAddress}
              disabled={addAddressMutation.isPending}
            >
              {addAddressMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <MaterialIcons name="bookmark-border" size={18} color={Colors.primary} />
                  <Text style={styles.saveAddressText}>Save this address</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
          </>
        }
      />

      {/* Checkout CTA — Fixed Bottom Actions */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.checkoutItemCount}>Total</Text>
          <Text style={styles.checkoutTotal}>₹{totalAmount.toFixed(0)}</Text>
        </View>
        <Pressable 
          style={styles.checkoutButton} 
          onPress={handleContinueToPayment}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Pay</Text>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimaryContainer} />
        </Pressable>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: Typography.h1.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clearButton: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.freshRed,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  savingLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.freshGreen,
  },
  savingValue: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.freshGreen,
    fontWeight: '600',
  },
  freeDelivery: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.freshGreen,
    fontWeight: '600',
  },
  freeDeliveryHint: {
    fontSize: Typography.caption.fontSize,
    color: Colors.freshAmber,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  checkoutBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  checkoutTotal: {
    fontSize: Typography.h1.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  checkoutItemCount: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
  },
  checkoutButton: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radii.card,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    color: Colors.onPrimaryContainer,
    fontWeight: '600',
    fontSize: Typography.bodyLarge.fontSize,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  waitingTitle: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  paymentCard: {
    backgroundColor: Colors.background,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginHorizontal: Spacing.md - 4,
    marginBottom: Spacing.md,
  },
  paymentOptions: {
    gap: Spacing.sm,
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  paymentOptionSelected: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  paymentOptionText: {
    color: Colors.textPrimary,
    fontWeight: '500',
    fontSize: Typography.bodySmall.fontSize,
  },
  paymentOptionTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: Typography.bodySmall.fontSize,
    marginBottom: Spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  savedAddressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  savedAddressChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#f0fafa',
  },
  savedAddressLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  savedAddressText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  defaultBadge: {
    backgroundColor: '#e0f2f2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  newAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  newAddressButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radii.card,
    borderStyle: 'dashed',
  },
  saveAddressText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.primary,
  },
});
