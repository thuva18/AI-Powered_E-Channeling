// store/themeStore.js
// Zustand store for theme (dark/light mode) with AsyncStorage persistence

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme';

const useThemeStore = create((set) => ({
  isDark: true, // default: dark mode
  isLoaded: false,

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored !== null) {
        set({ isDark: stored === 'dark', isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  toggleTheme: async () => {
    set((state) => {
      const newIsDark = !state.isDark;
      AsyncStorage.setItem(THEME_KEY, newIsDark ? 'dark' : 'light').catch(() => {});
      return { isDark: newIsDark };
    });
  },

  setDark: async (isDark) => {
    await AsyncStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    set({ isDark });
  },
}));

export default useThemeStore;
