import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDailyReminder } from '../hooks/useDailyReminder';
import { useNotificationStore } from '../stores/notificationStore';
import { useStoreData } from '../hooks/useStoreData';
import { useAuthStore } from '../stores/authStore';
import { useSalesMetrics, useWeeklyVolume } from '@quicky/api-client';

const COLORS = {
  background: '#f6fafa',
  surface: '#f6fafa',
  onBackground: '#171c1d',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#e4e9e9',
  primary: '#00696c',
  primaryContainer: '#57c0c4',
  secondary: '#516607',
  tertiaryContainer: '#ea9ba5',
  onTertiaryContainer: '#6b313b',
  tertiary: '#8b4b55',
  onTertiary: '#ffffff',
  outlineVariant: '#bdc9c9',
  error: '#ba1a1a',
  onError: '#ffffff',
};

const getWeekRange = () => {
  const now = new Date();
  
  // Calculate days to subtract to get to the most recent Monday
  // getDay() returns 0 (Sun) to 6 (Sat)
  const currentDay = now.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { 
    start: monday.toISOString(), 
    end: sunday.toISOString(), 
    currentDayIndex: daysFromMonday 
  };
};

import { MaterialIcons } from '@expo/vector-icons';

export const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { shouldShowReminder, dismissReminder } = useDailyReminder();
  const unreadCount = useNotificationStore(state => state.notifications.filter(n => !n.read).length);
  const user = useAuthStore(state => state.user);
  
  const { storeData, loading: storeLoading } = useStoreData();
  
  const dateRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }, []);

  const weekRange = useMemo(() => getWeekRange(), []);

  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics(
    user?.uid,
    dateRange.start,
    dateRange.end
  );

  const { data: weeklyVolume, isLoading: volumeLoading } = useWeeklyVolume(
    user?.uid,
    weekRange.start,
    weekRange.end
  );

  // Normalize volume for chart heights (0-100%)
  const maxVolume = useMemo(() => {
    if (!weeklyVolume || weeklyVolume.length === 0) return 1;
    return Math.max(...weeklyVolume, 1); // Avoid division by zero
  }, [weeklyVolume]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={({pressed}) => [styles.headerLeft, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <MaterialIcons name="storefront" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.title}>Quicky</Text>
        <Pressable 
          style={({pressed}) => [styles.bellButton, pressed && styles.cardPressed]} 
          onPress={() => navigation.navigate('Notifications')}
        >
          <MaterialIcons name="notifications" size={24} color={COLORS.onSurfaceVariant} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Good Morning, {storeLoading ? '...' : (storeData?.name || 'Partner')}!
          </Text>
          <Text style={styles.welcomeSubtitle}>Here's an overview of your store's performance today.</Text>
        </View>

        {/* Glanceable Stats Bento Grid */}
        <View style={styles.statsGrid}>
          <Pressable 
            style={({pressed}) => [styles.statCard, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('Inbox')}
          >
            <View style={styles.statHeader}>
              <Text style={styles.statIconPrimary}>🛒</Text>
              <Text style={styles.statLabel}>Today's Orders</Text>
            </View>
            {metricsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <Text style={styles.statValue}>{metrics?.fulfilledOrders || 0}</Text>
            )}
          </Pressable>

          <Pressable 
            style={({pressed}) => [styles.statCard, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('SalesSummary')}
          >
            <View style={styles.statHeader}>
              <Text style={styles.statIconSecondary}>💵</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </View>
            {metricsLoading ? (
              <ActivityIndicator size="small" color={COLORS.secondary} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <Text style={styles.statValue}>₹{metrics?.todayEarnings?.toLocaleString('en-IN') || 0}</Text>
            )}
          </Pressable>
        </View>

        {/* Urgent Summary Card */}
        {shouldShowReminder && (
          <View style={styles.urgentCard}>
            <View style={styles.urgentHeader}>
              <Text style={styles.urgentIcon}>⚠️</Text>
              <Text style={styles.urgentTitle}>Items Expiring Today</Text>
            </View>
            <Text style={styles.urgentBody}>
              Products across your store require immediate action to minimize waste.
            </Text>
            <View style={styles.urgentActions}>
              <Pressable 
                style={({pressed}) => [styles.tagButton, pressed && styles.btnPressed]}
                onPress={() => (navigation as any).navigate('Catalog')}
              >
                <Text style={styles.tagButtonText}>Tag Now</Text>
              </Pressable>
              
              <Pressable 
                style={({pressed}) => [styles.dismissButton, pressed && styles.btnPressed]}
                onPress={dismissReminder}
              >
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Simple Chart Container */}
        <Pressable 
          style={({pressed}) => [styles.chartCard, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('SalesSummary')}
        >
          <Text style={styles.chartTitle}>Order Volume</Text>
          <View style={styles.chartContainer}>
            {volumeLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, alignSelf: 'center' }} />
            ) : (
              (weeklyVolume || [0,0,0,0,0,0,0]).map((vol, idx) => {
                const heightPercentage = Math.max((vol / maxVolume) * 100, 5); // min 5% height to be visible
                const isToday = idx === weekRange.currentDayIndex;
                const isFuture = idx > weekRange.currentDayIndex;
                
                return (
                  <View 
                    key={idx} 
                    style={[
                      styles.bar, 
                      { 
                        height: `${heightPercentage}%`, 
                        backgroundColor: isFuture ? COLORS.surfaceContainerHigh : (isToday ? COLORS.primary : COLORS.primaryContainer),
                        opacity: isFuture ? 0.3 : 1
                      }
                    ]} 
                  />
                );
              })
            )}
          </View>
          <View style={styles.chartXAxis}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <Text 
                key={day} 
                style={[
                  styles.chartXLabel,
                  idx === weekRange.currentDayIndex && { color: COLORS.primary, fontWeight: '700' }
                ]}
              >
                {day}
              </Text>
            ))}
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerHigh,
  },
  headerLeft: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bellButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: -4,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  welcomeSection: {
    paddingVertical: 16,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onBackground,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statIconPrimary: {
    fontSize: 20,
    color: COLORS.primary,
  },
  statIconSecondary: {
    fontSize: 20,
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  urgentCard: {
    backgroundColor: COLORS.tertiaryContainer,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  urgentIcon: {
    fontSize: 20,
  },
  urgentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.tertiary,
  },
  urgentBody: {
    fontSize: 16,
    color: COLORS.onTertiaryContainer,
    marginBottom: 16,
    lineHeight: 22,
  },
  urgentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  tagButton: {
    backgroundColor: COLORS.tertiary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  tagButtonText: {
    color: COLORS.onTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
  },
  dismissButtonText: {
    color: COLORS.tertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  chartCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 16,
  },
  chartContainer: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    paddingBottom: 8,
  },
  bar: {
    flex: 1,
    marginHorizontal: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chartXLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
});
