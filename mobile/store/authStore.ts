// store/authStore.ts
// Zustand store for authentication state with SecureStore persistence

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
  profileImage?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: AuthUser) => Promise<void>;
  clearUser: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
}

const TOKEN_KEY = 'auth_user';

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: async (user: AuthUser) => {
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
        const user = JSON.parse(stored) as AuthUser;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (partial: Partial<AuthUser>) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...partial };
      SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(updated));
      set({ user: updated });
    }
  },
}));

export default useAuthStore;
