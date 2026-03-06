import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Colors } from '../theme';
import { registerToastRef } from './toast';

const TOAST_TYPES = {
    success: { bar: Colors.success },
    error: { bar: Colors.danger },
    info: { bar: Colors.accent },
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const show = useCallback((type, message, title) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, message, title }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, type === 'error' ? 4000 : 3000);
    }, []);

    // Register ref so imperative toast.success/error calls work from anywhere
    useEffect(() => {
        registerToastRef(show);
    }, [show]);

    const dismiss = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    return (
        <>
            {children}
            <View style={styles.container} pointerEvents="box-none">
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
                ))}
            </View>
        </>
    );
}

function ToastItem({ toast, onDismiss }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-14)).current;
    const cfg = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(opacity, { toValue: 1, useNativeDriver: true, speed: 32, bounciness: 4 }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 32, bounciness: 4 }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
            <View style={[styles.bar, { backgroundColor: cfg.bar }]} />
            <View style={styles.content}>
                {toast.title ? <Text style={styles.title}>{toast.title}</Text> : null}
                <Text style={styles.message}>{toast.message}</Text>
            </View>
            <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute', top: 56, left: 0, right: 0, zIndex: 9999,
        paddingHorizontal: 14, gap: 8, pointerEvents: 'box-none',
    },
    toast: {
        flexDirection: 'row', backgroundColor: Colors.surface,
        borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder,
        shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
        overflow: 'hidden', minHeight: 52,
    },
    bar: { width: 4 },
    content: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' },
    title: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 1 },
    message: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
    closeBtn: { paddingHorizontal: 12, justifyContent: 'center' },
    closeText: { fontSize: 20, color: Colors.textMuted, lineHeight: 24 },
});
