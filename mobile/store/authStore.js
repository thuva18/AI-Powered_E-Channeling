// store/authStore.js
// Zustand store for authentication state with SecureStore persistence

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_user';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: async (user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearUser: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (partial) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...partial };
      SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(updated));
      set({ user: updated });
    }
  },
}));

export default useAuthStore;
