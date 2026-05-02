// components/common/ScreenTransition.jsx
import React, { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from 'expo-router';

export default function ScreenTransition({ children, style }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useFocusEffect(
    useCallback(() => {
      // Reset values
      fadeAnim.setValue(0);
      slideAnim.setValue(20);

      // Play animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        // Optional: you can animate out when unfocusing, but usually resetting is fine
      };
    }, [fadeAnim, slideAnim])
  );

  return (
    <Animated.View
      style={[
        { flex: 1 },
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
