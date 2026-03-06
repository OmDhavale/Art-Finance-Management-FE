import React, { useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView,
    Animated, StatusBar, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing } from '../theme';
import { useState } from 'react';
import { toast } from '../utils/toast';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!phone.trim() || !password.trim()) {
            toast.error('Please enter phone and password.');
            return;
        }
        setLoading(true);
        try {
            await login(phone.trim(), password);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Login failed. Please try again.', 'Login Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

                <View style={styles.banner}>
                    <Image
                        source={require('../../assets/ganesha_logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>Ganesh Mandal</Text>
                    <Text style={styles.appSub}>Finance Tracker</Text>
                </View>

                <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.cardTitle}>Sign In</Text>

                    <InputField
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter your phone"
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                    />
                    <InputField
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    <PrimaryButton
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.btn}
                    />

                    <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkWrap}>
                        <Text style={styles.link}>New here? <Text style={styles.linkBold}>Create an account</Text></Text>
                    </TouchableOpacity>
                </Animated.View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
    banner: { alignItems: 'center', marginBottom: Spacing.xxl },
    logoImage: { width: 120, height: 120, marginBottom: Spacing.md },
    appName: { fontSize: Font.xxl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.5 },
    appSub: { fontSize: Font.sm, color: Colors.textMuted, marginTop: 4, letterSpacing: 1 },
    card: {
        backgroundColor: Colors.card,
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    },
    cardTitle: { fontSize: Font.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
    btn: { marginTop: Spacing.md },
    linkWrap: { marginTop: Spacing.lg, alignItems: 'center' },
    link: { color: Colors.textSecondary, fontSize: Font.sm },
    linkBold: { color: Colors.accent, fontWeight: '700' },
});
