// services/api.js
// Axios instance with JWT interceptor – mirrors the web app's api.js

import axios from 'axios';
import useAuthStore from '../store/authStore';

// ─── Base URL ──────────────────────────────────────────────────────────────────
// Update BASE_URL after deploying backend to Render/Railway.
// Now securely pointing to the live Render backend!
// Use your local machine's IP (e.g. 192.168.x.x) if testing on a physical device
// The local backend from start_project.sh runs on port 8000
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.1.8:8000/api/v1'; // Local Dev
  // ?? 'https://echanneling-backend.onrender.com/api/v1'; // Production

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor – attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const user = useAuthStore.getState().user;
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor – handle 401 ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().clearUser();
    }
    return Promise.reject(error);
  },
);

export default api;
