import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1', // Development API URL
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
