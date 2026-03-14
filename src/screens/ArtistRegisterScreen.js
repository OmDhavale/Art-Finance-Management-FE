import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, Animated, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing } from '../theme';
import { toast } from '../utils/toast';

const FIELDS = [
    { key: 'name', label: 'Full Name', placeholder: 'Your full name', keyboard: 'default', secure: false },
    { key: 'workshopName', label: 'Workshop / Studio Name', placeholder: 'Your studio or business name', keyboard: 'default', secure: false },
    { key: 'phone', label: 'Phone Number', placeholder: '10-digit phone', keyboard: 'phone-pad', secure: false },
    { key: 'password', label: 'Password', placeholder: 'Create a strong password', keyboard: 'default', secure: true },
    { key: 'area', label: 'Area (optional)', placeholder: 'Area / locality', keyboard: 'default', secure: false },
    { key: 'city', label: 'City (optional)', placeholder: 'City', keyboard: 'default', secure: false },
];

export default function ArtistRegisterScreen({ navigation }) {
    const { registerArtist } = useAuth();
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
            toast.error('Name, studio name, phone, and password are required.');
            return;
        }
        setLoading(true);
        try {
            await registerArtist(form);
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
                <View style={styles.topRow}>
                    <Text style={styles.heading}>Create Artist Account</Text>
                    <Text style={styles.sub}>Join as a Sketch Artist</Text>
                </View>

                <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {FIELDS.map(({ key, label, placeholder, keyboard, secure }) => (
                        <InputField
                            key={key}
                            label={label}
                            value={form[key]}
                            onChangeText={set(key)}
                            placeholder={placeholder}
                            keyboardType={keyboard}
                            secureTextEntry={secure}
                            autoCapitalize={secure || keyboard === 'phone-pad' ? 'none' : 'words'}
                        />
                    ))}

                    <PrimaryButton title="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />

                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
                        <Text style={styles.link}>Already registered? <Text style={styles.linkBold}>Sign In</Text></Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    container: { padding: Spacing.xl, paddingTop: Spacing.xxl },
    topRow: { marginBottom: Spacing.xl },
    heading: { fontSize: Font.xxl, fontWeight: '800', color: Colors.textPrimary },
    sub: { fontSize: Font.sm, color: Colors.textMuted, marginTop: 4 },
    card: {
        backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.xl,
        borderWidth: 1, borderColor: Colors.cardBorder,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    },
    btn: { marginTop: Spacing.sm },
    linkWrap: { marginTop: Spacing.lg, alignItems: 'center' },
    link: { color: Colors.textSecondary, fontSize: Font.sm },
    linkBold: { color: Colors.accent, fontWeight: '700' },
});
