import axios from 'axios';
import useAuthStore from '../store/authStore';

let envUrl = import.meta.env.VITE_API_BASE_URL;
if (envUrl && !envUrl.endsWith('/api/v1')) {
    envUrl += '/api/v1';
}
const apiBaseURL = envUrl || '/api/v1';

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
