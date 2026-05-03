// components/common/ScreenTransition.jsx
import React from 'react';
import { View } from 'react-native';

export default function ScreenTransition({ children, style }) {
  return (
    <View style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
}
