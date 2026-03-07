import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    Animated, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';
import { toast } from '../utils/toast';

export default function PaymentLogsScreen({ route, navigation }) {
    const { bookingId, mandalName, year } = route.params || {};
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPaid, setTotalPaid] = useState(0);
    const [finalPrice, setFinalPrice] = useState(0);
    const [remaining, setRemaining] = useState(0);
    const [initialQuote, setInitialQuote] = useState(0);
    const [priceHistory, setPriceHistory] = useState([]);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => { fetchPayments(); }, [bookingId]);

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
            // Price history / negotiation data
            const hist = booking.priceHistory || [];
            setInitialQuote(hist.length > 0 ? (hist[hist.length - 1].oldPrice || booking.finalPrice) : booking.finalPrice);
            setPriceHistory(hist);
            Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
        } catch {
            toast.error('Failed to load payment log.');
        } finally {
            setLoading(false);
        }
    };

    // Mode config
    const modeCfg = (mode) => {
        const c = { cash: { color: Colors.success, bg: Colors.successBg, label: 'Cash Payment' }, upi: { color: '#2563EB', bg: 'rgba(37,99,235,0.1)', label: 'UPI Transfer' }, bank: { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', label: 'Bank Transfer' }, cheque: { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', label: 'Bank Transfer' } };
        return c[mode] || { color: Colors.textMuted, bg: Colors.bg, label: mode?.toUpperCase() || '—' };
    };

    const renderItem = ({ item, index }) => {
        const mc = modeCfg(item.paymentMode);
        const date = new Date(item.paymentDate || item.createdAt);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return (
            <View style={styles.payCard}>
                {/* Rupee icon circle */}
                <View style={styles.payIconWrap}>
                    <Text style={{ fontSize: 16, color: Colors.primary, fontWeight: '800' }}>₹</Text>
                </View>
                <View style={styles.payInfo}>
                    <Text style={styles.payAmount}>₹{(item.amount || 0).toLocaleString()} Received</Text>
                    <View style={styles.payMeta}>
                        <Feather name="clock" size={10} color={Colors.textMuted} />
                        <Text style={styles.payMetaText}>{dateStr} · {mc.label}</Text>
                    </View>
                </View>
                <View style={[styles.payStatusPill, { backgroundColor: item.isAdvance ? Colors.orangeBg : Colors.successBg }]}>
                    <Text style={[styles.payStatusText, { color: item.isAdvance ? Colors.orange : Colors.success }]}>
                        {item.isAdvance ? 'Advance' : 'Verified'}
                    </Text>
                </View>
            </View>
        );
    };

    const totalReduction = initialQuote - finalPrice;
    const reductionPct = initialQuote > 0 ? ((totalReduction / initialQuote) * 100).toFixed(1) : 0;

    // Price history entry icons by type
    const historyIcon = (reason) => {
        if (!reason) return 'tag';
        const r = reason.toLowerCase();
        if (r.includes('negot')) return 'trending-down';
        if (r.includes('deposit') || r.includes('advance')) return 'heart';
        return 'tag';
    };

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Price Logs" onBack={() => navigation.goBack()} />

            {loading ? (
                <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
            ) : (
                <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
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
                        ListHeaderComponent={(
                            <View>
                                {/* Negotiation Summary banner */}
                                {priceHistory.length > 0 ? (
                                    <View style={styles.negotiationCard}>
                                        <View style={styles.negIconWrap}>
                                            <Feather name="refresh-cw" size={15} color={Colors.primary} />
                                        </View>
                                        <Text style={styles.negTitle}>NEGOTIATION SUMMARY</Text>
                                        <View style={styles.negRow}>
                                            <View>
                                                <Text style={styles.negLabel}>INITIAL QUOTE</Text>
                                                <Text style={styles.negValue}>₹{initialQuote.toLocaleString()}</Text>
                                            </View>
                                            <View style={styles.negArrow}>
                                                <Feather name="arrow-right" size={16} color={Colors.textMuted} />
                                            </View>
                                            <View>
                                                <Text style={styles.negLabel}>FINAL AGREED</Text>
                                                <Text style={styles.negFinalValue}>₹{finalPrice.toLocaleString()}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.negReductionRow}>
                                            <Text style={styles.negReductionLabel}>Total Reduction</Text>
                                            <Text style={styles.negReductionValue}>
                                                - ₹{totalReduction.toLocaleString()} ({reductionPct}%)
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    /* Standard payment summary bar */
                                    <View style={styles.summaryBar}>
                                        <SummaryItem label="Payments" value={String(payments.length)} />
                                        <View style={styles.summaryDivider} />
                                        <SummaryItem label="Final Price" value={`₹${finalPrice.toLocaleString()}`} />
                                        <View style={styles.summaryDivider} />
                                        <SummaryItem label="Total Paid" value={`₹${totalPaid.toLocaleString()}`} />
                                        <View style={styles.summaryDivider} />
                                        <SummaryItem
                                            label="Remaining"
                                            value={`₹${Math.max(0, remaining).toLocaleString()}`}
                                            valueColor={remaining > 0 ? Colors.danger : Colors.success}
                                        />
                                    </View>
                                )}

                                {/* Price history timeline */}
                                {priceHistory.length > 0 ? (
                                    <View>
                                        <View style={styles.historyHeaderRow}>
                                            <Text style={styles.historyTitle}>Detailed Log History</Text>
                                            <View style={styles.changesChip}>
                                                <Text style={styles.changesText}>{priceHistory.length} CHANGES</Text>
                                            </View>
                                        </View>

                                        {[...priceHistory].reverse().map((h, idx) => {
                                            const date = h.changedAt ? new Date(h.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                                            return (
                                                <View key={idx} style={styles.historyEntry}>
                                                    {/* Timeline dot */}
                                                    <View style={styles.timelineDotWrap}>
                                                        <View style={styles.timelineIconCircle}>
                                                            <Feather name={historyIcon(h.reason)} size={13} color={Colors.primary} />
                                                        </View>
                                                        {idx < priceHistory.length - 1 ? <View style={styles.timelineLine} /> : null}
                                                    </View>
                                                    <View style={styles.historyContent}>
                                                        <View style={styles.historyContentHeader}>
                                                            <View style={styles.historyDateRow}>
                                                                <Feather name="calendar" size={11} color={Colors.textMuted} />
                                                                <Text style={styles.historyDate}>{date}</Text>
                                                            </View>
                                                            {h.reason ? (
                                                                <View style={styles.reasonChip}>
                                                                    <Text style={styles.reasonText}>{h.reason}</Text>
                                                                </View>
                                                            ) : null}
                                                        </View>
                                                        <View style={styles.priceChangeRow}>
                                                            <View>
                                                                <Text style={styles.priceChangeLabel}>Old Price</Text>
                                                                <Text style={styles.oldPrice}>₹{(h.oldPrice || 0).toLocaleString()}</Text>
                                                            </View>
                                                            <Feather name="arrow-right" size={16} color={Colors.textMuted} style={styles.priceArrow} />
                                                            <View>
                                                                <Text style={styles.priceChangeLabel}>New Price</Text>
                                                                <Text style={styles.newPrice}>₹{(h.newPrice || 0).toLocaleString()}</Text>
                                                            </View>
                                                        </View>
                                                        {h.note ? (
                                                            <View style={styles.noteWrap}>
                                                                <Feather name="message-circle" size={11} color={Colors.textMuted} />
                                                                <Text style={styles.noteText}>"{h.note}"</Text>
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ) : null}

                                {/* Recent payments section heading */}
                                {payments.length > 0 ? (
                                    <Text style={styles.recentHeading}>Recent Payments</Text>
                                ) : null}
                            </View>
                        )}
                        ListFooterComponent={
                            <View style={styles.footerNote}>
                                <Feather name="info" size={13} color={Colors.textMuted} />
                                <Text style={styles.footerNoteText}>
                                    All price changes are logged automatically when the 'Final Agreed Price' is modified in Mandal Details.
                                </Text>
                            </View>
                        }
                    />
                </Animated.View>
            )}
        </View>
    );
}

function SummaryItem({ label, value, valueColor }) {
    return (
        <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, valueColor && { color: valueColor }]}>{value}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
    list: { padding: Spacing.lg, paddingBottom: 40 },
    emptyText: { fontSize: Font.sm, color: Colors.textMuted, textAlign: 'center' },

    // Negotiation summary card
    negotiationCard: {
        backgroundColor: '#FFF7ED', borderRadius: Radius.lg,
        padding: Spacing.lg, marginBottom: Spacing.lg,
        borderWidth: 1, borderColor: '#FED7AA',
    },
    negIconWrap: { marginBottom: 6 },
    negTitle: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.2, marginBottom: Spacing.md },
    negRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
    negLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.8 },
    negValue: { fontSize: Font.xl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
    negFinalValue: { fontSize: Font.xl, fontWeight: '900', color: Colors.primary, marginTop: 2 },
    negArrow: { flex: 1, alignItems: 'center' },
    negReductionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: '#FED7AA' },
    negReductionLabel: { fontSize: Font.sm, color: Colors.textSecondary },
    negReductionValue: { fontSize: Font.sm, fontWeight: '700', color: Colors.danger },

    // Standard summary bar
    summaryBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
        backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
        marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder,
        borderTopWidth: 3, borderTopColor: Colors.primary, ...Shadow.sm,
    },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryValue: { fontSize: Font.sm, fontWeight: '800', color: Colors.textPrimary },
    summaryLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
    summaryDivider: { width: 1, height: 32, backgroundColor: Colors.separator },

    // History header
    historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    historyTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    changesChip: { backgroundColor: Colors.bg, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.cardBorder },
    changesText: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.5 },

    // Timeline entry
    historyEntry: { flexDirection: 'row', marginBottom: Spacing.md },
    timelineDotWrap: { alignItems: 'center', marginRight: Spacing.md, width: 32 },
    timelineIconCircle: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
    },
    timelineLine: { width: 2, flex: 1, backgroundColor: Colors.separator, marginTop: 4 },
    historyContent: {
        flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg,
        padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder,
        marginBottom: Spacing.xs,
    },
    historyContentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    historyDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
    historyDate: { fontSize: Font.xs, color: Colors.textMuted },
    reasonChip: {
        backgroundColor: Colors.bg, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    reasonText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },

    // Price change row
    priceChangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    priceChangeLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '600' },
    oldPrice: { fontSize: Font.md, fontWeight: '700', color: Colors.textSecondary, marginTop: 2 },
    newPrice: { fontSize: Font.md, fontWeight: '800', color: Colors.primary, marginTop: 2 },
    priceArrow: { marginHorizontal: Spacing.lg },

    noteWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 4 },
    noteText: { fontSize: Font.xs, color: Colors.textSecondary, fontStyle: 'italic', flex: 1, lineHeight: 18 },

    recentHeading: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },

    // Payment cards
    payCard: {
        backgroundColor: Colors.card, borderRadius: Radius.md,
        flexDirection: 'row', alignItems: 'center',
        padding: Spacing.md, marginBottom: Spacing.sm,
        borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm,
    },
    payIconWrap: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md,
    },
    payInfo: { flex: 1 },
    payAmount: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    payMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
    payMetaText: { fontSize: Font.xs, color: Colors.textMuted },
    payStatusPill: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
    payStatusText: { fontSize: Font.xs, fontWeight: '700' },

    footerNote: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 6,
        backgroundColor: Colors.bg, borderRadius: Radius.md,
        padding: Spacing.md, marginTop: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    footerNoteText: { fontSize: Font.xs, color: Colors.textMuted, flex: 1, lineHeight: 18 },
});
