// constants/theme.js
// Design tokens for AI E-Channeling mobile app — supports dark & light mode
// COLORS is a reactive proxy that auto-reads from the current theme store state

import useThemeStore from '../store/themeStore';

// ── DARK THEME ──────────────────────────────────────────────────────────────
export const DARK_COLORS = {
  primary: '#4E9AF1',
  primaryDark: '#2E6AC1',
  primaryLight: '#A8D1FF',
  accent: '#22C9A0',
  accentDark: '#1A9E7E',
  success: '#2EB872',
  warning: '#F5A623',
  error: '#E84545',
  info: '#4E9AF1',
  bg: '#080C18',
  bgCard: '#111827',
  bgElevated: '#1A2235',
  bgInput: '#1A2235',
  textPrimary: '#F0F4FF',
  textSecondary: '#8A96B3',
  textMuted: '#4A5570',
  textInverse: '#080C18',
  border: '#1E2840',
  borderLight: '#2A3550',
  patientPrimary: '#4E9AF1',
  doctorPrimary: '#22C9A0',
  adminPrimary: '#9B59F5',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.7)',
  tabBar: 'rgba(19, 25, 41, 0.95)',
  tabBarBorder: 'rgba(255,255,255,0.05)',
  gradientPatientStart: '#1A3A6E',
  gradientPatientEnd: '#0D1B38',
  gradientDoctorStart: '#0D3B2E',
  gradientDoctorEnd: '#071A14',
  gradientAdminStart: '#2A1560',
  gradientAdminEnd: '#10082A',
};

// ── LIGHT THEME ─────────────────────────────────────────────────────────────
export const LIGHT_COLORS = {
  primary: '#2E7DE0',
  primaryDark: '#1A5EB8',
  primaryLight: '#C7E0FF',
  accent: '#0FA87B',
  accentDark: '#0A7D5C',
  success: '#18A25A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2E7DE0',
  bg: '#F0F4FA',
  bgCard: '#FFFFFF',
  bgElevated: '#EFF3FB',
  bgInput: '#F5F8FF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#CBD5E1',
  patientPrimary: '#2E7DE0',
  doctorPrimary: '#0FA87B',
  adminPrimary: '#7C3AED',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.5)',
  tabBar: 'rgba(255,255,255,0.97)',
  tabBarBorder: 'rgba(0,0,0,0.08)',
  gradientPatientStart: '#C7E0FF',
  gradientPatientEnd: '#EFF6FF',
  gradientDoctorStart: '#C7F7E8',
  gradientDoctorEnd: '#EFFDF8',
  gradientAdminStart: '#E8D9FF',
  gradientAdminEnd: '#F5F0FF',
};

// ── Helper: get colors by mode ───────────────────────────────────────────────
export const getColors = (isDark = true) => (isDark ? DARK_COLORS : LIGHT_COLORS);

// ── Reactive COLORS proxy ────────────────────────────────────────────────────
// This lets existing screens that import { COLORS } auto-adapt to theme changes
// without needing to be rewritten. The proxy reads isDark from the store.
const _colorsProxy = new Proxy({}, {
  get(_, prop) {
    const isDark = useThemeStore.getState().isDark;
    const palette = isDark ? DARK_COLORS : LIGHT_COLORS;
    return palette[prop];
  },
});
export const COLORS = _colorsProxy;

// ── SHADOWS ──────────────────────────────────────────────────────────────────
const darkShadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12 },
  glowBlue: { shadowColor: '#4E9AF1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  glowGreen: { shadowColor: '#22C9A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
};
const lightShadows = {
  sm: { shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  md: { shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  lg: { shadowColor: '#64748b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 18, elevation: 12 },
  glowBlue: { shadowColor: '#2E7DE0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  glowGreen: { shadowColor: '#0FA87B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
};

export const getShadows = (isDark = true) => (isDark ? darkShadows : lightShadows);

// Reactive SHADOWS proxy
export const SHADOWS = new Proxy({}, {
  get(_, prop) {
    const isDark = useThemeStore.getState().isDark;
    return (isDark ? darkShadows : lightShadows)[prop];
  },
});

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
  xxl: 32,
  full: 999,
};
