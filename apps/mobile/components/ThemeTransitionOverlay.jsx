// components/ThemeTransitionOverlay.jsx
// Full-screen flash overlay that plays when the theme changes.
// It creates the illusion of a smooth crossfade rather than an abrupt swap.

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import useThemeStore from '../store/themeStore';

export default function ThemeTransitionOverlay() {
  const { isDark } = useThemeStore();
  const opacity = useRef(new Animated.Value(0)).current;
  // Track previous isDark so we only animate on change, not on mount
  const prevIsDark = useRef(isDark);

  useEffect(() => {
    if (prevIsDark.current === isDark) return; // no change, skip
    prevIsDark.current = isDark;

    // Flash: quickly fade to white/black, then fade back out
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.18,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDark]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          opacity,
          zIndex: 9999,
        },
      ]}
    />
  );
}
