import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Colors, Radii, Spacing, Typography, Interaction } from '../theme';

export interface CategoryChipItem {
  id: string;
  name: string;
  nameHindi?: string | null;
}

export interface CategoryChipRowProps {
  categories: CategoryChipItem[];
  selectedId: string | null; // null = "All"
  onSelect: (categoryId: string | null) => void;
}

/**
 * Horizontally scrollable category pill row.
 * "All" is always first and is the default (selectedId === null).
 *
 * Active: solid primary fill, white text.
 * Inactive: surface background, border.
 * Pill shape (full radius) for strong visual contrast against base 8px layout.
 */
export const CategoryChipRow: React.FC<CategoryChipRowProps> = ({
  categories,
  selectedId,
  onSelect,
}) => {
  const isAllActive = selectedId === null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scrollView}
    >
      {/* "All" chip */}
      <Pressable
        style={({ pressed }) => [
          styles.chip,
          isAllActive && styles.chipActive,
          pressed && styles.chipPressed,
        ]}
        onPress={() => onSelect(null)}
        accessibilityRole="button"
        accessibilityState={{ selected: isAllActive }}
      >
        <Text style={[styles.chipText, isAllActive && styles.chipTextActive]}>
          All
        </Text>
      </Pressable>

      {categories.map((cat) => {
        const isActive = selectedId === cat.id;
        return (
          <Pressable
            key={cat.id}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
            onPress={() => onSelect(cat.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.onPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
});
