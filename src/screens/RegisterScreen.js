import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const [form, setForm] = useState({
        name: '',
        workshopName: '',
        phone: '',
        password: '',
        area: '',
        city: '',
    });
    const [loading, setLoading] = useState(false);

    const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

    const handleRegister = async () => {
        const { name, workshopName, phone, password } = form;
        if (!name || !workshopName || !phone || !password) {
            Alert.alert('Error', 'Name, workshop name, phone, and password are required.');
            return;
        }
        setLoading(true);
        try {
            await register(form);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Registration failed.';
            Alert.alert('Registration Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { key: 'name', label: 'Full Name', placeholder: 'Your full name' },
        { key: 'workshopName', label: 'Workshop Name', placeholder: 'Workshop / business name' },
        { key: 'phone', label: 'Phone Number', placeholder: '10-digit phone', keyboard: 'phone-pad' },
        { key: 'password', label: 'Password', placeholder: 'Create a password', secure: true },
        { key: 'area', label: 'Area', placeholder: 'Area / locality (optional)' },
        { key: 'city', label: 'City', placeholder: 'City (optional)' },
    ];

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card}>
                    {fields.map(({ key, label, placeholder, keyboard, secure }) => (
                        <View key={key}>
                            <Text style={styles.label}>{label}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={placeholder}
                                placeholderTextColor="#aaa"
                                value={form[key]}
                                onChangeText={set(key)}
                                keyboardType={keyboard || 'default'}
                                secureTextEntry={!!secure}
                                autoCapitalize={secure ? 'none' : 'words'}
                            />
                        </View>
                    ))}

                    <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.link}>Already have an account? Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#FFF8F5' },
    container: { flexGrow: 1, padding: 24, paddingTop: 32 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#FAFAFA',
    },
    button: {
        backgroundColor: '#FF6B35',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    link: { textAlign: 'center', color: '#FF6B35', marginTop: 16, fontSize: 14 },
});
