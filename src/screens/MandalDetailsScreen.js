import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Animated, StatusBar, ScrollView, RefreshControl,
    Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Font, Radius, Spacing, Shadow, getGradeConfig, getOverallGradeConfig } from '../theme';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

// Stat box used in Booking Summary grid
function StatBox({ iconName, label, value, valueColor }) {
    return (
        <View style={styles.statBox}>
            <View style={styles.statIconRow}>
                <Feather name={iconName} size={13} color={Colors.textMuted} />
                <Text style={styles.statLabel}>{label}</Text>
            </View>
            <Text style={[styles.statValue, valueColor && { color: valueColor }]}>{value}</Text>
        </View>
    );
}

// Health bar component
function PaymentHealthBar({ remaining, finalPrice }) {
    const pct = finalPrice > 0 ? Math.max(0, Math.min(1, 1 - remaining / finalPrice)) : 0;
    const health = pct >= 1 ? 'excellent' : pct >= 0.75 ? 'good' : pct >= 0.5 ? 'fair' : 'poor';
    const labelColor = health === 'excellent' ? Colors.success : health === 'good' ? Colors.success : health === 'fair' ? Colors.warning : Colors.danger;
    const barColor = health === 'excellent' ? Colors.success : health === 'good' ? Colors.success : health === 'fair' ? Colors.primary : Colors.danger;

    return (
        <View style={styles.healthCard}>
            <View style={styles.healthHeaderRow}>
                <Text style={styles.healthHeading}>PAYMENT HEALTH</Text>
                <Text style={[styles.healthLabel, { color: labelColor }]}>{health}</Text>
            </View>
            <View style={styles.healthBarTrack}>
                <View style={[styles.healthBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]} />
            </View>
            <View style={styles.healthNoteRow}>
                <Feather name="info" size={11} color={Colors.textMuted} />
                <Text style={styles.healthNote}>Grade calculated based on advance received and remaining duration.</Text>
            </View>
        </View>
    );
}

