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
                    const cachedUser = JSON.parse(savedUser);
                    setUser(cachedUser);
                    // Refresh the server-authoritative subscription entitlement on app launch.
                    try {
                        const billing = await api.get('/billing/status');
                        const refreshedUser = { ...cachedUser, ...billing.data.data };
                        await storage.setItem('user', JSON.stringify(refreshedUser));
                        setUser(refreshedUser);
                    } catch (billingError) {
                        // Keep the cached session available if the API is temporarily offline.
                        console.warn('Billing status refresh skipped:', billingError?.message);
                    }
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


    const logout = async () => {
        await storage.removeItem('token');
        await storage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    // ─── Account Deletion Helpers ─────────────────────────────────────────────

    /**
     * Request account deletion (7-day grace period).
     * Requires password confirmation.
     */
    const requestAccountDeletion = async (password) => {
        const response = await api.post('/users/request-account-deletion', { password });
        const { deletionRequestedAt, deletionScheduledFor } = response.data.data;
        const updatedUser = { ...user, deletionRequestedAt, deletionScheduledFor };
        setUser(updatedUser);
        await storage.setItem('user', JSON.stringify(updatedUser));
        return response.data;
    };

    /**
     * Cancel pending account deletion.
     * Clears deletion fields and restores account to normal.
     */
    const cancelAccountDeletion = async () => {
        const response = await api.post('/users/cancel-account-deletion');
        const updatedUser = { ...user, deletionRequestedAt: null, deletionScheduledFor: null };
        setUser(updatedUser);
        await storage.setItem('user', JSON.stringify(updatedUser));
        return response.data;
    };


    return (
        <AuthContext.Provider value={{
            user, token, loading,
            login, logout, register, setUser,
            requestAccountDeletion, cancelAccountDeletion,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
