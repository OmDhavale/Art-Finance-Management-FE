import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing } from '../theme';
import { toast } from '../utils/toast';

const MODES = ['cash', 'upi', 'cheque'];

export default function AddPaymentScreen({ route, navigation }) {
    const { bookingId } = route.params;
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('cash');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error('Please enter a valid amount.');
            return;
        }
        setLoading(true);
        try {
            await api.post(`/bookings/${bookingId}/payments`, {
                amount: Number(amount),
                paymentMode,
                paymentDate,
            });
            toast.success('Payment has been recorded.', 'Recorded');
            setTimeout(() => navigation.goBack(), 1200);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to add payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Add Payment" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

                <InputField
                    label="Amount (₹) *"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Payment Mode</Text>
                <View style={styles.modeRow}>
                    {MODES.map(mode => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.modeChip, paymentMode === mode && styles.modeChipActive]}
                            onPress={() => setPaymentMode(mode)}
                            accessible
                            accessibilityRole="button"
                            accessibilityLabel={mode}
                        >
                            <Text style={[styles.modeText, paymentMode === mode && styles.modeTextActive]}>
                                {mode.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <InputField
                    label="Payment Date"
                    value={paymentDate}
                    onChangeText={setPaymentDate}
                    placeholder="YYYY-MM-DD"
                    style={styles.dateField}
                />

                <PrimaryButton title="Record Payment" onPress={handleSubmit} loading={loading} style={styles.btn} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    container: { padding: Spacing.xl },
    label: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: 8, letterSpacing: 0.3 },
    modeRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
    modeChip: {
        flex: 1, paddingVertical: 11, borderRadius: Radius.sm,
        borderWidth: 1.5, borderColor: Colors.inputBorder,
        alignItems: 'center', backgroundColor: Colors.inputBg,
    },
    modeChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accentMuted },
    modeText: { fontSize: Font.sm, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.5 },
    modeTextActive: { color: Colors.accent },
    dateField: { marginTop: Spacing.sm },
    btn: { marginTop: Spacing.md },
});