export default function MandalDetailsScreen({ route, navigation }) {
    const { mandalId } = route.params;
    const { user } = useAuth();
    const [mandal, setMandal] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => { fetchDetails(); }, [mandalId]);

    const fetchDetails = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await api.get(`/mandals/${mandalId}`);
            setMandal(res.data.data.mandal);
            setBookings(res.data.data.bookingHistory || []);
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        } catch {
            toast.error('Failed to load mandal details.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleEditPrice = () => {
        if (!myLatestBooking) return;

        Alert.prompt(
            "Edit Final Price",
            `Current agreed price: ₹${myLatestBooking.finalPrice.toLocaleString()}\n\nEnter the new agreed price:`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Update",
                    onPress: async (newPrice) => {
                        const price = parseFloat(newPrice);
                        if (isNaN(price) || price < 0) {
                            return toast.error("Please enter a valid amount.");
                        }
                        try {
                            setLoading(true);
                            await api.patch(`/bookings/${myLatestBooking._id}/price`, {
                                finalPrice: price,
                                note: "Price updated from Mandal Details screen"
                            });
                            toast.success("Agreed price updated successfully.");
                            fetchDetails();
                        } catch (err) {
                            toast.error(err.response?.data?.message || "Failed to update price.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ],
            "plain-text",
            String(myLatestBooking.finalPrice)
        );
    };

    const handleCloseBooking = () => {
        if (!myLatestBooking) return;

        Alert.alert(
            "Close Booking?",
            "Closing this booking will mark it as finalized. This action cannot be undone.",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Close It",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await api.patch(`/bookings/${myLatestBooking._id}/close`);
                            toast.success("Booking closed successfully.");
                            fetchDetails();
                        } catch (err) {
                            toast.error(err.response?.data?.message || "Failed to close booking.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.flex}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
                <ScreenHeader title="Mandal Details" onBack={() => navigation.goBack()} />
                <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
            </View>
        );
    }

    // Find the latest (most recent year) booking that belongs to me
    const isMyBooking = (item) =>
        item.vendorId?._id === user?._id ||
        (user?.role === 'manager' && item.vendorId?._id === user?.ownerId);

    const myLatestBooking = [...bookings].sort((a, b) => b.year - a.year).find(isMyBooking);

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader
                title={mandal?.ganpatiTitle || 'Mandal Details'}
                onBack={() => navigation.goBack()}
            />

            <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchDetails(true)} colors={[Colors.primary]} />
                    }
                >

                    {/* Hero section */}
                    <View style={styles.heroSection}>
                        <View style={styles.heroRow}>
                            <View style={styles.heroText}>
                                <Text style={styles.heroTitle}>{mandal?.ganpatiTitle}</Text>
                                {(mandal?.area || mandal?.city) ? (
                                    <View style={styles.locationRow}>
                                        <Feather name="map-pin" size={12} color={Colors.textMuted} />
                                        <Text style={styles.locationText}>
                                            {[mandal.area, mandal.city].filter(Boolean).join(', ')}
                                        </Text>
                                    </View>
                                ) : null}
                                <View style={styles.tagsRow}>
                                    {mandal?.mandalName ? (
                                        <View style={styles.tag}>
                                            <Feather name="users" size={10} color={Colors.primary} />
                                            <Text style={styles.tagText}>{mandal.mandalName}</Text>
                                        </View>
                                    ) : null}
                                    {myLatestBooking ? (
                                        <View style={[styles.tag, styles.tagGreen]}>
                                            <Text style={styles.tagGreenText}>Active Booking</Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                            {/* Monogram circle
                            <View style={styles.monogramCircle}>
                                <Feather name="image" size={22} color={Colors.textMuted} />
                            </View> */}
                        </View>
                    </View>

                    {/* Booking Summary (latest own booking) */}
                    {myLatestBooking ? (
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryHeader}>
                                <Feather name="trending-down" size={15} color={Colors.primary} />
                                <Text style={styles.summaryTitle}>Booking Summary</Text>
                            </View>
                            <View style={styles.statGrid}>
                                <StatBox iconName="scissors" label="MURTI SIZE" value={myLatestBooking.murtiSize || '—'} />
                                <View style={styles.statBox}>
                                    <View style={styles.statIconRow}>
                                        <Text style={{ fontSize: 13, color: Colors.textMuted, fontWeight: '700' }}>₹</Text>
                                        <Text style={styles.statLabel}>FINAL PRICE</Text>
                                    </View>
                                    <Text style={styles.statValue}>₹{(myLatestBooking.finalPrice || 0).toLocaleString()}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <View style={styles.statIconRow}>
                                        <Text style={{ fontSize: 13, color: Colors.textMuted, fontWeight: '700' }}>₹</Text>
                                        <Text style={styles.statLabel}>TOTAL PAID</Text>
                                    </View>
                                    <Text style={styles.statValue}>₹{(myLatestBooking.totalPaid || 0).toLocaleString()}</Text>
                                </View>
                                <StatBox
                                    iconName="clock"
                                    label="REMAINING"
                                    value={`₹${Math.max(0, myLatestBooking.remainingAmount || 0).toLocaleString()}`}
                                    valueColor={(myLatestBooking.remainingAmount || 0) > 0 ? Colors.danger : Colors.success}
                                />
                            </View>
                        </View>
                    ) : null}

                    {/* Payment health bar */}
                    {myLatestBooking && (myLatestBooking.finalPrice || 0) > 0 ? (
                        <PaymentHealthBar
                            remaining={Math.max(0, myLatestBooking.remainingAmount || 0)}
                            finalPrice={myLatestBooking.finalPrice || 0}
                        />
                    ) : null}

                    {/* Recent Payments */}
                    {myLatestBooking?.payments?.length > 0 ? (
                        <View>
                            <View style={styles.recentHeader}>
                                <Text style={styles.recentTitle}>Recent Payments</Text>
                                <TouchableOpacity
                                    style={styles.viewHistoryBtn}
                                    onPress={() => navigation.navigate('PaymentLogs', {
                                        bookingId: myLatestBooking._id,
                                        mandalName: mandal?.ganpatiTitle,
                                        year: myLatestBooking.year,
                                    })}
                                >
                                    <Text style={styles.viewHistoryText}>View Complete History</Text>
                                    <Feather name="chevron-right" size={14} color={Colors.primary} />
                                </TouchableOpacity>
                            </View>
                            {[...myLatestBooking.payments].slice(0, 3).map((p, idx) => {
                                const date = new Date(p.paymentDate || p.createdAt);
                                const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                const modeLabel = p.paymentMode === 'upi' ? 'UPI Transfer' : p.paymentMode === 'cheque' ? 'Bank Transfer' : 'Cash Payment';
                                const isVerified = !p.isAdvance;
                                return (
                                    <View key={idx} style={styles.paymentRow}>
                                        <View style={styles.paymentIconWrap}>
                                            <Text style={{ fontSize: 14, color: Colors.primary, fontWeight: '800' }}>₹</Text>
                                        </View>
                                        <View style={styles.paymentInfo}>
                                            <Text style={styles.paymentAmount}>₹{(p.amount || 0).toLocaleString()} Received</Text>
                                            <View style={styles.paymentMeta}>
                                                <Feather name="clock" size={10} color={Colors.textMuted} />
                                                <Text style={styles.paymentMetaText}>{dateStr} · {modeLabel}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.paymentStatus, p.isAdvance ? styles.statusAdvance : styles.statusVerified]}>
                                            <Text style={[styles.paymentStatusText, p.isAdvance ? styles.statusAdvanceText : styles.statusVerifiedText]}>
                                                {p.isAdvance ? 'Advance' : 'Verified'}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}

                    {/* Older bookings listing */}
                    {bookings.filter(b => b !== myLatestBooking).length > 0 ? (
                        <View style={styles.historySection}>
                            <Text style={styles.historySectionLabel}>ALL MURTIKARS</Text>
                            {bookings.filter(b => b !== myLatestBooking).map(item => {
                                const remaining = item.remainingAmount || 0;
                                const isFullyPaid = remaining <= 0;
                                const extra = remaining < 0 ? Math.abs(remaining) : 0;
                                const workshop = item.vendorId?.workshopName || item.vendorId?.name || 'Unknown';
                                const murtikar = item.vendorId?.name || 'Murtikar';

                                return (
                                    <View key={item._id} style={styles.historyCard}>
                                        <View style={styles.historyMainRow}>
                                            <View style={styles.historyTextCol}>
                                                <Text style={styles.historyYear}>{item.year}</Text>
                                                <Text style={styles.historyName}>{murtikar}</Text>
                                                <Text style={styles.historyWorkshop}>{workshop}</Text>
                                            </View>
                                            <View style={styles.historyAmountCol}>
                                                <View style={[styles.statusBadge, isFullyPaid ? styles.statusBadgePaid : styles.statusBadgeDue]}>
                                                    <Text style={[styles.statusBadgeText, isFullyPaid ? styles.statusBadgePaidText : styles.statusBadgeDueText]}>
                                                        {isFullyPaid ? 'Fully Paid' : 'Due'}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.historyAmount, !isFullyPaid && { color: Colors.danger }]}>
                                                    ₹{Math.max(0, remaining).toLocaleString()}
                                                </Text>
                                                <Text style={styles.amountLabel}>{isFullyPaid ? 'paid' : 'due'}</Text>
                                                {extra > 0 && (
                                                    <Text style={styles.extraText}>+₹{extra.toLocaleString()} extra</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}

                </ScrollView>
            </Animated.View>

            {/* Add New Payment sticky footer — only if I have a booking */}
            {myLatestBooking ? (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.addPayBtn}
                        onPress={() => navigation.navigate('AddPayment', {
                            bookingId: myLatestBooking._id,
                            mandalName: mandal?.ganpatiTitle,
                            remainingAmount: myLatestBooking.remainingAmount,
                        })}
                    >
                        <Text style={{ fontSize: 18, color: Colors.white, fontWeight: '800' }}>₹</Text>
                        <Text style={styles.addPayText}>Add New Payment</Text>
                    </TouchableOpacity>
                    <View style={styles.footerActions}>
                        <TouchableOpacity style={styles.footerActionBtn} onPress={handleEditPrice}>
                            <Feather name="edit-2" size={14} color={Colors.primary} />
                            <Text style={styles.footerActionText}>Edit Price</Text>
                        </TouchableOpacity>
                        <View style={styles.footerDivider} />
                        <TouchableOpacity style={styles.footerActionBtn} onPress={handleCloseBooking}>
                            <Feather name="lock" size={14} color={Colors.danger} />
                            <Text style={[styles.footerActionText, { color: Colors.danger }]}>Close Booking</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { padding: Spacing.lg, paddingBottom: 120 },

    // Hero
    heroSection: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm,
        borderTopWidth: 3, borderTopColor: Colors.primary,
    },
    heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    heroText: { flex: 1, marginRight: Spacing.md },
    heroTitle: { fontSize: Font.xl + 2, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
    locationText: { fontSize: Font.xs, color: Colors.textMuted },
    tagsRow: { flexDirection: 'row', gap: 6 },
    tag: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.primaryMuted, borderRadius: Radius.full,
        paddingHorizontal: 8, paddingVertical: 3,
    },
    tagText: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
    tagGreen: { backgroundColor: Colors.successBg },
    tagGreenText: { fontSize: 10, color: Colors.success, fontWeight: '600' },
    monogramCircle: {
        width: 56, height: 56, borderRadius: Radius.md,
        backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.cardBorder,
    },

    // Booking Summary card
    summaryCard: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm,
    },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
    summaryTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    statBox: {
        flex: 1, minWidth: '44%', backgroundColor: Colors.bg,
        borderRadius: Radius.md, padding: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    statLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5 },
    statValue: { fontSize: Font.lg, fontWeight: '800', color: Colors.textPrimary },

    // Payment Health
    healthCard: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm,
    },
    healthHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
    healthHeading: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.2 },
    healthLabel: { fontSize: Font.sm, fontWeight: '700' },
    healthBarTrack: {
        height: 8, backgroundColor: Colors.bg,
        borderRadius: Radius.full, overflow: 'hidden', marginBottom: 8,
    },
    healthBarFill: { height: 8, borderRadius: Radius.full },
    healthNoteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    healthNote: { fontSize: Font.xs, color: Colors.textMuted, flex: 1, lineHeight: 16 },

    // Recent Payments
    recentHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: Spacing.md,
    },
    recentTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    viewHistoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewHistoryText: { fontSize: Font.sm, color: Colors.primary, fontWeight: '700' },

    paymentRow: {
        backgroundColor: Colors.card, borderRadius: Radius.md,
        flexDirection: 'row', alignItems: 'center',
        padding: Spacing.md, marginBottom: Spacing.sm,
        borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm,
    },
    paymentIconWrap: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md,
    },
    paymentInfo: { flex: 1 },
    paymentAmount: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    paymentMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
    paymentMetaText: { fontSize: Font.xs, color: Colors.textMuted },
    paymentStatus: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
    statusVerified: { backgroundColor: Colors.successBg },
    statusAdvance: { backgroundColor: Colors.orangeBg, borderWidth: 1, borderColor: Colors.orange + '20' },
    paymentStatusText: { fontSize: Font.xs, fontWeight: '700' },
    statusVerifiedText: { color: Colors.success },
    statusAdvanceText: { color: Colors.orange },

    // Booking history section
    historySection: { marginTop: Spacing.md },
    historySectionLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.4, marginBottom: Spacing.md },
    historyCard: {
        backgroundColor: Colors.card, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.separator,
    },
    historyMainRow: { flexDirection: 'row', justifyContent: 'space-between' },
    historyTextCol: { flex: 1 },
    historyYear: { fontSize: Font.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
    historyName: { fontSize: Font.sm, color: Colors.textSecondary, marginBottom: 2 },
    historyWorkshop: { fontSize: Font.xs, color: Colors.textMuted },

    historyAmountCol: { alignItems: 'flex-end' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, marginBottom: 4 },
    statusBadgePaid: { backgroundColor: Colors.successBg },
    statusBadgeDue: { backgroundColor: Colors.dangerBg },
    statusBadgeText: { fontSize: 10, fontWeight: '700' },
    statusBadgePaidText: { color: Colors.success },
    statusBadgeDueText: { color: Colors.danger },

    historyAmount: { fontSize: Font.lg + 2, fontWeight: '800', color: Colors.textPrimary },
    amountLabel: { fontSize: Font.xs, color: Colors.textMuted, marginTop: -2 },
    extraText: { fontSize: Font.sm, color: Colors.success, fontWeight: '700', marginTop: 4 },

    // Footer
    footer: {
        backgroundColor: Colors.surface, paddingHorizontal: Spacing.lg,
        paddingBottom: 24, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: Colors.separator, ...Shadow.sm,
    },
    addPayBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.full,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 16, marginBottom: 10, ...Shadow.sm,
    },
    addPayText: { fontSize: Font.md, fontWeight: '700', color: Colors.white },
    footerActions: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl },
    footerActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
    footerActionText: { fontSize: Font.sm, color: Colors.primary, fontWeight: '600' },
    footerDivider: { width: 1, backgroundColor: Colors.separator },
});
