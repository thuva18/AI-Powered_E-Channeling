// app/_layout.tsx
// Root layout – loads auth state and redirects to the correct role dashboard

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import useAuthStore from '../store/authStore';
import { COLORS } from '../constants/theme';

// Custom Material Design 3 dark theme matching our design system
const appTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    background: COLORS.bg,
    surface: COLORS.bgCard,
    onSurface: COLORS.textPrimary,
    secondary: COLORS.accent,
  },
};

function AuthGuard({ children }) {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuth) {
      // If not authenticated and trying to access protected route (including root '/')
      router.replace('/(auth)/login');
    } else if (isAuthenticated && (inAuth || segments.length === 0 || segments[0] === undefined)) {
      // If authenticated and trying to access login page OR root '/'
      const role = (user?.role || '').toLowerCase();
      if (role === 'patient') router.replace('/(patient)/home');
      else if (role === 'doctor') router.replace('/(doctor)/home');
      else if (role === 'admin') router.replace('/(admin)/home');
      else router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments, user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <PaperProvider theme={appTheme}>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      <AuthGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.bg },
            animation: 'slide_from_right',
          }}
        />
      </AuthGuard>
    </PaperProvider>
  );
}
