import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radii } from '@quicky/ui-kit';
import { RootStackParamList } from '../navigation/AppNavigator';
import { userSocket } from '../services/socket';
import { OrderResult, useCancelOrder } from '@quicky/api-client';
import { useAuthStore } from '../stores/authStore';
import { MaterialIcons } from '@expo/vector-icons';
import { ROHINI_LAT, ROHINI_LNG } from '../hooks/useProductFilters';

type MyOrderRouteProp = RouteProp<RootStackParamList, 'MyOrder'>;

export function MyOrderScreen() {
  const route = useRoute<MyOrderRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { orderId, initialOrderData } = route.params as any;
  const { user } = useAuthStore();

  const [orderData, setOrderData] = useState<OrderResult | null>(initialOrderData || null);
  const [status, setStatus] = useState<string>(orderData?.status || 'ACCEPTED');

  useEffect(() => {
    userSocket.connect(user!.uid);

    const unsubscribeStatusChange = userSocket.subscribe('order-status-changed', (payload: OrderResult) => {
      if (payload.id === orderId) {
        setOrderData(payload);
        setStatus(payload.status);
      }
    });

    return () => {
      unsubscribeStatusChange();
      userSocket.disconnect();
    };
  }, [orderId, navigation]);

  const customerLat = (orderData as any)?.lat || ROHINI_LAT;
  const customerLng = (orderData as any)?.lng || ROHINI_LNG;
  
  // Fake store location for demo if missing
  const storeLat = customerLat + 0.015;
  const storeLng = customerLng + 0.01;

  const isDelivered = status === 'DELIVERED';

  let displayStatusTitle = 'Store Assigned!';
  let displayStatusSubtitle = 'They are packing your order now.';

  if (status === 'READY') {
    displayStatusTitle = 'Order Ready!';
    displayStatusSubtitle = 'Waiting for delivery partner...';
  } else if (status === 'OUT_FOR_DELIVERY') {
    displayStatusTitle = 'Out for Delivery!';
    displayStatusSubtitle = 'Your order is on the way.';
  } else if (status === 'DELIVERED') {
    displayStatusTitle = 'Delivered!';
    displayStatusSubtitle = 'Enjoy your fresh items.';
  } else if (status === 'CANCELLED') {
    displayStatusTitle = 'Order Cancelled';
    displayStatusSubtitle = 'This order was cancelled.';
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <View style={[styles.map, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialIcons name="map" size={64} color={Colors.outline} />
          <Text style={{ marginTop: 8, color: Colors.outline, fontFamily: Typography.bodySmall.fontFamily }}>Map Placeholder</Text>
        </View>
        
        <SafeAreaView style={styles.backButtonContainer} edges={['top']}>
          <Pressable onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs' as any)} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
        </SafeAreaView>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.dragHandle} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bottomCardContent}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{displayStatusTitle}</Text>
            <Text style={styles.subtitle}>{displayStatusSubtitle}</Text>
          </View>

          {/* Assigned Store Card */}
          <View style={styles.assignedStoreCard}>
            <View style={styles.assignedStoreCardBg} />
            <View style={styles.storeIconContainer}>
              <MaterialIcons name="storefront" size={32} color={Colors.primary} />
              <View style={styles.onlineBadge} />
            </View>
            <View style={styles.storeDetails}>
              <Text style={styles.storeName}>{orderData?.assignedStore?.name || 'Quicky Hub #8A'}</Text>
              <View style={styles.storeMetaRow}>
                <View style={styles.ratingBadge}>
                  <MaterialIcons name="star" size={14} color="#576c10" />
                  <Text style={styles.ratingText}>4.9</Text>
                </View>
                <Text style={styles.distanceText}>2.4 km away</Text>
              </View>
            </View>
            <Pressable style={styles.callButton}>
              <MaterialIcons name="call" size={24} color={Colors.onPrimaryContainer} />
            </Pressable>
          </View>

          {/* Order Summary (Items & Payment) */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            
            <View style={styles.itemsCard}>
              {orderData?.items?.map((item, index) => (
                <View key={item.id} style={[styles.itemRow, index > 0 && styles.itemRowBorder]}>
                  <View style={styles.itemImageContainer}>
                    {item.catalogItem?.imageUrl ? (
                      <Image source={{ uri: item.catalogItem.imageUrl }} style={styles.itemImage} />
                    ) : (
                      <MaterialIcons name="image" size={24} color={Colors.outline} />
                    )}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.catalogItem?.name || 'Item'}</Text>
                    <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{(item.discountedPrice ?? item.price) * item.quantity}</Text>
                </View>
              ))}
            </View>

            <View style={styles.paymentCard}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Item Total</Text>
                <Text style={styles.paymentValue}>₹{orderData?.items?.reduce((sum, i) => sum + ((i.discountedPrice ?? i.price) * i.quantity), 0) || 0}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Delivery Fee</Text>
                <Text style={styles.paymentValue}>₹{orderData?.deliveryFee ?? 0}</Text>
              </View>
              <View style={[styles.paymentRow, styles.paymentRowTotal]}>
                <Text style={styles.paymentTotalLabel}>Order Total</Text>
                <Text style={styles.paymentTotalValue}>₹{orderData?.totalAmount}</Text>
              </View>
            </View>
          </View>

          {isDelivered && (
            <Pressable 
              style={styles.doneButton} 
              onPress={() => navigation.navigate('MainTabs' as any)}
            >
              <Text style={styles.doneButtonText}>Back to Home</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fafa',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  userPin: {
    width: 48,
    height: 48,
    backgroundColor: '#57c0c4',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  storePinActive: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  bottomCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 30,
    maxHeight: '70%',
  },
  bottomCardContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 48,
    height: 6,
    backgroundColor: 'rgba(189, 201, 201, 0.4)',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 12,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#171c1d',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#3d4949',
    marginTop: 4,
  },
  assignedStoreCard: {
    backgroundColor: '#f6fafa', // surface
    borderColor: '#d6dbdb', // surface-dim
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  assignedStoreCardBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(87, 192, 196, 0.05)', // subtle primary-container gradient replacement
  },
  storeIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: Colors.white,
    borderColor: '#dfe3e3',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    backgroundColor: '#d3ed84', // secondary-container
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: 8,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171c1d',
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 237, 132, 0.3)', // secondary-container/30
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#576c10',
  },
  distanceText: {
    fontSize: 12,
    color: '#3d4949',
  },
  callButton: {
    width: 48,
    height: 48,
    backgroundColor: '#57c0c4',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  doneButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  summarySection: {
    marginTop: 24,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  itemsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e9e9',
    padding: 16,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0f4f4',
  },
  itemImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f6fafa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemQty: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e9e9',
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  paymentValue: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  paymentRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#f0f4f4',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  paymentTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  }
});
