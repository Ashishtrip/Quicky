import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MetricCardProps {
  title: string;
  value: number | string;
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, isLoading }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {isLoading ? (
        <Text style={styles.loadingText}>...</Text>
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  value: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333333',
  },
  loadingText: {
    fontSize: 48,
    color: '#cccccc',
  },
});
