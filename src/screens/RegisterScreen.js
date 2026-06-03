import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, Animated, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';
import { toast } from '../utils/toast';

// Lightning bolt inside orange circle (same as Login mockup)
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

// Feature chips at bottom
function FeatureChip({ iconName, label }) {
    return (
        <View style={styles.featureChip}>
            <Feather name={iconName} size={16} color={Colors.primary} />
            <Text style={styles.featureLabel}>{label}</Text>
        </View>
    );
}

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const [form, setForm] = useState({ name: '', workshopName: '', phone: '', password: '', area: '', city: '' });
    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

    const handleRegister = async () => {
        const { name, workshopName, phone, password } = form;
        if (!name || !workshopName || !phone || !password) {
            toast.error('Name, workshop name, phone, and password are required.');
            return;
        }
        setLoading(true);
        try {
            await register(form);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Registration failed.', 'Registration Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

                <Animated.View style={[styles.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                    {/* Logo */}
                    <View style={styles.logoWrap}>
                        <LogoIcon />
                    </View>

                    <Text style={styles.heading}>Register Workshop</Text>
                    <Text style={styles.sub}>Join our community of Murtikars and{'\n'}manage your business efficiently.</Text>

                    <View style={styles.fieldGap} />

                    {/* Owner Full Name */}
                    <Text style={styles.fieldLabel}>Owner Full Name</Text>
                    <InputField
                        value={form.name}
                        onChangeText={set('name')}
                        placeholder="e.g. Rajesh Patil"
                        autoCapitalize="words"
                        iconName="user"
                    />

                    {/* Workshop Name */}
                    <Text style={styles.fieldLabel}>Workshop Name</Text>
                    <InputField
                        value={form.workshopName}
                        onChangeText={set('workshopName')}
                        placeholder="e.g. Om Ganpati Arts"
                        autoCapitalize="words"
                        iconName="briefcase"
                    />

                    {/* Phone */}
                    <Text style={styles.fieldLabel}>Phone Number</Text>
                    <InputField
                        value={form.phone}
                        onChangeText={set('phone')}
                        placeholder="10-digit mobile number"
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        iconName="phone"
                    />

                    {/* City + Area side by side */}
                    <View style={styles.rowFields}>
                        <View style={styles.halfField}>
                            <Text style={styles.fieldLabel}>City</Text>
                            <InputField
                                value={form.city}
                                onChangeText={set('city')}
                                placeholder="Pune"
                                autoCapitalize="words"
                                iconName="map-pin"
                                style={styles.noMargin}
                            />
                        </View>
                        <View style={styles.halfField}>
                            <Text style={styles.fieldLabel}>Area</Text>
                            <InputField
                                value={form.area}
                                onChangeText={set('area')}
                                placeholder="Kothrud"
                                autoCapitalize="words"
                                iconName="map-pin"
                                style={styles.noMargin}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.fieldGapSm} />
                    <Text style={styles.fieldLabel}>Create Password</Text>
                    <InputField
                        value={form.password}
                        onChangeText={set('password')}
                        placeholder="Min. 6 characters"
                        secureTextEntry
                        autoCapitalize="none"
                        iconName="lock"
                    />

                    {/* Submit */}
                    <PrimaryButton
                        title="Create Account"
                        iconName="arrow-right"
                        onPress={handleRegister}
                        loading={loading}
                        style={styles.btn}
                    />

                    {/* Feature chips */}
                    <View style={styles.featureRow}>
                        <FeatureChip iconName="check-circle" label={`Booking\nTracking`} />
                        <FeatureChip iconName="check-circle" label={`Payment\nAlerts`} />
                        <FeatureChip iconName="check-circle" label={`Financial\nReports`} />
                    </View>

                    {/* Login link */}
                    <View style={styles.loginRow}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginLink}>Login here</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    container: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 56, paddingBottom: 40 },
    body: {},

    // Logo
    logoWrap: { alignItems: 'center', marginBottom: Spacing.lg },
    logoCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: Colors.white,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.cardBorder,
        ...Shadow.md,
    },
    logoImage: { width: 80, height: 80 },

    heading: { fontSize: Font.xl + 2, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
    sub: { fontSize: Font.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 21 },

    fieldGap: { height: Spacing.xl },
    fieldGapSm: { height: Spacing.sm },
    fieldLabel: { fontSize: Font.sm, color: Colors.textPrimary, fontWeight: '600', marginBottom: 6 },

    // Side-by-side city+area
    rowFields: { flexDirection: 'row', gap: Spacing.md },
    halfField: { flex: 1 },
    noMargin: { marginBottom: 0 },

    btn: { marginTop: Spacing.sm, marginBottom: Spacing.xl },

    // Feature chips
    featureRow: {
        flexDirection: 'row', gap: Spacing.sm,
        backgroundColor: '#FFF7ED', borderRadius: Radius.lg,
        padding: Spacing.md, marginBottom: Spacing.lg,
        borderWidth: 1, borderColor: '#FED7AA',
    },
    featureChip: { flex: 1, alignItems: 'center', gap: 6 },
    featureLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center', lineHeight: 14 },

    // Login link
    loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    loginText: { fontSize: Font.sm, color: Colors.textSecondary },
    loginLink: { fontSize: Font.sm, color: Colors.primary, fontWeight: '700' },
});
