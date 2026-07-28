import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useCustomerOrders, OrderResult } from '@quicky/api-client';
import { Colors, Typography, Radii, Spacing } from '@quicky/ui-kit';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MaterialIcons } from '@expo/vector-icons';

type OrdersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

import { userSocket } from '../services/socket';

export function OrdersScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const { data: orders, isLoading, error, refetch } = useCustomerOrders(user?.uid || '');
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user?.uid) {
      userSocket.connect(user.uid);
      const onEvent = () => refetch();
      const unsub1 = userSocket.subscribe('order-accepted', onEvent);
      const unsub2 = userSocket.subscribe('order-packed', onEvent);
      const unsub3 = userSocket.subscribe('order-status-changed', onEvent);
      
      // Manual polling fallback
      interval = setInterval(() => {
        refetch();
      }, 30000);

      return () => {
        unsub1(); unsub2(); unsub3();
        clearInterval(interval);
      };
    }
  }, [user?.uid, refetch]);

  const activeDeliveries = orders?.filter(o => o.status === 'OUT_FOR_DELIVERY' || o.delivery?.deliveryStatus === 'IN_TRANSIT') || [];
  const processingOrders = orders?.filter(o => o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'PACKED' || o.status === 'READY' || o.status === 'READY_FOR_PICKUP') || [];
  const pastOrders = orders?.filter(o => o.status === 'FULFILLED' || o.status === 'DELIVERED' || o.status === 'CANCELLED') || [];

  const handleOrderPress = (item: OrderResult) => {
    if (item.status === 'PENDING') {
      navigation.navigate('OrderStatus', { 
        orderId: item.id,
        initialStatus: item.status,
        initialOrderData: item
      });
    } else {
      navigation.navigate('MyOrder', { 
        orderId: item.id,
        initialOrderData: item
      });
    }
  };

  const getStepStatus = (order: OrderResult, step: number) => {
    const s = order.status;
    const isProcessing = s === 'PENDING';
    const isPacking = s === 'ACCEPTED' || s === 'PACKED';
    const isReady = s === 'READY' || s === 'READY_FOR_PICKUP' || s === 'OUT_FOR_DELIVERY' || order.delivery?.deliveryStatus === 'IN_TRANSIT';
    const isCompleted = s === 'FULFILLED' || s === 'DELIVERED';

    const currentIndex = isCompleted ? 4 : isReady ? 3 : isPacking ? 2 : 1;
    if (step < currentIndex) return 'completed';
    if (step === currentIndex) return 'active';
    return 'pending';
  };

  const STEPPER_ITEMS = [
    { step: 1, label: 'Processing' },
    { step: 2, label: 'Packing' },
    { step: 3, label: 'Ready' },
    { step: 4, label: 'Completed' }
  ];

  const renderStepper = (order: OrderResult) => (
    <View style={styles.stepperContainer}>
      {STEPPER_ITEMS.map((item, index) => {
        const state = getStepStatus(order, item.step);
        return (
          <View key={item.step} style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <View style={[styles.stepDot, state === 'active' && styles.stepDotActive, state === 'completed' && styles.stepDotCompleted]} />
              {index < 3 && <View style={[styles.stepLine, (state === 'completed' || getStepStatus(order, item.step + 1) !== 'pending') && styles.stepLineCompleted]} />}
            </View>
            <Text style={[styles.stepLabel, state === 'active' && styles.stepLabelActive]}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load orders.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeDeliveries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Deliveries</Text>
            {activeDeliveries.map(order => (
              <View key={order.id} style={styles.deliveryCard}>
                <View style={styles.mapPlaceholder}>
                   <View style={styles.mapBadge}>
                     <View style={styles.pulseDot} />
                     <Text style={styles.mapBadgeText}>12 mins</Text>
                   </View>
                </View>
                <View style={styles.deliveryInfo}>
                  <View style={styles.deliveryHeader}>
                    <View>
                      <Text style={styles.orderIdText}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                      <Text style={styles.orderSubtitle}>{order.assignedStore?.name || 'Quicky Hub'} • {order.items?.length || 0} items</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>On the Way</Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressBar}>
                    <View style={[styles.progressSegment, { backgroundColor: '#516607' }]} />
                    <View style={[styles.progressSegment, { backgroundColor: '#516607' }]} />
                    <View style={[styles.progressSegment, { backgroundColor: Colors.primary }]} />
                    <View style={[styles.progressSegment, { backgroundColor: Colors.surfaceDim }]} />
                  </View>

                  {expandedOrderId === order.id && renderStepper(order)}

                  <TouchableOpacity style={styles.trackButton} onPress={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                    <Text style={styles.trackButtonText}>{expandedOrderId === order.id ? 'Hide Tracking' : 'Track Order'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {processingOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Processing</Text>
            {processingOrders.map(order => (
              <View key={order.id} style={styles.processingCard}>
                <View style={styles.processingMainRow}>
                  <View style={styles.processingIconContainer}>
                    <MaterialIcons name="shopping-bag" size={24} color="#516607" />
                  </View>
                  <View style={styles.processingInfo}>
                    <Text style={styles.orderIdText}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={styles.orderSubtitle}>{order.assignedStore?.name || 'Quicky Hub'} • {order.items?.length || 0} items</Text>
                    <View style={styles.statusRow}>
                      <MaterialIcons name="inventory-2" size={16} color="#516607" />
                      <Text style={styles.statusText}>{order.status === 'PENDING' ? 'Finding store' : 'Packing items'}</Text>
                    </View>
                  </View>
                  <View style={styles.processingPriceContainer}>
                    <Text style={styles.priceText}>₹{order.totalAmount.toFixed(2)}</Text>
                    <Text style={styles.etaText}>Est. 25 mins</Text>
                  </View>
                </View>

                {expandedOrderId === order.id && renderStepper(order)}

                <TouchableOpacity style={[styles.trackButton, { width: '100%', alignItems: 'center' }]} onPress={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                  <Text style={styles.trackButtonText}>{expandedOrderId === order.id ? 'Hide Tracking' : 'Track Order'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {pastOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Orders</Text>
            {pastOrders.map(order => (
              <TouchableOpacity key={order.id} style={styles.pastCard} onPress={() => handleOrderPress(order)}>
                <View style={styles.pastHeader}>
                  <View style={styles.pastInfoRow}>
                    <View style={styles.pastImageContainer}>
                      <MaterialIcons name="storefront" size={20} color={Colors.textSecondary} />
                    </View>
                    <View>
                      <Text style={styles.pastStoreName}>{order.assignedStore?.name || 'Quicky Hub'}</Text>
                      <Text style={styles.pastOrderMeta}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {order.items?.length || 0} items
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.pastStatusBadge, { backgroundColor: order.status === 'CANCELLED' ? '#ffdad6' : 'rgba(211, 237, 132, 0.3)' }]}>
                    <MaterialIcons name="check-circle" size={12} color={order.status === 'CANCELLED' ? '#ba1a1a' : '#516607'} style={{marginRight: 4}} />
                    <Text style={[styles.pastStatusText, { color: order.status === 'CANCELLED' ? '#ba1a1a' : '#516607' }]}>
                      {order.status === 'CANCELLED' ? 'Cancelled' : 'Delivered'}
                    </Text>
                  </View>
                </View>
                <View style={styles.pastFooter}>
                  <Text style={styles.priceText}>₹{order.totalAmount.toFixed(2)}</Text>
                  <TouchableOpacity style={styles.reorderButton}>
                    <Text style={styles.reorderButtonText}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeDeliveries.length === 0 && processingOrders.length === 0 && pastOrders.length === 0 && (
          <View style={[styles.center, { marginTop: 100 }]}>
             <Text style={styles.emptyTitle}>No Orders Yet</Text>
             <Text style={styles.emptyText}>Your orders will appear here once you place them.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  deliveryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaefee',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'column',
    marginBottom: Spacing.md,
  },
  mapPlaceholder: {
    height: 128,
    backgroundColor: '#dfe3e3',
    padding: Spacing.sm,
    position: 'relative',
  },
  mapBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 4,
  },
  mapBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deliveryInfo: {
    padding: Spacing.md,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  orderIdText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  orderSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#3d4949',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(87, 192, 196, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
  },
  progressSegment: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  trackButton: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignSelf: 'flex-end',
    marginTop: Spacing.lg,
  },
  trackButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: Colors.onPrimaryContainer,
  },
  processingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaefee',
    padding: Spacing.md,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: Spacing.md,
  },
  processingMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  processingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(211, 237, 132, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  processingInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    fontWeight: '700',
    color: '#516607',
    marginLeft: 4,
  },
  processingPriceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  etaText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#3d4949',
    marginTop: 2,
  },
  pastCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaefee',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'column',
  },
  pastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pastInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pastImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e4e9e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  pastStoreName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pastOrderMeta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#3d4949',
    marginTop: 2,
  },
  pastStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pastStatusText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  pastFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#dfe3e3',
  },
  reorderButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f4f4',
  },
  reorderButtonText: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    fontWeight: '600',
    color: Colors.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: 9999,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  retryText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  stepperContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 48,
  },
  stepIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
    zIndex: 2,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.primaryContainer,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepDotCompleted: {
    backgroundColor: Colors.primary,
  },
  stepLine: {
    position: 'absolute',
    top: 12,
    bottom: -12,
    width: 2,
    backgroundColor: Colors.border,
    zIndex: 1,
  },
  stepLineCompleted: {
    backgroundColor: Colors.primary,
  },
  stepLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    paddingTop: -2,
  },
  stepLabelActive: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

