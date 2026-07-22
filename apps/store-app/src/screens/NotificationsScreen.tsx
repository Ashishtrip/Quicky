import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#f6fafa',
  onSurface: '#171c1d',
  onSurfaceVariant: '#3d4949',
  primary: '#00696c',
  surfaceContainerLowest: '#ffffff',
  primaryContainer: '#57c0c4',
  onPrimaryContainer: '#004c4e',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  secondaryContainer: '#d3ed84',
  onSecondaryContainer: '#576c10',
  surfaceVariant: '#dfe3e3',
  outlineVariant: '#bdc9c9',
};

// We will map notification types to their corresponding styles
type NotificationType = 'task' | 'alert' | 'order' | 'audit';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'task',
    title: 'Task Reminder',
    message: 'Time to tag items expiring today. Please review the fresh produce section.',
    time: 'Just now',
    read: false,
  },
  {
    id: '2',
    type: 'alert',
    title: 'Low Stock Alert',
    message: 'Tomato stock auto-flagged unverified. Current count is below minimum...',
    time: '10m ago',
    read: false,
  },
  {
    id: '3',
    type: 'order',
    title: 'New Order',
    message: 'New order #Q-5022 received. Please start picking items for delivery.',
    time: '1h ago',
    read: false,
  },
  {
    id: '4',
    type: 'audit',
    title: 'Daily Audit',
    message: 'Complete the end-of-day register balancing and secure the premises.',
    time: 'Yesterday',
    read: true,
  },
];

const getIconConfig = (type: NotificationType) => {
  switch (type) {
    case 'task':
      return { bg: COLORS.primaryContainer, color: COLORS.onPrimaryContainer, icon: '🔔' };
    case 'alert':
      return { bg: COLORS.errorContainer, color: COLORS.onErrorContainer, icon: '⚠️' };
    case 'order':
      return { bg: COLORS.secondaryContainer, color: COLORS.onSecondaryContainer, icon: '🛍️' };
    case 'audit':
      return { bg: COLORS.surfaceVariant, color: COLORS.onSurfaceVariant, icon: '📋' };
    default:
      return { bg: COLORS.surfaceVariant, color: COLORS.onSurfaceVariant, icon: '📄' };
  }
};

export const NotificationsScreen = () => {
  const renderItem = ({ item }: { item: NotificationItem }) => {
    const iconConfig = getIconConfig(item.type);
    
    return (
      <Pressable 
        style={({ pressed }) => [
          styles.card,
          item.read && styles.cardRead,
          pressed && styles.cardPressed
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
          <Text style={[styles.icon, { color: iconConfig.color }]}>{iconConfig.icon}</Text>
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.time, !item.read && styles.timeUnread]}>{item.time}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Handled by React Navigation header but we can add a title if needed or keep it clean */}
      <FlatList
        data={mockNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardRead: {
    opacity: 0.75,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#f0f4f4', // surface-container-low
    borderColor: COLORS.outlineVariant,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  timeUnread: {
    color: COLORS.primary,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.onSurfaceVariant,
  },
});
