import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface DailyReminderBannerProps {
  onPress: () => void;
  onDismiss: () => void;
}

export const DailyReminderBanner = ({ onPress, onDismiss }: DailyReminderBannerProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.content}>
        <Text style={styles.iconText}>⚠️</Text>
        <Text style={styles.text}>Mark today's near-expiry items</Text>
      </View>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={onDismiss} 
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7', // Amber-50
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A', // Amber-200
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconText: {
    fontSize: 18,
  },
  text: {
    color: '#92400E', // Amber-700
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeText: {
    color: '#92400E',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
