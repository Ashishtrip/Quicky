import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radii } from '@quicky/ui-kit';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const AboutScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Quicky</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assests/Screenshot 2026-07-12 at 12.07.56 PM.png')} 
            style={styles.logoPlaceholder} 
          />
          <Text style={styles.appName}>Quicky</Text>
          <Text style={styles.versionText}>Version 1.0.0 (Pilot)</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Our Philosophy</Text>
          <Text style={styles.infoText}>
            At Quicky, we sell trust, not speed.
          </Text>
          <Text style={styles.infoText}>
            We know it's frustrating to buy something only to find out it expires tomorrow. That's why we never hide our expiry dates—we highlight them.
          </Text>
          <Text style={styles.infoText}>
            'Use Today' items are nearing their expiry, so we sell them at a steep, honest discount. 'Fresh Stock' means you're getting newly arrived inventory at the standard price. 
          </Text>
          <Text style={styles.infoText}>
            No tricks, no fine print. Whether you want to optimize your budget or prioritize freshness, the choice is always yours.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    fontFamily: 'Inter_900Black',
    fontSize: 48,
    color: Colors.primary,
  },
  appName: {
    fontFamily: 'Inter_900Black',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  versionText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
});
