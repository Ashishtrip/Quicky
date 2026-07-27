import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCheckout, OrderResult, DELIVERY_FEES } from '@quicky/api-client';
import { useCartStore, selectSubtotal } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ROHINI_LAT, ROHINI_LNG } from '../hooks/useProductFilters';
import { MaterialIcons } from '@expo/vector-icons';

type PaymentMethodRouteProp = RouteProp<RootStackParamList, 'PaymentMethod'>;

type PaymentOption = 'upi' | 'card' | 'wallet' | 'paypal' | 'cod';

const COLORS = {
  background: '#f6fafa',
  surface: '#f6fafa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f4f4',
  primary: '#00696c',
  primaryContainer: '#57c0c4',
  onPrimaryContainer: '#004c4e',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  outlineVariant: '#bdc9c9',
  white: '#ffffff',
};

export function PaymentMethodScreen() {
  const route = useRoute<PaymentMethodRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  
  const { address, instructions } = route.params;

  const subtotal = useCartStore(selectSubtotal);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  
  const deliveryFee = 
    subtotal >= DELIVERY_FEES.FREE_DELIVERY_THRESHOLD ? 0 
    : subtotal < DELIVERY_FEES.SMALL_BASKET_THRESHOLD ? DELIVERY_FEES.SMALL_BASKET_FEE 
    : DELIVERY_FEES.STANDARD_FEE;
  const totalAmount = subtotal + deliveryFee;

  const checkoutMutation = useCheckout();

  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>('upi');

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    if (paymentMethod !== 'cod') {
      Alert.alert('Coming Soon', 'This payment method is not available yet. Please select Cash on Delivery.');
      return;
    }

    const checkoutItems = items.map((item) => ({
      catalogItemId: item.catalogItemId,
      quantity: item.quantity,
      expiryBucket: item.expiryBucket,
    }));

    const fullAddressString = `${address.fullName}, ${address.street}, ${address.city}, ${address.pincode}${instructions ? ' | Note: ' + instructions : ''}`;

    const checkoutPayload = {
      customerId: user!.uid,
      customerName: address.fullName,
      deliveryAddress: fullAddressString,
      lat: ROHINI_LAT,
      lng: ROHINI_LNG,
      radiusKm: 3,
      paymentMethod: 'COD' as 'PAYPAL' | 'COD',
      items: checkoutItems,
    };

    checkoutMutation.mutate(checkoutPayload, {
      onSuccess: (order: OrderResult) => {
        clearCart();
        navigation.navigate('OrderStatus', { orderId: order.id });
      },
      onError: (error: Error) => {
        Alert.alert('Checkout Failed', error.message);
      },
    });
  };

  const PaymentOptionRow = ({ 
    id, 
    title, 
    subtitle, 
    icon 
  }: { 
    id: PaymentOption; 
    title: string; 
    subtitle: string; 
    icon: keyof typeof MaterialIcons.glyphMap;
  }) => {
    const isSelected = paymentMethod === id;
    
    return (
      <Pressable 
        style={[styles.paymentOption, isSelected && styles.paymentOptionSelected]} 
        onPress={() => setPaymentMethod(id)}
      >
        <View style={styles.paymentOptionLeft}>
          <View style={[styles.paymentIconContainer, isSelected && styles.paymentIconContainerSelected]}>
            <MaterialIcons name={icon} size={24} color={isSelected ? COLORS.primary : COLORS.onSurfaceVariant} />
          </View>
          <View>
            <Text style={styles.paymentOptionTitle}>{title}</Text>
            <Text style={styles.paymentOptionSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Select Payment Method</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Order Summary Bento */}
        <View style={styles.orderSummaryCard}>
          <MaterialIcons name="shopping-basket" size={120} color={COLORS.white} style={styles.orderSummaryBgIcon} />
          <Text style={styles.orderSummaryLabel}>ORDER SUMMARY</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: COLORS.onPrimaryContainer, opacity: 0.9 }}>Item Total:</Text>
            <Text style={{ color: COLORS.onPrimaryContainer, fontWeight: '600' }}>₹{subtotal.toFixed(0)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)', paddingBottom: 12 }}>
            <Text style={{ color: COLORS.onPrimaryContainer, opacity: 0.9 }}>Delivery Fee:</Text>
            <Text style={{ color: COLORS.onPrimaryContainer, fontWeight: '600' }}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</Text>
          </View>
          <View style={styles.orderSummaryAmountRow}>
            <Text style={styles.orderSummaryToPay}>To Pay:</Text>
            <Text style={styles.orderSummaryAmount}>₹{totalAmount.toFixed(0)}</Text>
          </View>
        </View>

        {/* Payment Methods List */}
        <Text style={styles.sectionTitle}>Payment Options</Text>
        
        <View style={styles.paymentOptionsList}>
          <PaymentOptionRow 
            id="upi"
            title="UPI Options"
            subtitle="Google Pay, PhonePe, Paytm"
            icon="qr-code-scanner"
          />
          <PaymentOptionRow 
            id="card"
            title="Credit / Debit Cards"
            subtitle="Visa, MasterCard, RuPay"
            icon="credit-card"
          />
          <PaymentOptionRow 
            id="wallet"
            title="Paytm Wallet"
            subtitle="Link your wallet for fast checkout"
            icon="account-balance-wallet"
          />
          <PaymentOptionRow 
            id="paypal"
            title="PayPal"
            subtitle="Pay with your PayPal account"
            icon="payment"
          />
          <PaymentOptionRow 
            id="cod"
            title="Cash on Delivery (COD)"
            subtitle="Pay in cash when order arrives"
            icon="payments"
          />
        </View>
      </ScrollView>

      {/* Bottom Sticky CTA */}
      <View style={styles.bottomBar}>
        <Pressable 
          style={[styles.placeOrderButton, checkoutMutation.isPending && { opacity: 0.5 }]} 
          onPress={handleCheckout}
          disabled={checkoutMutation.isPending}
        >
          {checkoutMutation.isPending ? (
            <ActivityIndicator size="small" color={COLORS.onPrimaryContainer} />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <MaterialIcons name="arrow-forward" size={20} color={COLORS.onPrimaryContainer} />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  orderSummaryCard: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderSummaryBgIcon: {
    position: 'absolute',
    right: -40,
    top: -40,
    opacity: 0.2,
  },
  orderSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.onPrimaryContainer,
    opacity: 0.8,
    marginBottom: 8,
  },
  orderSummaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  orderSummaryToPay: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.01,
    color: COLORS.onPrimaryContainer,
    marginBottom: 4,
  },
  orderSummaryAmount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.02,
    color: COLORS.onPrimaryContainer,
    lineHeight: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  paymentOptionsList: {
    gap: 12,
  },
  paymentOption: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primaryContainer,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconContainerSelected: {
    // any active specific style for icon container
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  paymentOptionSubtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primaryContainer,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primaryContainer,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  placeOrderButton: {
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  placeOrderText: {
    color: COLORS.onPrimaryContainer,
    fontSize: 16,
    fontWeight: '600',
  }
});


