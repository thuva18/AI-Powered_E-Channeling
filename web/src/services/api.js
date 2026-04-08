import axios from 'axios';
import useAuthStore from '../store/authStore';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
    baseURL: apiBaseURL,
});

// Interceptor to attach JWT token to all requests
api.interceptors.request.use(
    (config) => {
        const user = useAuthStore.getState().user;
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
