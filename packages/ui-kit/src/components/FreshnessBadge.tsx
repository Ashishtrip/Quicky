import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radii, Typography } from '../theme';

export type FreshnessState = 'GREEN' | 'AMBER' | 'RED';

export interface FreshnessBadgeProps {
  state: FreshnessState;
  showText?: boolean;
}

const STATE_CONFIG: Record<FreshnessState, {
  bg: string;
  text: string;
  label: string;
  icon: string;
}> = {
  RED: {
    bg: Colors.freshRed,
    text: Colors.white,
    label: 'Use Today',
    icon: '⬇',  // Tag/discount indicator
  },
  AMBER: {
    bg: Colors.freshAmber,
    text: Colors.black,
    label: 'Soon',
    icon: '◷',  // Clock indicator
  },
  GREEN: {
    bg: Colors.freshGreen,
    text: Colors.white,
    label: 'Fresh',
    icon: '✓',  // Checkmark indicator
  },
};

/**
 * Quicky's signature "Freshness Meter" badge.
 *
 * Pill-shaped, filled background. Colour is NEVER the only signal —
 * always shows an icon + text label (a11y / colour-blind safe).
 */
export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({
  state,
  showText = true,
}) => {
  const config = STATE_CONFIG[state];

  return (
    <View
      style={[styles.container, { backgroundColor: config.bg }]}
      accessibilityLabel={`Freshness: ${config.label}`}
      accessibilityRole="text"
    >
      <Text style={[styles.icon, { color: config.text }]}>
        {config.icon}
      </Text>
      {showText && (
        <Text style={[styles.text, { color: config.text }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start',
    gap: 4,
  },
  icon: {
    fontSize: 10,
    fontWeight: '700',
  },
  text: {
    fontFamily: Typography.badge.fontFamily,
    fontSize: Typography.badge.fontSize,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
