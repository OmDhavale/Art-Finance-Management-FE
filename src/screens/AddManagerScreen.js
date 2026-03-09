import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    KeyboardAvoidingView, Platform, Animated, StatusBar, Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';
import { toast } from '../utils/toast';

export default function AddManagerScreen({ navigation }) {
    const [form, setForm] = useState({ name: '', phone: '', password: '' });
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.phone.trim() || !form.password.trim()) {
            toast.error('All fields are required.');
            return;
        }

        if (form.phone.trim().length !== 10) {
            toast.error('Please enter a valid 10-digit phone number.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/users/add-manager', form);
            toast.success(`${form.name} registered as manager.`);
            // Navigate back to refresh WorkshopDetailsScreen
            setTimeout(() => navigation.goBack(), 1200);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to register manager.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Add Manager" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Animated.View style={[styles.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                    {/* Brand Header */}
                    <View style={styles.branding}>
                        <View style={styles.logoCircle}>
                            <Image
                                source={require('../../assets/ganesha_logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.heading}>Register Manager</Text>
                        <Text style={styles.subText}>Create a new staff account to help manage your workshop operations.</Text>
                    </View>

                    {/* Form Card */}
                    <View style={styles.formCard}>
                        <Text style={styles.label}>Manager Full Name</Text>
                        <InputField
                            value={form.name}
                            onChangeText={set('name')}
                            placeholder="e.g. Ramesh Kumar"
                            autoCapitalize="words"
                            iconName="user"
                        />

                        <Text style={styles.label}>Phone Number</Text>
                        <InputField
                            value={form.phone}
                            onChangeText={set('phone')}
                            placeholder="10-digit mobile number"
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                            iconName="phone"
                        />

                        <Text style={styles.label}>Set Password</Text>
                        <InputField
                            value={form.password}
                            onChangeText={set('password')}
                            placeholder="Min. 6 characters"
                            secureTextEntry
                            autoCapitalize="none"
                            iconName="lock"
                        />

                        <PrimaryButton
                            title="Register Manager"
                            iconName="user-plus"
                            onPress={handleSubmit}
                            loading={loading}
                            style={styles.btn}
                        />

                        {/* Security Note */}
                        <View style={styles.noteBox}>
                            <Feather name="shield" size={14} color={Colors.textMuted} />
                            <Text style={styles.noteText}>
                                Managers can view financial summaries and manage bookings but cannot add other managers.
                            </Text>
                        </View>
                    </View>

                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    container: { padding: Spacing.lg, paddingBottom: 40 },
    body: { flex: 1 },

    branding: { alignItems: 'center', marginVertical: Spacing.xl },
    logoCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm,
        marginBottom: Spacing.md,
    },
    logoImage: { width: 60, height: 60 },
    heading: { fontSize: Font.xl + 2, fontWeight: '800', color: Colors.textPrimary },
    subText: { fontSize: Font.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, paddingHorizontal: 20, lineHeight: 20 },

    formCard: {
        backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl,
        borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.md,
    },
    label: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
    btn: { marginTop: Spacing.md, marginBottom: Spacing.lg },

    noteBox: {
        flexDirection: 'row', gap: 8, padding: Spacing.md,
        backgroundColor: Colors.bg, borderRadius: Radius.md,
        borderWidth: 1, borderColor: Colors.separator,
    },
    noteText: { fontSize: Font.xs, color: Colors.textMuted, flex: 1, lineHeight: 18 },
});
