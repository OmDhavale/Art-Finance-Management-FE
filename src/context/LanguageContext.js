import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../localization/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLanguage() {
            try {
                const savedLang = await AsyncStorage.getItem('app_language');
                if (savedLang) {
                    setCurrentLanguage(savedLang);
                }
            } catch (e) {
                // Keep default
            } finally {
                setLoading(false);
            }
        }
        loadLanguage();
    }, []);

    const changeLanguage = async (langCode) => {
        if (langCode === currentLanguage) return;
        try {
            await AsyncStorage.setItem('app_language', langCode);
            setCurrentLanguage(langCode);
        } catch (e) {
            // Failed to save but update state anyway
            setCurrentLanguage(langCode);
        }
    };

    const t = (key) => {
        const langPack = translations[currentLanguage] || translations.en;
        return langPack[key] || translations.en[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t, loading }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
