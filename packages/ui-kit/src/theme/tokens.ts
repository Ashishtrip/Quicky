/**
 * Quicky Design System Tokens
 * ─────────────────────────────
 * Stitch "Corporate / Modern" UI
 * High-velocity grocery. Friendly, approachable, highly dense.
 * 
 * All components MUST reference these tokens — never hardcode hex values.
 */

// ─── Colors ────────────────────────────────────────────────────────

export const Colors = {
  // Core palette
  background: '#f6fafa',
  surface: '#ffffff',
  surfaceDim: '#d6dbdb',
  
  // Text
  textPrimary: '#171c1d',
  textSecondary: '#3d4949',
  textMuted: '#6d797a',

  // Borders & dividers
  border: '#bdc9c9',
  borderStrong: '#6d797a',
  outline: '#6d797a',
  divider: '#eaefee',

  // Freshness Meter — semantic signal, kept consistent but softer
  freshGreen: '#16A34A',
  freshGreenBg: '#DCFCE7',
  freshAmber: '#D97706',
  freshAmberBg: '#FEF3C7',
  freshRed: '#DC2626',
  freshRedBg: '#FEE2E2',

  // Accent / CTA
  primary: '#00696c',
  primaryContainer: '#57c0c4',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#004c4e',
  accent: '#00696c', // legacy compat
  accentText: '#ffffff', // legacy compat
  white: '#ffffff',
  black: '#000000',

  // Feedback
  success: '#16A34A',
  warning: '#D97706',
  error: '#ba1a1a',

  // Disabled
  disabled: '#dfe3e3',
  disabledText: '#6d797a',
} as const;

// ─── Typography ────────────────────────────────────────────────────

export const Typography = {
  display: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  h1: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.24,
  },
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
  },
  bodyLarge: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

// ─── Spacing (4pt baseline grid for dense UI) ──────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  gutter: 12,
} as const;

// ─── Border Radii ──────────────────────────────────────────────────

export const Radii = {
  /** Small elements */
  sm: 4,
  /** Base standard for inputs and buttons */
  base: 8,
  /** Cards, containers */
  lg: 12,
  card: 12, // legacy compat
  /** Buttons, badges — pill shapes */
  pill: 9999,
} as const;

// ─── Elevations / Shadows ──────────────────────────────────────────

export const Shadows = {
  /** No shadow — flat surface */
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  /** Level 1 (Cards): Soft diffused shadow */
  level1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  /** Level 2 (Active/Floating): Sticky bar and bottom nav */
  level2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// ─── Interaction Constants ─────────────────────────────────────────

export const Interaction = {
  /** Minimum tap target for mid-range Android (44dp minimum) */
  minTapTarget: 44,
  /** Fast linear transitions — no physics springs */
  transitionDuration: 150,
  /** Maximum transition for state changes */
  transitionDurationMax: 200,
} as const;
