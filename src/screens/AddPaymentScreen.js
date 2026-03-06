import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import api from '../api/api';

const PAYMENT_MODES = ['cash', 'upi', 'cheque'];

export default function AddPaymentScreen({ route, navigation }) {
    const { bookingId } = route.params;
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('cash');
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid payment amount.');
            return;
        }
        setLoading(true);
        try {
            await api.post(`/bookings/${bookingId}/payments`, {
                amount: Number(amount),
                paymentMode,
                paymentDate,
            });
            Alert.alert('Success', 'Payment recorded! 🎉', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to add payment.';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>💳 Payment Details</Text>

                    <Text style={styles.label}>Amount (₹) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter amount"
                        placeholderTextColor="#aaa"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Payment Mode</Text>
                    <View style={styles.modeRow}>
                        {PAYMENT_MODES.map((mode) => (
                            <TouchableOpacity
                                key={mode}
                                style={[
                                    styles.modeChip,
                                    paymentMode === mode && styles.modeChipActive,
                                ]}
                                onPress={() => setPaymentMode(mode)}
                            >
                                <Text
                                    style={[
                                        styles.modeText,
                                        paymentMode === mode && styles.modeTextActive,
                                    ]}
                                >
                                    {mode.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Payment Date</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#aaa"
                        value={paymentDate}
                        onChangeText={setPaymentDate}
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Record Payment</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#FFF8F5' },
    container: { padding: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 4,
    },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 8 },
    label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
    input: {
        borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: '#333', backgroundColor: '#FAFAFA',
    },
    modeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    modeChip: {
        flex: 1, paddingVertical: 10, borderRadius: 10,
        borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center',
    },
    modeChipActive: { borderColor: '#FF6B35', backgroundColor: '#FFF0EB' },
    modeText: { fontSize: 13, color: '#888', fontWeight: '600' },
    modeTextActive: { color: '#FF6B35' },
    button: {
        backgroundColor: '#FF6B35', borderRadius: 10,
        paddingVertical: 14, alignItems: 'center', marginTop: 28,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
