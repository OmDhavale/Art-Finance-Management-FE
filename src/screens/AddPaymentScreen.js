import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Platform, StatusBar, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';
import { toast } from '../utils/toast';

const MODES = [
    { key: 'cash', label: 'CASH', iconName: 'dollar-sign' },
    { key: 'upi', label: 'UPI', iconName: 'smartphone' },
    { key: 'cheque', label: 'BANK', iconName: 'credit-card' },
];

export default function AddPaymentScreen({ route, navigation }) {
    const { bookingId, mandalName, remainingAmount } = route.params || {};
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState('cash');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, []);

    const handleSubmit = async () => {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { toast.error('Enter a valid amount.'); return; }
        setLoading(true);
        try {
            await api.post(`/bookings/${bookingId}/payments`, { bookingId, amount: amt, paymentMode: mode, paymentDate: date });
            toast.success('Payment recorded!');
            setTimeout(() => navigation.goBack(), 1000);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to record payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Add Payment" onBack={() => navigation.goBack()} />
            <Animated.ScrollView
                style={{ opacity: fadeAnim }}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* Mandal chip */}
                {mandalName ? (
                    <View style={styles.mandalChipWrap}>
                        <View style={styles.mandalChip}>
                            <Feather name="map-pin" size={12} color={Colors.primary} />
                            <Text style={styles.mandalChipText}>{mandalName}</Text>
                        </View>
                    </View>
                ) : null}

                {/* Remaining amount banner */}
                {remainingAmount != null ? (
                    <View style={styles.remainingBanner}>
                        <View>
                            <Text style={styles.remainingLabel}>REMAINING AMOUNT</Text>
                            <Text style={styles.remainingAmount}>₹ {Math.max(0, remainingAmount).toLocaleString()}</Text>
                        </View>
                        <View style={styles.remainingIcon}>
                            <Feather name="clock" size={20} color={Colors.primary} />
                        </View>
                    </View>
                ) : null}

                {/* Amount input */}
                <Text style={styles.fieldLabel}>Payment Amount</Text>
                <View style={styles.amountWrap}>
                    <View style={styles.rupeeIcon}>
                        <Feather name="indian-rupee" size={16} color={Colors.textMuted} />
                    </View>
                    <InputField
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0"
                        keyboardType="numeric"
                        autoCapitalize="none"
                        style={[styles.amountInput, { marginBottom: 0 }]}
                    />
                </View>

                {/* Payment mode chips */}
                <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Payment Mode</Text>
                <View style={styles.modeRow}>
                    {MODES.map(m => (
                        <TouchableOpacity
                            key={m.key}
                            style={[styles.modeChip, mode === m.key && styles.modeChipActive]}
                            onPress={() => setMode(m.key)}
                        >
                            <Feather
                                name={m.iconName}
                                size={15}
                                color={mode === m.key ? Colors.primary : Colors.textMuted}
                            />
                            <Text style={[styles.modeText, mode === m.key && styles.modeTextActive]}>
                                {m.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Date */}
                <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Payment Date</Text>
                <InputField
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                    iconName="calendar"
                />

                <View style={styles.btnWrap}>
                    <PrimaryButton
                        title="Confirm Payment"
                        iconName="check"
                        onPress={handleSubmit}
                        loading={loading}
                    />
                    <Text style={styles.disclaimer}>
                        Payment will be recorded and visible in the Payment Log.
                    </Text>
                </View>
            </Animated.ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    container: { padding: Spacing.xl, paddingBottom: 48 },

    mandalChipWrap: { alignItems: 'flex-start', marginBottom: Spacing.lg },
    mandalChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: Colors.primaryMuted, borderRadius: Radius.full,
        paddingHorizontal: 12, paddingVertical: 5,
        borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)',
    },
    mandalChipText: { fontSize: Font.sm, color: Colors.primary, fontWeight: '600' },

    remainingBanner: {
        backgroundColor: Colors.primary, borderRadius: Radius.lg,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.sm,
    },
    remainingLabel: { fontSize: Font.xs, color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 1.2 },
    remainingAmount: { fontSize: Font.xxl + 4, fontWeight: '800', color: Colors.white, marginTop: 2 },
    remainingIcon: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
    },

    fieldLabel: { fontSize: Font.sm, color: Colors.textPrimary, fontWeight: '600', marginBottom: 8 },

    amountWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.inputBg, borderRadius: Radius.md,
        borderWidth: 1.5, borderColor: Colors.inputBorder,
        paddingLeft: 14, marginBottom: Spacing.sm, ...Shadow.sm,
    },
    rupeeIcon: { paddingRight: 6 },
    amountInput: { flex: 1, borderWidth: 0, paddingLeft: 0, backgroundColor: 'transparent' },

    modeRow: { flexDirection: 'row', gap: Spacing.sm },
    modeChip: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderWidth: 1.5, borderColor: Colors.cardBorder,
        borderRadius: Radius.full, paddingVertical: 10, backgroundColor: Colors.card,
    },
    modeChipActive: { borderColor: Colors.primary, backgroundColor: '#FFF7ED' },
    modeText: { fontSize: Font.xs, fontWeight: '700', color: Colors.textMuted },
    modeTextActive: { color: Colors.primary },

    btnWrap: { marginTop: Spacing.xl },
    disclaimer: {
        fontSize: Font.xs, color: Colors.textMuted, textAlign: 'center',
        marginTop: Spacing.md, lineHeight: 18,
    },
});
