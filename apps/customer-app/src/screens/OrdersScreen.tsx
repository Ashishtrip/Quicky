import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useCustomerOrders, OrderResult } from '@quicky/api-client';
import { Colors, Typography, Radii } from '@quicky/ui-kit';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type OrdersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export function OrdersScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const { data: orders, isLoading, error, refetch } = useCustomerOrders(user?.uid || '');
  const [activeTab, setActiveTab] = React.useState<'ACTIVE' | 'PAST'>('ACTIVE');

  const getStatusBadge = (status: string, deliveryStatus?: string) => {
    if (status === 'PENDING' || status === 'ACCEPTED' || status === 'AWAITING_PAYMENT') {
      return { text: 'In Progress', color: Colors.black };
    }
    if (deliveryStatus === 'IN_TRANSIT') {
      return { text: 'Delivering', color: Colors.freshAmber };
    }
    if (status === 'FULFILLED' || deliveryStatus === 'DELIVERED') {
      return { text: 'Delivered', color: Colors.success };
    }
    if (status === 'CANCELLED') {
      return { text: 'Cancelled', color: Colors.error };
    }
    return { text: status, color: Colors.textSecondary };
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const badge = getStatusBadge(item.status, item.delivery?.deliveryStatus);
    const orderDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('OrderStatus', { 
          orderId: item.id,
          initialStatus: item.status,
          initialOrderData: item
        })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
          <View style={[styles.badge, { borderColor: badge.color }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>
        <Text style={styles.date}>{orderDate}</Text>
        
        {item.assignedStore?.name && (
          <Text style={styles.storeName}>Store: {item.assignedStore.name}</Text>
        )}
        
        <View style={styles.itemSummary}>
          <Text style={styles.itemCount}>
            {item.items?.length || 0} {item.items?.length === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.totalAmount}>₹{item.totalAmount.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const activeOrders = orders?.filter((o: OrderResult) => o.status !== 'FULFILLED' && o.status !== 'CANCELLED' && o.delivery?.deliveryStatus !== 'DELIVERED') || [];
  const pastOrders = orders?.filter((o: OrderResult) => o.status === 'FULFILLED' || o.status === 'CANCELLED' || o.delivery?.deliveryStatus === 'DELIVERED') || [];
  
  const displayedOrders = activeTab === 'ACTIVE' ? activeOrders : pastOrders;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Orders</Text>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'ACTIVE' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'PAST' && styles.tabButtonActive]}
          onPress={() => setActiveTab('PAST')}
        >
          <Text style={[styles.tabText, activeTab === 'PAST' && styles.tabTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.black} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load orders.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : displayedOrders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>◻</Text>
          <Text style={styles.emptyTitle}>No {activeTab === 'ACTIVE' ? 'Active' : 'Past'} Orders</Text>
          <Text style={styles.emptyText}>Your {activeTab === 'ACTIVE' ? 'in-progress' : 'completed'} orders will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={displayedOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    ...Typography.h1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 20,
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.black,
  },
  tabText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.black,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  date: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  storeName: {
    ...Typography.caption,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  itemSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  itemCount: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  totalAmount: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyIcon: {
    fontSize: 48,
    color: Colors.borderStrong,
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.h2,
    marginBottom: 8,
  },
  emptyText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.error,
    marginBottom: 16,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radii.pill,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
  },
});
