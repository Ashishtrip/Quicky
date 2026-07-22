import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSalesMetrics } from '@quicky/api-client';
import { TimeRangeTabBar, TimeRangeOption } from '../components/sales/TimeRangeTabBar';
import { useAuthStore } from '../stores/authStore';

const COLORS = {
  background: '#f6fafa',
  surface: '#f6fafa',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer: '#eaefee',
  primary: '#00696c',
  primaryContainer: '#57c0c4',
  onPrimaryContainer: '#004c4e',
  secondary: '#516607',
  secondaryContainer: '#d3ed84',
  onSecondaryContainer: '#161e00',
  outline: '#6d797a',
  greenBg: '#E8F5E9',
  greenText: '#2E7D32',
  error: '#ba1a1a',
};

export const BasicSalesScreen = () => {
  const STORE_ID = useAuthStore(state => state.user!.uid);
  const [activeTab, setActiveTab] = useState<TimeRangeOption>('WEEKLY');
  const [customStart, setCustomStart] = useState<Date>(new Date());
  const [customEnd, setCustomEnd] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    if (activeTab === 'TODAY') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      return { start: startOfDay.toISOString(), end: endOfDay.toISOString() };
    }
    if (activeTab === 'WEEKLY') {
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
      return { start: startOfWeek.toISOString(), end: endOfDay.toISOString() };
    }
    if (activeTab === 'ALL_TIME') {
      return { start: undefined, end: undefined };
    }
    if (activeTab === 'CUSTOM') {
      return { 
        start: customStart.toISOString(), 
        end: customEnd.toISOString() 
      };
    }
    return { start: undefined, end: undefined };
  }, [activeTab, customStart, customEnd]);

  const { data, isLoading, isError, refetch } = useSalesMetrics(STORE_ID, dateRange.start, dateRange.end);

  const handleTabChange = (tab: TimeRangeOption) => {
    setActiveTab(tab);
    if (tab === 'CUSTOM') {
      setShowPicker('start');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
       if (showPicker === 'start') {
         setActiveTab('WEEKLY');
         setShowPicker(null);
       } else {
         setShowPicker(null);
       }
       return;
    }
    
    if (selectedDate) {
      if (showPicker === 'start') {
        setCustomStart(selectedDate);
        setShowPicker('end');
      } else {
        setCustomEnd(selectedDate);
        setShowPicker(null);
      }
    }
  };

  const customLabel = `${customStart.toLocaleDateString()} - ${customEnd.toLocaleDateString()}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fake Header to match design if used standalone */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIconText}>🏪</Text>
        </View>
        <Text style={styles.title}>Quicky</Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerIconText}>🔔</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Weekly Summary</Text>
        </View>

        <TimeRangeTabBar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          customDateLabel={customLabel}
        />

        {isError ? (
          <TouchableOpacity style={styles.errorCard} onPress={() => refetch()}>
            <Text style={styles.errorText}>Could not load data.</Text>
            <Text style={styles.retryText}>Tap to Retry</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.gridContainer}>
            {/* Orders Fulfilled Card */}
            <Pressable style={({pressed}) => [styles.dataCard, pressed && styles.cardPressed]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>ORDERS FULFILLED</Text>
                <View style={styles.iconCirclePrimary}>
                  <Text style={styles.iconTextPrimary}>✓</Text>
                </View>
              </View>
              <View>
                <Text style={styles.statValue}>
                  {isLoading ? '...' : (data?.fulfilledOrders ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.statSubTextPrimary}>+12% vs last week</Text>
              </View>
            </Pressable>

            {/* Near-Expiry Units Sold Card */}
            <Pressable style={({pressed}) => [styles.dataCard, pressed && styles.cardPressed]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>NEAR-EXPIRY UNITS SOLD</Text>
                <View style={styles.iconCircleGreen}>
                  <Text style={styles.iconTextGreen}>🌱</Text>
                </View>
              </View>
              <View>
                <Text style={styles.statValue}>
                  {isLoading ? '...' : (data?.nearExpirySold ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.statSubTextGreen}>High conversion rate</Text>
              </View>
            </Pressable>

            {/* Impact Delivered Card */}
            <Pressable style={({pressed}) => [styles.impactCard, pressed && styles.cardPressed]}>
              <View style={styles.impactContent}>
                <Text style={styles.impactTitle}>Impact Delivered</Text>
                <Text style={styles.impactBody}>
                  You recovered <Text style={styles.impactHighlight}>₹2,450</Text> this week from near-expiry stock. Great job turning potential waste into profit!
                </Text>
              </View>
              <Text style={styles.impactDecal}>📈</Text>
            </Pressable>

            {/* Footer Stats */}
            <View style={styles.footerStatsContainer}>
              <View style={styles.footerStatCard}>
                <Text style={styles.footerStatIcon}>⏱️</Text>
                <Text style={styles.footerStatLabel}>Avg. Prep Time</Text>
                <Text style={styles.footerStatValue}>3m 12s</Text>
              </View>
              <View style={styles.footerStatCard}>
                <Text style={styles.footerStatIcon}>⭐</Text>
                <Text style={styles.footerStatLabel}>Customer Rating</Text>
                <Text style={styles.footerStatValue}>4.8</Text>
              </View>
              <View style={styles.footerStatCard}>
                <Text style={styles.footerStatIcon}>📋</Text>
                <Text style={styles.footerStatLabel}>Stock Accuracy</Text>
                <Text style={styles.footerStatValue}>99.2%</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'start' ? customStart : customEnd}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
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
    height: 56,
  },
  headerLeft: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerIconText: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for bottom nav
  },
  pageTitleContainer: {
    paddingVertical: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  gridContainer: {
    marginTop: 16,
    gap: 12,
  },
  dataCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    minHeight: 160,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
    flex: 1,
    paddingRight: 16,
  },
  iconCirclePrimary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconTextPrimary: {
    fontSize: 20,
    color: COLORS.onSecondaryContainer,
  },
  iconCircleGreen: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.greenBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconTextGreen: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  statSubTextPrimary: {
    fontSize: 16,
    color: COLORS.secondary,
    marginTop: 4,
  },
  statSubTextGreen: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: 4,
  },
  impactCard: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 12,
    padding: 24,
    minHeight: 140,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  impactContent: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '85%',
  },
  impactTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
    marginBottom: 8,
  },
  impactBody: {
    fontSize: 18,
    color: COLORS.onPrimaryContainer,
    lineHeight: 26,
  },
  impactHighlight: {
    fontWeight: '700',
  },
  impactDecal: {
    position: 'absolute',
    right: -16,
    top: -16,
    fontSize: 100,
    opacity: 0.2,
    color: COLORS.onPrimaryContainer,
  },
  footerStatsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  footerStatCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  footerStatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  footerStatLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
    textAlign: 'center',
  },
  footerStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  errorCard: {
    backgroundColor: '#ffebee',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    marginBottom: 8,
  },
  retryText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 16,
  },
});
