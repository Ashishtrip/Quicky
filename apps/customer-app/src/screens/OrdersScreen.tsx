import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useCustomerOrders, OrderResult } from '@quicky/api-client';
import { Colors, Typography, Radii, Spacing } from '@quicky/ui-kit';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

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
    // Legacy single screen if they tap the card (optional, can also just expand)
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
                     <Text style={styles.mapBadgeText}>On the way</Text>
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
                    <View style={[styles.progressSegment, { backgroundColor: Colors.primaryContainer }]} />
                    <View style={[styles.progressSegment, { backgroundColor: Colors.primaryContainer }]} />
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
                <View style={styles.processingHeaderRow}>
                  <View style={styles.processingIconContainer}>
                    <Text style={styles.processingIcon}>🛍️</Text>
                  </View>
                  <View style={styles.processingInfo}>
                    <Text style={styles.orderIdText}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={styles.orderSubtitle}>{order.assignedStore?.name || 'Quicky Hub'} • {order.items?.length || 0} items</Text>
                    <View style={styles.statusRow}>
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
                      <Text style={styles.pastImageIcon}>🏪</Text>
                    </View>
                    <View>
                      <Text style={styles.pastStoreName}>{order.assignedStore?.name || 'Quicky Hub'}</Text>
                      <Text style={styles.pastOrderMeta}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {order.items?.length || 0} items
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.pastStatusBadge, { backgroundColor: order.status === 'CANCELLED' ? Colors.freshRedBg : Colors.freshGreenBg }]}>
                    <Text style={[styles.pastStatusText, { color: order.status === 'CANCELLED' ? Colors.freshRed : Colors.freshGreen }]}>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h1,
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
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  deliveryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'column',
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: Colors.surfaceDim,
    padding: Spacing.sm,
  },
  mapBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 4,
  },
  mapBadgeText: {
    ...Typography.caption,
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
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  orderSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: Colors.primaryContainer + '33', // 20% opacity approx
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  statusBadgeText: {
    ...Typography.bodySmall,
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
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-end',
    marginTop: Spacing.lg,
  },
  trackButtonText: {
    ...Typography.bodyLarge,
    color: Colors.onPrimaryContainer,
  },
  processingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: Spacing.sm,
  },
  processingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryContainer + '4D', // 30% opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  processingIcon: {
    fontSize: 20,
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
    ...Typography.caption,
    color: Colors.primaryContainer,
  },
  processingPriceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  etaText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pastCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: Colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  pastImageIcon: {
    fontSize: 20,
  },
  pastStoreName: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
  },
  pastOrderMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pastStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pastStatusText: {
    ...Typography.caption,
  },
  pastFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceDim,
  },
  reorderButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
  },
  reorderButtonText: {
    ...Typography.bodySmall,
    color: Colors.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  retryText: {
    ...Typography.bodyLarge,
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
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    paddingTop: -2, // Align with dot
  },
  stepLabelActive: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  processingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
