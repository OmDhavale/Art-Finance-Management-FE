import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const storage = {
    async setItem(key, value) {
        if (isWeb) {
            // For web, use cookies
            document.cookie = `${key}=${value}; path=/; max-age=604800; SameSite=Lax`;
        }
        // Always set in AsyncStorage for consistency/mobile
        await AsyncStorage.setItem(key, value);
    },

    async getItem(key) {
        if (isWeb) {
            const name = key + "=";
            const decodedCookie = decodeURIComponent(document.cookie);
            const ca = decodedCookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) === 0) {
                    return c.substring(name.length, c.length);
                }
            }
        }
        return await AsyncStorage.getItem(key);
    },

    async removeItem(key) {
        if (isWeb) {
            document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        }
        await AsyncStorage.removeItem(key);
    }
};

export default storage;
