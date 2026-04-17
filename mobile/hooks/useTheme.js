// hooks/useTheme.js
// Convenience hook that returns theme colors, shadows, and isDark flag

import useThemeStore from '../store/themeStore';
import { getColors, getShadows } from '../constants/theme';

export default function useTheme() {
  const { isDark, toggleTheme } = useThemeStore();
  const C = getColors(isDark);
  const S = getShadows(isDark);
  return { C, S, isDark, toggleTheme };
}
