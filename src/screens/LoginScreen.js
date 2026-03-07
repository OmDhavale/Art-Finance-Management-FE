import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView,
    Animated, StatusBar, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';
import { toast } from '../utils/toast';

function LogoIcon() {
    return (
        <View style={styles.logoCircle}>
            <Image
                source={require('../../assets/ganesha_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
            />
        </View>
    );
}

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

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

                {/* Logo + tagline */}
                <View style={styles.banner}>
                    <LogoIcon />
                    <Text style={styles.tagline}>Empowering Artisans, Managing Traditions</Text>
                </View>

                {/* Login card */}
                <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.cardTitle}>Login</Text>
                    <Text style={styles.cardSub}>Enter your workshop credentials</Text>

                    <View style={styles.fieldGap} />

                    <InputField
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="e.g. 9876543210"
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        iconName="phone"
                    />
                    <View style={styles.passwordHeader}>
                        <Text style={styles.passwordLabel}>Password</Text>
                        <TouchableOpacity>
                            <Text style={styles.forgotLink}>Forgot?</Text>
                        </TouchableOpacity>
                    </View>
                    <InputField
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        secureTextEntry
                        autoCapitalize="none"
                        iconName="lock"
                    />

                    <PrimaryButton
                        title="Login"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.btn}
                        iconName="arrow-right"
                    />
                </Animated.View>

                {/* Divider */}
                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>NEW WORKSHOP?</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Register outlined button */}
                <PrimaryButton
                    title="Register Workshop"
                    variant="outlined"
                    onPress={() => navigation.navigate('Register')}
                    style={styles.registerBtn}
                />

                <Text style={styles.footer}>Jai Ganesh • Crafting Excellence Since 2024</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: 48 },

    // Logo
    banner: { alignItems: 'center', marginBottom: Spacing.xxl },
    logoCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: Colors.white,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder,
        ...Shadow.md,
    },
    logoImage: { width: 80, height: 80 },
    tagline: { fontSize: Font.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

    // Card
    card: {
        backgroundColor: Colors.card,
        borderRadius: Radius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        ...Shadow.md,
        marginBottom: Spacing.xl,
    },
    cardTitle: { fontSize: Font.xl + 2, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
    cardSub: { fontSize: Font.sm, color: Colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 4 },
    fieldGap: { height: Spacing.md },

    // Password row
    passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    passwordLabel: { fontSize: Font.sm, color: Colors.textPrimary, fontWeight: '600' },
    forgotLink: { fontSize: Font.sm, color: Colors.primary, fontWeight: '600' },

    btn: { marginTop: Spacing.md },

    // Divider
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg, gap: Spacing.sm },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.separator },
    dividerText: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.5 },

    registerBtn: { marginBottom: Spacing.xl },

    footer: { fontSize: Font.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
});
