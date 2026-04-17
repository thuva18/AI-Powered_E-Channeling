import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import useStyles from '../hooks/useStyles';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import { COLORS as C, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function IndexScreen() {
  const styles = useStyles(getStyles);
  const { isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) return null;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2670&auto=format&fit=crop' }}
        style={styles.bgImage}
        blurRadius={2}
      >
        <LinearGradient
          colors={['rgba(8, 12, 24, 0.4)', 'rgba(8, 12, 24, 0.95)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[C.primary, C.primaryDark]}
                style={styles.logoCircle}
              >
                <Ionicons name="medkit" size={50} color={C.white} />
              </LinearGradient>
              <Text style={styles.appName}>Medicare</Text>
              <Text style={styles.appNameSub}>E-Channeling</Text>
              <View style={styles.divider} />
              <Text style={styles.tagline}>Smart Healthcare at Your Fingertips</Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Secure · Intelligent · Reliable</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const getStyles = (C, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.glowBlue,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: C.white,
    letterSpacing: -1,
    lineHeight: 42,
  },
  appNameSub: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '300',
    color: C.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginTop: 4,
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: C.primary,
    borderRadius: 2,
    marginVertical: SPACING.lg,
  },
  tagline: {
    fontSize: FONT_SIZES.md,
    color: C.textSecondary,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
