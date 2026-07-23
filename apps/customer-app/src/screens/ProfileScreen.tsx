import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Radii, ProfileHeader, Shadows } from '@quicky/ui-kit';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import auth from '@react-native-firebase/auth';
import { useQuery } from '@tanstack/react-query';
import firestore from '@react-native-firebase/firestore';

export const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuthStore();
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const doc = await firestore().collection('users').doc(user.uid).get();
      const data = doc.data();
      if (!data) return null;
      return {
        name: data['name'] as string,
        phone: data['phone'] as string,
      };
    },
    enabled: !!user?.uid,
  });

  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('CompleteProfile');
  };

  const menuItems = [
    {
      icon: 'map-pin',
      label: 'Saved Addresses',
      subtitle: 'Home, Work & Others',
      onPress: () => navigation.navigate('ManageAddresses'),
    },
    {
      icon: 'clock',
      label: 'Order History',
      subtitle: 'Past purchases & invoices',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      icon: 'help-circle',
      label: 'Help & Support',
      subtitle: 'Report an issue or bug',
      onPress: () => navigation.navigate('Feedback'),
    },
    {
      icon: 'info',
      label: 'About Quicky',
      subtitle: 'App Version & Philosophy',
      onPress: () => navigation.navigate('About'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topAppBar}>
        <Image 
          source={require('../../assests/icon.png')} 
          style={{ width: 100, height: 40, resizeMode: 'contain' }} 
        />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <ProfileHeader
          name={userProfile?.name || user?.displayName || 'Guest User'}
          phone={userProfile?.phone || user?.phoneNumber || 'Add phone number'}
          isVerified={true}
          onEditPress={handleEditProfile}
        />

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
                index === 2 && { marginTop: Spacing.lg } // Added margin before Help & Support per design
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Feather name={item.icon as any} size={20} color={Colors.textSecondary} />
                </View>
                <View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
                </View>
              </View>
              <Feather name="chevron-right" size={24} color={Colors.outline} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Feather name="log-out" size={20} color={Colors.textSecondary} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>App Version 1.0.0 (Pilot)</Text>
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
  topAppBar: {
    height: 56,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  appBarTitle: {
    fontFamily: 'Inter_900Black',
    fontSize: 24,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  container: {
    paddingBottom: 100, // padding for bottom nav
  },
  menuContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.level1,
  },
  lastMenuItem: {
    marginBottom: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eaefee', // surface-container
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  menuSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  logoutSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: Radii.pill,
    borderWidth: 2,
    borderColor: '#bdc9c9', // outline-variant
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  versionText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    color: Colors.outline,
    marginTop: Spacing.md,
  },
});
