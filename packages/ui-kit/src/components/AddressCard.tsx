import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Radii, Shadows } from '../theme/tokens';
import { Feather } from '@expo/vector-icons';

export interface AddressCardProps {
  label: string;
  addressText: string;
  isDefault?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  label,
  addressText,
  isDefault,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
}) => {
  const getIconForLabel = (l: string) => {
    const lbl = l.toLowerCase();
    if (lbl.includes('home')) return 'home';
    if (lbl.includes('work') || lbl.includes('office')) return 'briefcase';
    return 'map-pin';
  };

  const isHome = label.toLowerCase().includes('home');
  const iconBg = isHome ? 'rgba(87, 192, 196, 0.2)' : '#eaefee'; // primaryContainer/20 vs surfaceContainer
  const iconColor = isHome ? Colors.primaryContainer : Colors.textSecondary;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isSelected && styles.selectedContainer
      ]}
      onPress={onSelect}
      disabled={!onSelect}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Feather 
          name={getIconForLabel(label)} 
          size={20} 
          color={iconColor} 
        />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>DEFAULT</Text>
            </View>
          )}
        </View>
        <Text style={styles.addressText} numberOfLines={2}>
          {addressText}
        </Text>
      </View>
      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Feather name="edit-2" size={20} color={Colors.outline} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <Feather name="trash-2" size={20} color={Colors.outline} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface, // surface-container-lowest is white
    padding: Spacing.md,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#dfe3e3', // surface-variant
    ...Shadows.level1, // card-shadow
  },
  selectedContainer: {
    borderColor: Colors.primaryContainer,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  defaultBadge: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  defaultText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: Colors.onPrimaryContainer,
    textTransform: 'uppercase',
  },
  addressText: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
  },
});
