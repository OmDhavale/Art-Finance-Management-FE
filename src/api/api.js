import axios from 'axios';
import storage from '../utils/storage';
import { Platform } from 'react-native';


// On Android, "localhost" refers to the device itself.
// Use the dev machine's LAN IP instead.
// Update this IP if your network changes (check Metro output for current IP).
const DEV_MACHINE_IP = '172.16.5.114';
const BASE_HOST = Platform.OS === 'android' ? DEV_MACHINE_IP : 'localhost';

const api = axios.create({
    baseURL: `http://${BASE_HOST}:5000/api`,
    //baseURL: `https://art-finance-management.onrender.com/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Store user info for role-based path logic
let currentUser = null;

// Attach token to every request if available
api.interceptors.request.use(
    async (config) => {
        const token = await storage.getItem('token');
        const userJson = await storage.getItem('user');
        if (userJson) {
            currentUser = JSON.parse(userJson);
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },

    (error) => Promise.reject(error)
);

/**
 * Get the correct endpoint prefix based on user role
 * Artists: /artists/bookings
 * Others: /bookings
 */
export const getBookingPath = () => {
    return currentUser?.role === 'sketch-artist' ? '/artists/bookings' : '/bookings';
};

/**
 * Get the correct endpoint prefix based on user role
 * Artists: /artists/mandals
 * Others: /mandals
 */
export const getMandalPath = () => {
    return currentUser?.role === 'sketch-artist' ? '/artists/mandals' : '/mandals';
};

export const getCurrentUser = () => currentUser;

export default api;
