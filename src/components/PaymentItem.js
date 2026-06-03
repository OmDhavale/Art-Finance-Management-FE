import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Font, Radius, Spacing } from '../theme';

export default function PaymentItem({ payment }) {
    const date = payment.paymentDate
        ? new Date(payment.paymentDate).toLocaleDateString('en-IN')
        : '—';

    const modeConfig = {
        cash: { label: 'CASH', color: Colors.success, bg: Colors.successBg },
        upi: { label: 'UPI', color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
        cheque: { label: 'BANK', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
    };
    const cfg = modeConfig[payment.paymentMode] || { label: payment.paymentMode?.toUpperCase(), color: Colors.textMuted, bg: Colors.bg };

    const createdByName = payment.recordedBy?.name;

    return (
        <View style={styles.item}>
            <View style={styles.left}>
                <Text style={styles.amount}>₹ {payment.amount?.toLocaleString()}</Text>
                <Text style={styles.date}>{date}{createdByName ? ` • ${createdByName}` : ''}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.mode, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.separator,
    },
    left: { flex: 1 },
    amount: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    date: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 3 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
    mode: { fontSize: Font.xs, fontWeight: '700', letterSpacing: 0.5 },
});
