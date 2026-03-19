import { create } from 'zustand';

// Modern global state management for Authentication
const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,

    login: (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        set({ user: userData });
    },

    logout: () => {
        localStorage.removeItem('user');
        set({ user: null });
        window.location.href = '/login'; // Force redirect to login
    },

    updateUser: (updates) => set((state) => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, ...updates };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { user: updatedUser };
    })
}));

export default useAuthStore;
