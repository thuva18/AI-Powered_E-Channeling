// services/api.ts
// Axios instance with JWT interceptor – mirrors the web app's api.js

import axios from 'axios';
import useAuthStore from '../store/authStore';

// ─── Base URL ──────────────────────────────────────────────────────────────────
// Update BASE_URL after deploying backend to Render/Railway.
// For local dev: 'http://localhost:8000/api/v1'  (use your machine's local IP if
// testing on a physical device, e.g. 'http://192.168.1.10:8000/api/v1')
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

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
