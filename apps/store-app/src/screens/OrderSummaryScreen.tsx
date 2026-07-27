import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTickets, useTicketActions, OrderTicket } from '@quicky/api-client';
import { useAuthStore } from '../stores/authStore';
import { RootStackParamList } from '../index';

const COLORS = {
  surface: '#f6fafa',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  primary: '#00696c',
  primaryContainer: '#57c0c4',
  onPrimaryContainer: '#004c4e',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f4f4',
  surfaceContainerHigh: '#e4e9e9',
  surfaceVariant: '#dfe3e3',
  outline: '#6d797a',
  outlineVariant: '#bdc9c9',
  secondary: '#516607',
  onSecondary: '#ffffff',
  secondaryContainer: '#d3ed84',
  onSecondaryContainer: '#576c10',
  tertiaryFixed: '#ffd9dd',
  onTertiaryFixedVariant: '#6f343e',
};

type OrderSummaryRouteProp = RouteProp<{ OrderSummary: { ticketId: string } }, 'OrderSummary'>;

export const OrderSummaryScreen = () => {
  const route = useRoute<OrderSummaryRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { data: tickets } = useTickets(user!.uid);
  const { pack } = useTicketActions(user!.uid);

  const ticket = tickets?.find(t => t.id === route.params.ticketId);

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Order Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { order } = ticket;
  const isPacking = order.status === 'ACCEPTED';
  const isReady = order.status === 'PACKED' || order.status === 'READY_FOR_PICKUP';
  
  const handleMarkReady = () => {
    pack.mutate(ticket.id, {
      onSuccess: () => {
        Alert.alert('Packed', 'Order has been marked as ready.');
      },
      onError: (err: Error) => {
        Alert.alert('Error', err.message || 'Could not mark order as packed.');
      }
    });
  };

  const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Order #{ticket.orderId.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, isReady && styles.statusBadgeReady]}>
          <Text style={[styles.statusBadgeText, isReady && styles.statusBadgeTextReady]}>
            {isReady ? 'Ready' : isPacking ? 'Packing' : ticket.status}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Section */}
        <View style={styles.card}>
          <View style={styles.customerHeader}>
            <View style={styles.customerAvatar}>
              <MaterialIcons name="person" size={24} color={COLORS.onSecondaryContainer} />
            </View>
            <View>
              <Text style={styles.customerName}>{order.user?.name || 'Customer'}</Text>
              <Text style={styles.customerPhone}>+91 ••••• •••••</Text>
            </View>
          </View>
          <View style={styles.addressBox}>
            <MaterialIcons name="location-on" size={20} color={COLORS.primary} style={styles.addressIcon} />
            <Text style={styles.addressText}>{order.user?.address || 'Address not provided'}</Text>
          </View>
        </View>

        {/* Order Items Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ITEMS ORDERED</Text>
            <View style={styles.itemsCountBadge}>
              <Text style={styles.itemsCountText}>{totalItems} Items</Text>
            </View>
          </View>
          
          <View style={styles.itemsList}>
            {order.items.map((item, index) => (
              <View key={item.id} style={[styles.itemRow, index > 0 && styles.itemRowBorder]}>
                <View style={styles.itemImageContainer}>
                  {item.catalogItem?.imageUrl ? (
                    <Image source={{ uri: item.catalogItem.imageUrl }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <MaterialIcons name="inventory-2" size={24} color={COLORS.outlineVariant} />
                    </View>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.catalogItem?.name || 'Unknown Item'}</Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{((item.discountedPrice ?? item.price) * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PAYMENT SUMMARY</Text>
          <View style={styles.summaryList}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item Total</Text>
              <Text style={styles.summaryValue}>₹{order.items.reduce((sum, i) => sum + ((i.discountedPrice ?? i.price) * i.quantity), 0).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>₹{(order.deliveryFee ?? 0).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Order Total</Text>
              <Text style={styles.totalValue}>₹{order.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color={COLORS.onTertiaryFixedVariant} />
          <Text style={styles.infoText}>Please check the seal on the items before packing.</Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        {isPacking && (
          <Pressable 
            style={({pressed}) => [styles.actionButton, pressed && { opacity: 0.9 }]}
            onPress={handleMarkReady}
            disabled={pack.isPending}
          >
            {pack.isPending ? (
              <ActivityIndicator color={COLORS.onPrimaryContainer} />
            ) : (
              <>
                <MaterialIcons name="check-circle" size={24} color={COLORS.onPrimaryContainer} />
                <Text style={styles.actionButtonText}>Mark as Ready</Text>
              </>
            )}
          </Pressable>
        )}
        
        <Pressable style={({pressed}) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="print" size={24} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>Print Receipt</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statusBadge: {
    backgroundColor: 'rgba(87, 192, 196, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onPrimaryContainer,
  },
  statusBadgeReady: {
    backgroundColor: COLORS.secondaryContainer,
  },
  statusBadgeTextReady: {
    color: COLORS.onSecondaryContainer,
  },
  content: {
    padding: 16,
    paddingBottom: 160,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(189, 201, 201, 0.3)',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  customerPhone: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 12,
    borderRadius: 8,
  },
  addressIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  addressText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    flex: 1,
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.outline,
    letterSpacing: 1,
    marginBottom: 8,
  },
  itemsCountBadge: {
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemsCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.onSurface,
  },
  itemsList: {
    gap: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerLow,
  },
  itemImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    marginRight: 16,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  itemQty: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  summaryList: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  summaryValue: {
    fontSize: 16,
    color: COLORS.onSurface,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: COLORS.outlineVariant,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tertiaryFixed,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onTertiaryFixedVariant,
    flex: 1,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    gap: 12,
  },
  actionButton: {
    height: 56,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onPrimaryContainer,
  },
  secondaryButton: {
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  }
});
