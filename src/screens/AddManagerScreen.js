import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Spacing } from '../theme';
import { toast } from '../utils/toast';

const FIELDS = [
    { key: 'name', label: 'Full Name', placeholder: 'Manager full name' },
    { key: 'phone', label: 'Phone Number', placeholder: '10-digit phone', keyboard: 'phone-pad', cap: 'none' },
    { key: 'password', label: 'Password', placeholder: 'Set a password', secure: true, cap: 'none' },
    { key: 'area', label: 'Area (optional)', placeholder: 'Area / locality' },
    { key: 'city', label: 'City (optional)', placeholder: 'City' },
];

export default function AddManagerScreen({ navigation }) {
    const [form, setForm] = useState({ name: '', phone: '', password: '', area: '', city: '' });
    const [loading, setLoading] = useState(false);

    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        if (!form.name || !form.phone || !form.password) {
            toast.error('Name, phone, and password are required.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/users/add-manager', form);
            toast.success('Manager account created.');
            setTimeout(() => navigation.goBack(), 1200);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to add manager.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Add Manager" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                {FIELDS.map(({ key, label, placeholder, keyboard, secure, cap }) => (
                    <InputField
                        key={key}
                        label={label}
                        value={form[key]}
                        onChangeText={set(key)}
                        placeholder={placeholder}
                        keyboardType={keyboard || 'default'}
                        secureTextEntry={!!secure}
                        autoCapitalize={cap || 'words'}
                    />
                ))}
                <PrimaryButton title="Add Manager" onPress={handleSubmit} loading={loading} style={styles.btn} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    container: { padding: Spacing.xl },
    btn: { marginTop: Spacing.md },
});
