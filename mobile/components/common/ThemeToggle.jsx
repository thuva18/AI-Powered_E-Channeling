// components/common/ThemeToggle.jsx
// Animated dark/light mode toggle button for use in headers

import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import useStyles from '../../hooks/useStyles';

import { useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';

export default function ThemeToggle({ size = 40 }) {
  const styles = useStyles(getStyles);
  const { C, isDark, toggleTheme } = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.7, duration: 120, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(rotateAnim, { toValue: isDark ? 1 : 0, duration: 280, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
    ]).start();
  }, [isDark]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.75}
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
        },
      ]}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
    >
      <Animated.View style={{ transform: [{ rotate }, { scale: scaleAnim }] }}>
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={size * 0.45}
          color={isDark ? '#F5A623' : '#4E9AF1'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const getStyles = (C, isDark) => StyleSheet.create({
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
