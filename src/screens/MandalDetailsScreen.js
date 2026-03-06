import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Animated, StatusBar,
} from 'react-native';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Font, Radius, Spacing, getGradeConfig } from '../theme';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export default function MandalDetailsScreen({ route, navigation }) {
    const { mandalId } = route.params;
    const { user } = useAuth();
    const [mandal, setMandal] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => { fetchDetails(); }, []);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/mandals/${mandalId}`);
            setMandal(res.data.data.mandal);
            setBookings(res.data.data.bookingHistory || []);
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        } catch {
            toast.error('Failed to load mandal details.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.flex}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
                <ScreenHeader title="Mandal Details" onBack={() => navigation.goBack()} />
                <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
            </View>
        );
    }

    const renderBooking = ({ item }) => {
        const cfg = getGradeConfig(item.remainingAmount || 0);
        const rawR = item.remainingAmount || 0;
        const dispR = Math.max(0, rawR);
        const extra = rawR < 0 ? Math.abs(rawR) : 0;
        const isMyBooking = item.vendorId?._id === user?._id;

        return (
            <View style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                    <Text style={styles.bookingYear}>{item.year}</Text>
                    <View style={[styles.gradePill, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.gradeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>
                <View style={styles.separator} />
                <Row label="Vendor" value={`${item.vendorId?.name || 'N/A'} · ${item.vendorId?.workshopName || '—'}`} />
                <Row label="Murti Size" value={item.murtiSize || '—'} />
                <Row label="Final Price" value={`₹${(item.finalPrice || 0).toLocaleString()}`} />
                <Row label="Total Paid" value={`₹${(item.totalPaid || 0).toLocaleString()}`} />
                <Row
                    label={extra > 0 ? 'Remaining' : 'Remaining'}
                    value={extra > 0 ? `₹0 (paid in full)` : `₹${dispR.toLocaleString()}`}
                    valueColor={cfg.color}
                    bold
                />
                {extra > 0 && (
                    <Row label="Extra Paid" value={`+₹${extra.toLocaleString()}`} valueColor="#1B5E20" bold />
                )}

                {/* Price History */}
                {item.priceHistory && item.priceHistory.length > 0 && (
                    <>
                        <View style={styles.separator} />
                        <Text style={styles.priceHistoryTitle}>PRICE HISTORY</Text>
                        {item.priceHistory.map((h, idx) => (
                            <View key={idx} style={styles.priceHistoryRow}>
                                <View style={styles.priceHistoryDot} />
                                <View style={styles.priceHistoryContent}>
                                    <Text style={styles.priceHistoryChange}>
                                        ₹{(h.oldPrice || 0).toLocaleString()} → ₹{(h.newPrice || 0).toLocaleString()}
                                    </Text>
                                    {h.reason ? (
                                        <Text style={styles.priceHistoryReason}>Reason: {h.reason}</Text>
                                    ) : null}
                                    {h.changedAt ? (
                                        <Text style={styles.priceHistoryDate}>
                                            {new Date(h.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {isMyBooking && (
                    <TouchableOpacity
                        style={styles.addPayBtn}
                        onPress={() => navigation.navigate('AddPayment', { bookingId: item._id })}
                    >
                        <Text style={styles.addPayText}>+ Add Payment</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Mandal Details" onBack={() => navigation.goBack()} />
            <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
                <FlatList
                    style={styles.flex}
                    ListHeaderComponent={
                        <View>
                            <View style={styles.mandalBanner}>
                                <View style={styles.bannerMonogram}>
                                    <Text style={styles.bannerMonoText}>
                                        {(mandal?.ganpatiTitle || 'M').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.ganpatiTitle}>{mandal?.ganpatiTitle}</Text>
                                <Text style={styles.mandalName}>{mandal?.mandalName}</Text>
                                {(mandal?.area || mandal?.city) ? (
                                    <Text style={styles.mandalLocation}>
                                        {[mandal.area, mandal.city].filter(Boolean).join(', ')}
                                    </Text>
                                ) : null}
                            </View>
                            <Text style={styles.sectionHeading}>BOOKING HISTORY</Text>
                        </View>
                    }
                    data={bookings}
                    keyExtractor={item => item._id}
                    renderItem={renderBooking}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No bookings for this mandal yet.</Text>
                        </View>
                    }
                    contentContainerStyle={styles.listContent}
                />
            </Animated.View>
        </View>
    );
}

function Row({ label, value, valueColor, bold }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, valueColor && { color: valueColor }, bold && { fontWeight: '700' }]}>
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: Spacing.lg, paddingBottom: 40 },

    mandalBanner: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl,
        borderWidth: 1, borderColor: Colors.cardBorder,
        borderTopWidth: 3, borderTopColor: Colors.accent,
    },
    bannerMonogram: {
        width: 60, height: 60, borderRadius: Radius.full,
        backgroundColor: Colors.accentMuted, alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    bannerMonoText: { fontSize: Font.xxl, fontWeight: '800', color: Colors.accent },
    ganpatiTitle: { fontSize: Font.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
    mandalName: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
    mandalLocation: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 4 },

    sectionHeading: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.4, marginBottom: Spacing.md },

    bookingCard: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    bookingYear: { fontSize: Font.xl, fontWeight: '800', color: Colors.textPrimary },
    gradePill: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
    gradeText: { fontSize: Font.xs, fontWeight: '700' },
    separator: { height: 1, backgroundColor: Colors.separator, marginBottom: Spacing.md },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    rowLabel: { fontSize: Font.sm, color: Colors.textMuted },
    rowValue: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
    addPayBtn: {
        marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.accent,
        borderRadius: Radius.sm, paddingVertical: 10, alignItems: 'center',
    },
    addPayText: { color: Colors.accent, fontWeight: '700', fontSize: Font.sm },
    empty: { alignItems: 'center', marginTop: 30 },
    emptyText: { color: Colors.textMuted, fontSize: Font.sm },

    // Price History
    priceHistoryTitle: {
        fontSize: Font.xs, fontWeight: '700', color: Colors.textMuted,
        letterSpacing: 1.2, marginTop: Spacing.md, marginBottom: Spacing.sm,
    },
    priceHistoryRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
    priceHistoryDot: {
        width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent,
        marginTop: 5, marginRight: Spacing.sm,
    },
    priceHistoryContent: { flex: 1 },
    priceHistoryChange: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    priceHistoryReason: { fontSize: Font.xs, color: Colors.textSecondary, marginTop: 1 },
    priceHistoryDate: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 1 },
});
