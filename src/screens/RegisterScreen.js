import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, Animated, StatusBar, Linking,
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
    const [form, setForm] = useState({ name: '', workshopName: '', phone: '', password: '', confirmPassword: '', area: '', city: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    const passwordsMismatch = !!form.confirmPassword && form.password !== form.confirmPassword;
    const passwordsMatch = !!form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 6;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

    const handleOpenPrivacyPolicy = () => {
        Linking.openURL('https://artist-fin-manager.netlify.app/privacy-policy').catch(() => {
            toast.error('Unable to open privacy policy link.');
        });
    };

    const handleRegister = async () => {
        if (!agreedToPrivacy) {
            toast.error('Please agree to the Privacy Policy to continue.');
            return;
        }

        const { name, workshopName, phone, password, confirmPassword } = form;
        if (!name || !workshopName || !phone || !password || !confirmPassword) {
            toast.error('All fields including password confirmation are required.');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match. Please re-enter.');
            return;
        }

        setLoading(true);
        try {
            await register({
                name: form.name,
                workshopName: form.workshopName,
                phone: form.phone,
                password: form.password,
                area: form.area,
                city: form.city,
            });
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Registration failed.', 'Registration Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >

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
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        iconName="lock"
                        rightElement={
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeBtn}
                                accessible
                                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                            >
                                <Feather
                                    name={showPassword ? "eye" : "eye-off"}
                                    size={18}
                                    color={Colors.textMuted}
                                />
                            </TouchableOpacity>
                        }
                    />

                    {/* Confirm Password */}
                    <View style={styles.labelRow}>
                        <Text style={styles.fieldLabel}>Confirm Password</Text>
                        {passwordsMismatch && (
                            <View style={styles.errorBadge}>
                                <Feather name="alert-circle" size={12} color={Colors.danger} />
                                <Text style={styles.errorText}>Passwords do not match</Text>
                            </View>
                        )}
                        {passwordsMatch && (
                            <View style={styles.matchBadge}>
                                <Feather name="check-circle" size={12} color={Colors.success} />
                                <Text style={styles.matchText}>Passwords match</Text>
                            </View>
                        )}
                    </View>
                    <InputField
                        value={form.confirmPassword}
                        onChangeText={set('confirmPassword')}
                        placeholder="Re-enter password"
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        iconName={passwordsMismatch ? 'alert-triangle' : passwordsMatch ? 'check-circle' : 'lock'}
                        rightElement={
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.eyeBtn}
                                accessible
                                accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                <Feather
                                    name={showConfirmPassword ? "eye" : "eye-off"}
                                    size={18}
                                    color={Colors.textMuted}
                                />
                            </TouchableOpacity>
                        }
                    />

                    {/* Privacy Policy Checkbox */}
                    <View style={styles.privacyRow}>
                        <TouchableOpacity
                            style={[styles.checkbox, agreedToPrivacy && styles.checkboxActive]}
                            onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
                            activeOpacity={0.8}
                            accessible
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: agreedToPrivacy }}
                            accessibilityLabel="Agree to privacy policy"
                        >
                            {agreedToPrivacy && <Feather name="check" size={14} color={Colors.white} />}
                        </TouchableOpacity>

                        <Text style={styles.privacyText}>
                            I have read & agree to the{' '}
                            <Text
                                style={styles.privacyLink}
                                onPress={handleOpenPrivacyPolicy}
                            >
                                Privacy Policy
                            </Text>
                        </Text>
                    </View>

                    {/* Submit */}
                    <PrimaryButton
                        title="Create Account"
                        iconName="arrow-right"
                        onPress={handleRegister}
                        loading={loading}
                        disabled={!agreedToPrivacy}
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
    container: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 40, paddingBottom: 80 },
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
    eyeBtn: { padding: 4, marginLeft: 4 },

    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    errorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.dangerBg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    errorText: {
        fontSize: Font.xs,
        color: Colors.danger,
        fontWeight: '700',
    },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.successBg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    matchText: {
        fontSize: Font.xs,
        color: Colors.success,
        fontWeight: '700',
    },

    // Side-by-side city+area
    rowFields: { flexDirection: 'row', gap: Spacing.md },
    halfField: { flex: 1 },
    noMargin: { marginBottom: 0 },

    btn: { marginTop: Spacing.sm, marginBottom: Spacing.xl },

    // Privacy checkbox row
    privacyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
        paddingHorizontal: 2,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        backgroundColor: Colors.inputBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    checkboxActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    privacyText: {
        flex: 1,
        fontSize: Font.xs + 1,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    privacyLink: {
        color: Colors.primary,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },

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
