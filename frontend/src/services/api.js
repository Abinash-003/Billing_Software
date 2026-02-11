import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

api.interceptors.request.use(
    (config) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
        } catch (_) {}
        return config;
    },
    (err) => Promise.reject(err)
);

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        const message = error.response?.data?.message || error.message || 'Network error';
        return Promise.reject({ message, response: error.response, data: error.response?.data });
    }
);

/** Get payload from backend response. Backend returns { success, data }. */
export function getData(res) {
    return res?.data ?? res;
}

export default api;
