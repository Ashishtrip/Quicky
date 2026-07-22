import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';

export type TimeRangeOption = 'TODAY' | 'WEEKLY' | 'ALL_TIME' | 'CUSTOM';

interface TimeRangeTabBarProps {
  activeTab: TimeRangeOption;
  onTabChange: (tab: TimeRangeOption) => void;
  customDateLabel?: string; // Optional label to show when CUSTOM is selected
}

export const TimeRangeTabBar: React.FC<TimeRangeTabBarProps> = ({ 
  activeTab, 
  onTabChange,
  customDateLabel 
}) => {
  const tabs: { key: TimeRangeOption; label: string }[] = [
    { key: 'TODAY', label: 'Today' },
    { key: 'WEEKLY', label: 'Weekly' },
    { key: 'ALL_TIME', label: 'All Time' },
    { key: 'CUSTOM', label: activeTab === 'CUSTOM' && customDateLabel ? customDateLabel : 'Custom' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabChange(tab.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#007AFF', // Example primary color
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
});
