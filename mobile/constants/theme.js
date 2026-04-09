// constants/theme.ts
// Design tokens for AI E-Channeling mobile app

export const COLORS = {
  // Primary palette – deep medical blue/teal
  primary: '#4E9AF1',
  primaryDark: '#2E6AC1',
  primaryLight: '#A8D1FF',

  // Accent – medical green
  accent: '#22C9A0',
  accentDark: '#1A9E7E',

  // Status colors
  success: '#2EB872',
  warning: '#F5A623',
  error: '#E84545',
  info: '#4E9AF1',

  // Background layers (dark theme)
  bg: '#0A0E1A',
  bgCard: '#131929',
  bgElevated: '#1C2438',
  bgInput: '#1E2840',

  // Text
  textPrimary: '#F0F4FF',
  textSecondary: '#8A96B3',
  textMuted: '#4A5570',
  textInverse: '#0A0E1A',

  // Borders
  border: '#1E2840',
  borderLight: '#2A3550',

  // Role colors
  patientPrimary: '#4E9AF1',
  doctorPrimary: '#22C9A0',
  adminPrimary: '#9B59F5',

  // White/transparent
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.6)',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#4E9AF1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};
