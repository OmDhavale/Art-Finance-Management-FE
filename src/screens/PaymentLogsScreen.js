import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    Animated, StatusBar,
} from 'react-native';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Font, Radius, Spacing } from '../theme';
import { toast } from '../utils/toast';

const MODE_COLOR = {
    cash: { color: '#1B5E20', bg: '#C8E6C9' },
    upi: { color: '#1A237E', bg: '#C5CAE9' },
    bank: { color: '#E65100', bg: '#FFE0B2' },
    cheque: { color: '#4A148C', bg: '#E1BEE7' },
};

export default function PaymentLogsScreen({ route, navigation }) {
    const { bookingId, mandalName, year } = route.params || {};
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPaid, setTotalPaid] = useState(0);
    const [finalPrice, setFinalPrice] = useState(0);
    const [remaining, setRemaining] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/bookings/${bookingId}`);
            const booking = res.data.data;
            const sorted = [...(booking.payments || [])].sort(
                (a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt)
            );
            setPayments(sorted);
            setTotalPaid(booking.totalPaid || 0);
            setFinalPrice(booking.finalPrice || 0);
            setRemaining(booking.remainingAmount || 0);
            Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
        } catch {
            toast.error('Failed to load payment log.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item, index }) => {
        const modeCfg = MODE_COLOR[item.paymentMode] || { color: Colors.textSecondary, bg: Colors.separator };
        const date = new Date(item.paymentDate || item.createdAt);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const dayStr = date.toLocaleDateString('en-IN', { weekday: 'short' });

        return (
            <View style={styles.card}>
                {/* Entry number dot */}
                <View style={styles.indexDot}>
                    <Text style={styles.indexText}>{payments.length - index}</Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                        <View style={styles.amountRow}>
                            <Text style={styles.amount}>₹{(item.amount || 0).toLocaleString()}</Text>
                            {item.isAdvance && (
                                <View style={styles.advanceBadge}>
                                    <Text style={styles.advanceText}>ADVANCE</Text>
                                </View>
                            )}
                        </View>
                        {item.paymentMode && (
                            <View style={[styles.modeBadge, { backgroundColor: modeCfg.bg }]}>
                                <Text style={[styles.modeText, { color: modeCfg.color }]}>
                                    {item.paymentMode.toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.cardMetaRow}>
                        <Text style={styles.dateText}>{dayStr}, {dateStr}</Text>
                        {item.addedBy?.name && (
                            <Text style={styles.recorderText}>Recorded by: {item.addedBy.name}</Text>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const title = mandalName && year ? `${mandalName}, Payments: ${year}` : 'Payment Log';

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title={title} onBack={() => navigation.goBack()} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={Colors.accent} size="large" />
                </View>
            ) : (
                <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
                    {/* Summary header */}
                    <View style={styles.summaryBar}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{payments.length}</Text>
                            <Text style={styles.summaryLabel}>Payments</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>₹{finalPrice.toLocaleString()}</Text>
                            <Text style={styles.summaryLabel}>Final Price</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>₹{totalPaid.toLocaleString()}</Text>
                            <Text style={styles.summaryLabel}>Total Paid</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: remaining > 0 ? '#BF360C' : '#2E7D32' }]}>
                                ₹{Math.max(0, remaining).toLocaleString()}
                            </Text>
                            <Text style={styles.summaryLabel}>Remaining</Text>
                        </View>
                    </View>

                    <FlatList
                        data={payments}
                        keyExtractor={(_, i) => String(i)}
                        contentContainerStyle={styles.list}
                        renderItem={renderItem}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={styles.emptyText}>No payments recorded yet.</Text>
                            </View>
                        }
                    />
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },

    summaryBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
        backgroundColor: Colors.card, marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
        marginBottom: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg,
        borderWidth: 1, borderColor: Colors.cardBorder,
        borderTopWidth: 3, borderTopColor: Colors.accent,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryValue: { fontSize: Font.md, fontWeight: '800', color: Colors.textPrimary },
    summaryLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
    summaryDivider: { width: 1, height: 32, backgroundColor: Colors.separator },

    list: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },

    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.card, borderRadius: Radius.md,
        marginBottom: Spacing.sm, padding: Spacing.lg,
        borderWidth: 1, borderColor: Colors.cardBorder,
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    },
    indexDot: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: Colors.accentMuted,
        alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md, flexShrink: 0,
    },
    indexText: { fontSize: Font.xs, fontWeight: '800', color: Colors.accent },
    cardBody: { flex: 1 },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    amountRow: { flexDirection: 'row', alignItems: 'center' },
    amount: { fontSize: Font.lg, fontWeight: '800', color: Colors.textPrimary },
    advanceBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 4, marginLeft: 8,
        borderWidth: 1, borderColor: '#BBDEFB',
    },
    advanceText: { fontSize: 8, fontWeight: '800', color: '#1976D2' },
    modeBadge: {
        borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
    },
    modeText: { fontSize: 10, fontWeight: '800' },
    cardMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    dateText: { fontSize: Font.xs, color: Colors.textMuted },
    recorderText: { fontSize: 10, color: Colors.textMuted, fontStyle: 'italic' },

    emptyText: { fontSize: Font.sm, color: Colors.textMuted, textAlign: 'center' },
});
