import axios from 'axios';
import storage from '../utils/storage';
import { Platform } from 'react-native';


// On Android, "localhost" refers to the device itself.
// Use the dev machine's LAN IP instead.
// Update this IP if your network changes (check Metro output for current IP).
const DEV_MACHINE_IP = '172.18.2.17';
const BASE_HOST = Platform.OS === 'android' ? DEV_MACHINE_IP : 'localhost';

const api = axios.create({
    //baseURL: `http://${BASE_HOST}:5000/api`,

    // GBills backend (Google Play Billing version):
    // baseURL: `https://art-finance-management.onrender.com/api`,

    // V2RA backend (Razorpay version) — update this URL before deploying
    baseURL: `https://art-finance-management-v2ra.onrender.com/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach token to every request if available
api.interceptors.request.use(
    async (config) => {
        const token = await storage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },

    (error) => Promise.reject(error)
);

// Module-level callback registered by AuthProvider to clear session
let _onAuthLogout = null;
export function setAuthLogoutHandler(fn) {
    _onAuthLogout = fn;
}

// Global response interceptor: intercept 401 Unauthorized / TokenExpired
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        const msg = error?.response?.data?.message || '';

        // Check if token is expired or access is denied due to invalid/expired token
        const isAuthError = status === 401;
        const isLoginOrRegister = error?.config?.url?.includes('/auth/login') || error?.config?.url?.includes('/auth/register');

        // Only auto-logout if it's an authenticated request (not bad credentials during login)
        if (isAuthError && !isLoginOrRegister) {
            if (_onAuthLogout) {
                _onAuthLogout(msg || 'Your session has expired. Please log in again.');
            } else {
                await storage.removeItem('token');
                await storage.removeItem('user');
            }
        }

        return Promise.reject(error);
    }
);

export default api;
