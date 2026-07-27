import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTickets, useTicketActions, OrderTicket, useSalesMetrics } from '@quicky/api-client';
import { useAuthStore } from '../stores/authStore';
import { TicketCard } from '../components/TicketCard';
import { getCurrentPositionAsync, Accuracy } from 'expo-location';
import { useQueryClient } from '@tanstack/react-query';
import { storeSocket } from '../services/socket';
import { useNotificationStore } from '../stores/notificationStore';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  surface: '#f6fafa',
  surfaceContainerLow: '#f0f4f4',
  surfaceContainerHighest: '#dfe3e3',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  primary: '#00696c',
  onPrimary: '#ffffff',
  error: '#ba1a1a',
  onError: '#ffffff',
  surfaceVariant: '#dfe3e3',
};

type TabKey = 'NEW' | 'PACKING' | 'READY' | 'COMPLETED';

export const InboxScreen = () => {
  const user = useAuthStore(state => state.user);
  const STORE_ID = user!.uid;
  
  const { data: tickets, isLoading, error } = useTickets(STORE_ID);
  const { accept, decline, pack, ready, deliver } = useTicketActions(STORE_ID);
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const unreadCount = useNotificationStore(state => state.notifications.filter(n => !n.read).length);

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const { data: metrics } = useSalesMetrics(
    STORE_ID,
    todayStart.toISOString(),
    todayEnd.toISOString()
  );

  const [activeTab, setActiveTab] = useState<TabKey>('NEW');

  React.useEffect(() => {
    storeSocket.connect(STORE_ID);
    const unsubscribeNew = storeSocket.subscribe('new-order-assignment', () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', STORE_ID] });
    });

    const unsubscribeCancel = storeSocket.subscribe('ticket-cancelled', () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', STORE_ID] });
    });

    const updateLocation = async () => {
      try {
        const location = await getCurrentPositionAsync({ accuracy: Accuracy.Lowest });
        if (location) {
          storeSocket.emitLocation(STORE_ID, location.coords.latitude, location.coords.longitude);
        }
      } catch (err) {
        console.warn('Could not update location for socket emit:', err);
      }
    };
    
    updateLocation();
    
    return () => {
      unsubscribeNew();
      unsubscribeCancel();
      storeSocket.disconnect();
    };
  }, [STORE_ID, queryClient]);

  const pendingTickets = tickets?.filter((t: OrderTicket) => t.status === 'BROADCASTED') || [];
  const activeTickets = tickets?.filter((t: OrderTicket) => t.status === 'ACCEPTED' && t.order.status === 'ACCEPTED') || [];
  const readyTickets = tickets?.filter((t: OrderTicket) => t.status === 'ACCEPTED' && (t.order.status === 'PACKED' || t.order.status === 'READY_FOR_PICKUP')) || [];
  const completedTickets = tickets?.filter((t: OrderTicket) => t.status === 'ACCEPTED' && t.order.status === 'FULFILLED') || [];

  const handleAccept = (ticketId: string) => {
    accept.mutate(ticketId, {
      onSuccess: () => {
        Alert.alert('Accepted', 'You have accepted this order. Please prepare it for delivery.');
        setActiveTab('PACKING');
      },
      onError: (err: Error) => {
        Alert.alert('Error', err.message || 'Could not accept order. Another store may have accepted it.');
      }
    });
  };

  const handleDecline = (ticketId: string) => {
    decline.mutate(ticketId);
  };

  const handlePack = (ticketId: string) => {
    pack.mutate(ticketId, {
      onSuccess: () => {
        Alert.alert('Packed', 'Order has been marked as packed.');
        setActiveTab('READY');
      },
      onError: (err: Error) => {
        Alert.alert('Error', err.message || 'Could not mark order as packed.');
      }
    });
  };

  const handleReady = (ticketId: string) => {
    ready.mutate(ticketId, {
      onSuccess: () => {
        Alert.alert('Ready', 'Order is ready for pickup.');
      },
      onError: (err: Error) => {
        Alert.alert('Error', err.message || 'Could not mark order as ready.');
      }
    });
  };

  const handleDeliver = (ticketId: string) => {
    deliver.mutate(ticketId, {
      onSuccess: () => {
        Alert.alert('Handed Over', 'Order has been handed to the customer.');
        setActiveTab('COMPLETED');
      },
      onError: (err: Error) => {
        Alert.alert('Error', err.message || 'Could not mark order as delivered.');
      }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Looking for orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load tickets.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    if (activeTab === 'NEW') {
      return (
        <FlatList
          data={pendingTickets}
          keyExtractor={(ticket: OrderTicket) => ticket.id}
          contentContainerStyle={styles.scrollContent}
          renderItem={({ item: ticket }) => (
            <TicketCard
              ticket={ticket}
              isPending={true}
              onAccept={handleAccept}
              onDecline={handleDecline}
              isAccepting={accept.isPending && accept.variables === ticket.id}
              isDeclining={decline.isPending && decline.variables === ticket.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={styles.emptyText}>No new orders right now.</Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'PACKING') {
      return (
        <FlatList
          data={activeTickets}
          keyExtractor={(ticket: OrderTicket) => ticket.id}
          contentContainerStyle={styles.scrollContent}
          renderItem={({ item: ticket }) => (
            <TicketCard
              ticket={ticket}
              isPending={false}
              onPack={handlePack}
              isPacking={pack.isPending && pack.variables === ticket.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No orders currently being packed.</Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'READY') {
      return (
        <FlatList
          data={readyTickets}
          keyExtractor={(ticket: OrderTicket) => ticket.id}
          contentContainerStyle={styles.scrollContent}
          renderItem={({ item: ticket }) => (
            <TicketCard
              ticket={ticket}
              isPending={false}
              onReady={handleReady}
              onDeliver={handleDeliver}
              isReadying={ready.isPending && ready.variables === ticket.id}
              isDelivering={deliver.isPending && deliver.variables === ticket.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No orders waiting for riders.</Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'COMPLETED') {
      return (
        <FlatList
          data={completedTickets}
          keyExtractor={(ticket: OrderTicket) => ticket.id}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <View style={{ marginBottom: 24 }}>
              <View style={styles.snapshotGrid}>
                <Pressable 
                  style={({pressed}) => [styles.snapshotCard, pressed && {opacity: 0.8}]}
                  onPress={() => navigation.navigate('SalesSummary' as never)}
                >
                  <Text style={styles.snapshotLabel}>REVENUE TODAY</Text>
                  <View style={styles.snapshotValueRow}>
                    <Text style={styles.snapshotValue}>₹{metrics?.todayEarnings?.toFixed(2) || '0.00'}</Text>
                  </View>
                </Pressable>
                <Pressable 
                  style={({pressed}) => [styles.snapshotCard, pressed && {opacity: 0.8}]}
                  onPress={() => navigation.navigate('SalesSummary' as never)}
                >
                  <Text style={styles.snapshotLabel}>ORDERS FULFILLED</Text>
                  <View style={styles.snapshotValueRow}>
                    <Text style={styles.snapshotValue}>{metrics?.fulfilledOrders || 0}</Text>
                    <MaterialIcons name="check-circle" size={18} color={COLORS.secondary} />
                  </View>
                </Pressable>
              </View>
              
              <View style={styles.recentCompletionsHeader}>
                <Text style={styles.recentCompletionsTitle}>Recent Completions</Text>
              </View>
            </View>
          }
          renderItem={({ item: ticket }) => (
            <TicketCard
              ticket={ticket}
              isPending={false}
              isCompleted={true}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyText}>No completed orders today.</Text>
            </View>
          }
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable 
            style={({pressed}) => [styles.headerIconButton, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('Dashboard' as any)}
          >
            <MaterialIcons name="storefront" size={24} color={COLORS.onSurfaceVariant} />
          </Pressable>
          <Text style={styles.title}>Quicky</Text>
          <Pressable 
            style={({pressed}) => [styles.headerIconButton, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('Notifications' as any)}
          >
            <MaterialIcons name="notifications" size={24} color={COLORS.onSurfaceVariant} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          <Pressable 
            style={[styles.segmentTab, activeTab === 'NEW' && styles.segmentTabActive]}
            onPress={() => setActiveTab('NEW')}
          >
            <Text style={[styles.segmentText, activeTab === 'NEW' && styles.segmentTextActive]}>New</Text>
            <View style={activeTab === 'NEW' ? styles.badgeActive : styles.badgeInactive}>
              <Text style={activeTab === 'NEW' ? styles.badgeTextActive : styles.badgeTextInactive}>
                {pendingTickets.length}
              </Text>
            </View>
          </Pressable>

          <Pressable 
            style={[styles.segmentTab, activeTab === 'PACKING' && styles.segmentTabActive]}
            onPress={() => setActiveTab('PACKING')}
          >
            <Text style={[styles.segmentText, activeTab === 'PACKING' && styles.segmentTextActive]}>Packing</Text>
            <View style={activeTab === 'PACKING' ? styles.badgeActive : styles.badgeInactive}>
              <Text style={activeTab === 'PACKING' ? styles.badgeTextActive : styles.badgeTextInactive}>
                {activeTickets.length}
              </Text>
            </View>
          </Pressable>

          <Pressable 
            style={[styles.segmentTab, activeTab === 'READY' && styles.segmentTabActive]}
            onPress={() => setActiveTab('READY')}
          >
            <Text style={[styles.segmentText, activeTab === 'READY' && styles.segmentTextActive]}>Ready</Text>
            <View style={activeTab === 'READY' ? styles.badgeActive : styles.badgeInactive}>
              <Text style={activeTab === 'READY' ? styles.badgeTextActive : styles.badgeTextInactive}>
                {readyTickets.length}
              </Text>
            </View>
          </Pressable>

          <Pressable 
            style={[styles.segmentTab, activeTab === 'COMPLETED' && styles.segmentTabActive]}
            onPress={() => setActiveTab('COMPLETED')}
          >
            <Text style={[styles.segmentText, activeTab === 'COMPLETED' && styles.segmentTextActive]}>Done</Text>
          </Pressable>
        </View>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.onSurfaceVariant,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerIconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.onError,
    fontSize: 10,
    fontWeight: 'bold',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 4,
    borderRadius: 12,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  segmentTabActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  segmentTextActive: {
    color: COLORS.primary,
  },
  badgeActive: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeInactive: {
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeTextActive: {
    color: COLORS.onError,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextInactive: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Space for bottom nav
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eaefee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  snapshotLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  snapshotValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  snapshotValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  recentCompletionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  recentCompletionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
});
