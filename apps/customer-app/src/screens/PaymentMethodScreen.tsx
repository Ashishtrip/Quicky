import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCheckout, OrderResult, useSubmitRating } from '@quicky/api-client';
import { Colors, Typography, Spacing, Radii } from '@quicky/ui-kit';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ROHINI_LAT, ROHINI_LNG } from '../hooks/useProductFilters';

type PaymentMethodRouteProp = RouteProp<RootStackParamList, 'PaymentMethod'>;

export function PaymentMethodScreen() {
  const route = useRoute<PaymentMethodRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  
  const { address, instructions } = route.params;

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const checkoutMutation = useCheckout();

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'PAYPAL'>('COD');



  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    const checkoutItems = items.map((item) => ({
      catalogItemId: item.catalogItemId,
      quantity: item.quantity,
      expiryBucket: item.expiryBucket,
    }));

    const checkoutPayload = {
      customerId: user!.uid,
      lat: ROHINI_LAT,
      lng: ROHINI_LNG,
      radiusKm: 3,
      paymentMethod,
      items: checkoutItems,
      // in real app, we'd pass address and instructions here
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.summaryTitle}>Select Payment Method</Text>
        <View style={styles.paymentOptions}>
          <Pressable 
            style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionSelected]} 
            onPress={() => setPaymentMethod('COD')}
          >
            <Text style={[styles.paymentOptionText, paymentMethod === 'COD' && styles.paymentOptionTextSelected]}>Cash / UPI on Delivery</Text>
          </Pressable>
          <Pressable 
            style={[styles.paymentOption, paymentMethod === 'PAYPAL' && styles.paymentOptionSelected]} 
            onPress={() => setPaymentMethod('PAYPAL')}
          >
            <Text style={[styles.paymentOptionText, paymentMethod === 'PAYPAL' && styles.paymentOptionTextSelected]}>PayPal Wallet</Text>
          </Pressable>
        </View>

        <View style={styles.addressSummary}>
          <Text style={styles.addressTitle}>Delivering to:</Text>
          <Text style={styles.addressText}>{address.fullName}</Text>
          <Text style={styles.addressText}>{address.street}</Text>
          <Text style={styles.addressText}>{address.city}, {address.pincode}</Text>
          {instructions ? (
            <Text style={styles.instructionsText}>Note: {instructions}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.checkoutBar}>
        <Pressable 
          style={[styles.checkoutButton, checkoutMutation.isPending && { opacity: 0.5 }]} 
          onPress={handleCheckout}
          disabled={checkoutMutation.isPending}
        >
          {checkoutMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.checkoutButtonText}>Confirm & Pay</Text>
          )}
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
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.h2.fontSize,
    color: Colors.textPrimary,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  summaryTitle: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  paymentOptions: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  paymentOptionSelected: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  paymentOptionText: {
    color: Colors.textPrimary,
    fontWeight: '500',
    fontSize: Typography.bodyLarge.fontSize,
  },
  paymentOptionTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  addressSummary: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressTitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  addressText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  instructionsText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  checkoutBar: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkoutButton: {
    backgroundColor: Colors.black,
    padding: Spacing.md,
    borderRadius: Radii.card,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: Colors.white,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
});
