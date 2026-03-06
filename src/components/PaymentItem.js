import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PaymentItem({ payment }) {
    const date = payment.paymentDate
        ? new Date(payment.paymentDate).toLocaleDateString('en-IN')
        : '—';

    const modeColors = { cash: '#2E7D32', upi: '#1565C0', cheque: '#6A1B9A' };
    const modeColor = modeColors[payment.paymentMode] || '#555';

    return (
        <View style={styles.item}>
            <View style={styles.left}>
                <Text style={styles.amount}>₹{payment.amount?.toLocaleString()}</Text>
                <Text style={styles.date}>{date}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: modeColor + '22' }]}>
                <Text style={[styles.mode, { color: modeColor }]}>
                    {(payment.paymentMode || 'cash').toUpperCase()}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    left: {},
    amount: { fontSize: 15, fontWeight: '700', color: '#333' },
    date: { fontSize: 12, color: '#aaa', marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    mode: { fontSize: 11, fontWeight: '700' },
});
