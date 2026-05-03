// components/common/ThemeToggle.jsx
// Animated dark/light mode toggle button for use in headers

import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';

export default function ThemeToggle({ size = 40 }) {
  const { C, isDark, toggleTheme } = useTheme();

  // Rotate + scale for the icon swap animation
  const rotateAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Shrink → rotate → bounce back
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.55, duration: 100, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(rotateAnim, { toValue: isDark ? 1 : 0, duration: 0, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, [isDark]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePress = () => {
    // Extra bounce on the button itself
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    toggleTheme();
  };

  const iconColor   = isDark ? '#F5A623' : '#4E9AF1';
  const iconName    = isDark ? 'sunny' : 'moon';
  const btnBg       = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const btnBorder   = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: btnBg,
          borderColor: btnBorder,
        },
      ]}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
    >
      <Animated.View
        style={{
          transform: [{ rotate }, { scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      >
        <Ionicons name={iconName} size={size * 0.46} color={iconColor} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});

