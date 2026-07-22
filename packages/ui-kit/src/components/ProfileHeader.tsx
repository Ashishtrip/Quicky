import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Radii } from '../theme/tokens';
import { Feather } from '@expo/vector-icons';

export interface ProfileHeaderProps {
  name: string;
  phone: string;
  avatarUrl?: string;
  isVerified?: boolean;
  onEditPress?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  phone,
  avatarUrl,
  isVerified = true,
  onEditPress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.avatarContainer} onPress={onEditPress} activeOpacity={0.8}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.phone}>{phone}</Text>
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Feather name="check-circle" size={16} color={Colors.onPrimaryContainer} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#e4e9e9', // surface-container-high
    backgroundColor: '#f0f4f4', // surface-container-low
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f4f4',
  },
  avatarInitials: {
    ...Typography.h1,
    color: Colors.textSecondary,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  phone: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(87, 192, 196, 0.2)', // primary-container/20
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  verifiedText: {
    ...Typography.caption,
    color: Colors.onPrimaryContainer,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 4,
  },
});
