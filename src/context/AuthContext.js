import React, { createContext, useContext, useState, useEffect } from 'react';
import storage from '../utils/storage';
import api from '../api/api';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on app start
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const savedToken = await storage.getItem('token');
                const savedUser = await storage.getItem('user');
                if (savedToken && savedUser) {
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                }

            } catch (e) {
                console.error('Session restore error:', e);
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    const login = async (phone, password) => {
        const response = await api.post('/auth/login', { phone, password });
        const { token: t, user: u } = response.data;
        await storage.setItem('token', t);
        await storage.setItem('user', JSON.stringify(u));
        setToken(t);
        setUser(u);
        return response.data;
    };


    const register = async (fields) => {
        const response = await api.post('/auth/register', fields);
        const { token: t, user: u } = response.data;
        await storage.setItem('token', t);
        await storage.setItem('user', JSON.stringify(u));
        setToken(t);
        setUser(u);
        return response.data;
    };


    const registerArtist = async (fields) => {
        const response = await api.post('/auth/register/artist', fields);
        const { token: t, user: u } = response.data;
        await storage.setItem('token', t);
        await storage.setItem('user', JSON.stringify(u));
        setToken(t);
        setUser(u);
        return response.data;
    };


    const logout = async () => {
        await storage.removeItem('token');
        await storage.removeItem('user');
        setToken(null);
        setUser(null);
    };


    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, register, registerArtist }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
