import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/authStore';
import { useSalesMetrics, useWeeklyVolume } from '@quicky/api-client';

const COLORS = {
  background: '#f6fafa',
  surface: '#ffffff',
  surfaceVariant: '#dfe3e3',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  surfaceContainerHigh: '#e4e9e9',
  primaryContainer: '#57c0c4',
  primary: '#00696c',
  secondary: '#516607',
  secondaryContainer: '#d4ed80',
};

// Helper for date calculations
const getWeekRange = () => {
  const now = new Date();
  const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon, 6=Sun
  
  const start = new Date(now);
  start.setDate(now.getDate() - currentDayIndex);
  start.setHours(0,0,0,0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23,59,59,999);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    currentDayIndex
  };
};

export const SalesSummaryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuthStore();
  
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics(
    user?.uid, 
    todayStart.toISOString(), 
    todayEnd.toISOString()
  );

  const weekRange = useMemo(() => getWeekRange(), []);
  const { data: weeklyVolume, isLoading: volumeLoading } = useWeeklyVolume(
    user?.uid,
    weekRange.start,
    weekRange.end
  );

  const maxVolume = useMemo(() => {
    if (!weeklyVolume || weeklyVolume.length === 0) return 1;
    return Math.max(...weeklyVolume, 1);
  }, [weeklyVolume]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable 
          style={({pressed}) => [styles.backButton, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Sales Summary</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statIconPrimary}>🛒</Text>
              <Text style={styles.statLabel}>Orders Fulfilled</Text>
            </View>
            {metricsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <Text style={styles.statValue}>{metrics?.fulfilledOrders || 0}</Text>
            )}
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statIconSecondary}>💵</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
            {metricsLoading ? (
              <ActivityIndicator size="small" color={COLORS.secondary} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <Text style={styles.statValue}>₹{metrics?.todayEarnings?.toLocaleString('en-IN') || 0}</Text>
            )}
          </View>
        </View>

        <View style={styles.statCardFull}>
            <View style={styles.statHeader}>
              <Text style={styles.statIconSecondary}>🏷️</Text>
              <Text style={styles.statLabel}>Near-Expiry Items Sold</Text>
            </View>
            {metricsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <Text style={styles.statValue}>{metrics?.nearExpirySold || 0} units</Text>
            )}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Order Volume</Text>
          <View style={styles.chartContainer}>
            {volumeLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, alignSelf: 'center' }} />
            ) : (
              (weeklyVolume || [0,0,0,0,0,0,0]).map((vol, idx) => {
                const heightPercentage = Math.max((vol / maxVolume) * 100, 5); // min 5% height
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
        </View>

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
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerHigh,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardFull: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statIconPrimary: {
    fontSize: 20,
    backgroundColor: COLORS.primaryContainer,
    padding: 8,
    borderRadius: 12,
  },
  statIconSecondary: {
    fontSize: 20,
    backgroundColor: COLORS.secondaryContainer,
    padding: 8,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 24,
  },
  chartContainer: {
    height: 160,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  bar: {
    width: 32,
    borderRadius: 8,
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
    paddingTop: 12,
  },
  chartXLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    width: 32,
    textAlign: 'center',
  }
});
