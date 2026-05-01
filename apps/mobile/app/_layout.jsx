// app/_layout.jsx
// Root layout – loads auth + theme state and redirects to the correct role dashboard

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { DARK_COLORS, LIGHT_COLORS } from '../constants/theme';

function buildPaperTheme(isDark) {
  const C = isDark ? DARK_COLORS : LIGHT_COLORS;
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: C.primary,
      background: C.bg,
      surface: C.bgCard,
      onSurface: C.textPrimary,
      secondary: C.accent,
    },
  };
}

function AuthGuard({ children }) {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    const inAuth = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && (inAuth || segments.length === 0 || segments[0] === undefined)) {
      const role = (user?.role || '').toLowerCase();
      if (role === 'patient') router.replace('/(patient)/home');
      else if (role === 'doctor') router.replace('/(doctor)/home');
      else if (role === 'admin') router.replace('/(admin)/home');
      else router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments, user]);

  const { isDark } = useThemeStore();
  const C = isDark ? DARK_COLORS : LIGHT_COLORS;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const { loadUser } = useAuthStore();
  const { isDark, loadTheme } = useThemeStore();

  useEffect(() => {
    loadUser();
    loadTheme();
  }, []);

  const C = isDark ? DARK_COLORS : LIGHT_COLORS;
  const paperTheme = buildPaperTheme(isDark);

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={C.bg} />
      <AuthGuard>
        <Stack
          key={isDark ? 'dark' : 'light'}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.bg },
            animation: 'slide_from_right',
          }}
        />
      </AuthGuard>
    </PaperProvider>
  );
}
