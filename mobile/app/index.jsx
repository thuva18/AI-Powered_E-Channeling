// app/index.jsx
// Splash / Landing screen – auto-redirects once auth loads

import { View, Text, StyleSheet } from 'react-native';
import useAuthStore from '../store/authStore';
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme';

export default function IndexScreen() {
  const { isLoading } = useAuthStore();

  if (isLoading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🏥</Text>
        </View>
        <Text style={styles.appName}>AI E-Channeling</Text>
        <Text style={styles.tagline}>Smart Healthcare at Your Fingertips</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
});
