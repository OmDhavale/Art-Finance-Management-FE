import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Animated, ActivityIndicator, StatusBar, Modal,
    TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing, Shadow, gradeConfig, getGradeConfig } from '../theme';
import { toast } from '../utils/toast';

export default function MyBookingsScreen({ navigation }) {
    const { user } = useAuth();
    const isManager = user?.role === 'manager';
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Edit price modal state
    const [editModal, setEditModal] = useState(null);
    const [newPrice, setNewPrice] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const fetchBookings = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const res = await api.get('/bookings/my');
            setBookings(res.data.data || []);
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        } catch {
            toast.error('Failed to load your bookings.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fadeAnim]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const handleEditPrice = async () => {
        if (isManager) {
            toast.error('Only the workshop owner can edit the price.');
            setEditModal(null);
            return;
        }
        const price = Number(newPrice);
        if (isNaN(price) || price <= 0) { toast.error('Enter a valid price.'); return; }
        setEditLoading(true);
        try {
            const res = await api.patch(`/bookings/${editModal.bookingId}/price`, { finalPrice: price });
            const updated = res.data.data;
            setBookings(prev => prev.map(b => b._id === updated._id ? { ...b, ...updated } : b));
            toast.success('Price updated successfully.');
            setEditModal(null);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update price.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = (bookingId, mandalTitle) => {
        Alert.alert(
            'Delete Booking',
            `Delete your booking for "${mandalTitle}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/bookings/${bookingId}`);
                            setBookings(prev => prev.filter(b => b._id !== bookingId));
                            toast.success('Booking deleted.');
                        } catch (err) {
                            toast.error(err?.response?.data?.message || 'Failed to delete booking.');
                        }
                    },
                },
            ]
        );
    };

    // Grouping and Stats
    const grouped = bookings.reduce((acc, b) => {
        const yr = b.year;
        if (!acc[yr]) acc[yr] = [];
        acc[yr].push(b);
        return acc;
    }, {});
    const years = Object.keys(grouped).sort((a, b) => b - a);

    const lifetimeTotal = bookings.reduce((sum, b) => sum + (b.totalPaid || 0), 0);
    const totalPending = bookings.reduce((sum, b) => sum + Math.max(0, b.remainingAmount || 0), 0);
    const pendingMandalsCount = bookings.filter(b => (b.remainingAmount || 0) > 0).length;

    if (loading) {
        return (
            <View style={styles.flex}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
                <ScreenHeader title="Booking History" onBack={() => navigation.goBack()} />
                <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
            </View>
        );
    }

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Booking History" onBack={() => navigation.goBack()} />

            <Animated.FlatList
                style={{ opacity: fadeAnim }}
                data={years}
                keyExtractor={yr => yr}
                contentContainerStyle={styles.list}
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchBookings(true); }}
                ListHeaderComponent={bookings.length > 0 ? (
                    <View style={styles.summaryBanner}>
                        {/* Lifetime Collection Row */}
                        <View style={styles.mainStatRow}>
                            <View>
                                <Text style={styles.bannerLabelText}>LIFETIME COLLECTION</Text>
                                <Text style={styles.bannerMainValue}>₹ {lifetimeTotal.toLocaleString()}</Text>
                            </View>
                            <View style={styles.bannerCircleIcon}>
                                <Feather name="award" size={24} color={Colors.white} />
                            </View>
                        </View>

                        {/* Summary Divider */}
                        <View style={styles.bannerDivider} />

                        {/* Secondary Stats Row */}
                        <View style={styles.secondaryStatRow}>
                            <View style={styles.statBox}>
                                <View style={styles.statHeaderRow}>
                                    <Feather name="clock" size={12} color="rgba(255,255,255,0.7)" />
                                    <Text style={styles.statLabelText}>PENDING</Text>
                                </View>
                                <Text style={styles.statValueText}>₹ {totalPending.toLocaleString()}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <View style={styles.statHeaderRow}>
                                    <Feather name="users" size={12} color="rgba(255,255,255,0.7)" />
                                    <Text style={styles.statLabelText}>DUE MANDALS</Text>
                                </View>
                                <Text style={styles.statValueText}>{pendingMandalsCount} Mandals</Text>
                            </View>
                        </View>
                    </View>
                ) : null}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No bookings yet.</Text>
                        <Text style={styles.emptyHint}>Use "Book Mandal" to create your first booking.</Text>
                    </View>
                }
                renderItem={({ item: yr }) => (
                    <View style={styles.yearSection}>
                        <View style={styles.yearHeader}>
                            <View style={styles.yearLeft}>
                                <Feather name="calendar" size={16} color={Colors.primary} />
                                <Text style={styles.yearText}>Season {yr}</Text>
                            </View>
                            <View style={styles.yearRight}>
                                <Text style={styles.yearTotalLabel}>COLLECTION</Text>
                                <Text style={styles.yearTotalValue}>
                                    ₹{grouped[yr].reduce((s, b) => s + (b.totalPaid || 0), 0).toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        {grouped[yr].map(booking => (
                            <BookingCard
                                key={booking._id}
                                booking={booking}
                                isManager={isManager}
                                onPress={() => navigation.navigate('MandalDetails', { mandalId: booking.mandalId?._id })}
                                onPressAddPayment={() => navigation.navigate('AddPayment', {
                                    bookingId: booking._id,
                                    mandalName: [booking.mandalId?.ganpatiTitle, booking.mandalId?.mandalName].filter(Boolean).join(' – '),
                                    remainingAmount: booking.remainingAmount,
                                })}
                                onPressEdit={() => {
                                    if (isManager) { toast.error('Only the owner can edit the price.'); return; }
                                    setNewPrice(String(booking.finalPrice || ''));
                                    setEditModal({
                                        bookingId: booking._id,
                                        currentPrice: booking.finalPrice,
                                        isLocked: booking.isPriceLocked || (booking.remainingAmount || 0) <= 0,
                                    });
                                }}
                                onPressDelete={() => {
                                    if (isManager) { toast.error('Only the owner can delete bookings.'); return; }
                                    handleDelete(booking._id, booking.mandalId?.ganpatiTitle || 'this mandal');
                                }}
                                isPriceLocked={booking.isPriceLocked || (booking.remainingAmount || 0) <= 0}
                            />
                        ))}
                    </View>
                )}
                ListFooterComponent={bookings.length > 0 ? (
                    <Text style={styles.footerNote}>End of booking history</Text>
                ) : null}
            />

            {/* Edit Price Modal */}
            <Modal visible={!!editModal} transparent animationType="fade" onRequestClose={() => setEditModal(null)}>
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Edit Final Price</Text>
                        <Text style={styles.modalSub}>Current: ₹{(editModal?.currentPrice || 0).toLocaleString()}</Text>
                        {editModal?.isLocked ? (
                            <View style={styles.lockedBanner}>
                                <Text style={styles.lockedText}>Price cannot be edited after payment completion.</Text>
                            </View>
                        ) : (
                            <>
                                <TextInput
                                    style={styles.modalInput}
                                    value={newPrice}
                                    onChangeText={setNewPrice}
                                    keyboardType="numeric"
                                    placeholder="New final price (must be ≤ current)"
                                    placeholderTextColor={Colors.textMuted}
                                    autoFocus
                                />
                                <Text style={styles.modalHint}>Price can only be reduced, not increased.</Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(null)}>
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <PrimaryButton
                                        title="Update Price"
                                        onPress={handleEditPrice}
                                        loading={editLoading}
                                        style={styles.updateBtn}
                                    />
                                </View>
                            </>
                        )}
                        {editModal?.isLocked && (
                            <TouchableOpacity style={[styles.cancelBtn, { marginTop: Spacing.md, flex: 0, width: '100%' }]} onPress={() => setEditModal(null)}>
                                <Text style={styles.cancelText}>Close</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

function BookingCard({ booking, isManager, onPress, onPressAddPayment, onPressEdit, onPressDelete, isPriceLocked }) {
    const rawRemaining = booking.remainingAmount || 0;
    const displayRemaining = Math.max(0, rawRemaining);
    const extraPaid = rawRemaining < 0 ? Math.abs(rawRemaining) : 0;

    const isPaid = displayRemaining === 0 || extraPaid > 0;
    const isPartial = !isPaid && (booking.totalPaid || 0) > 0;
    const statusLabel = isPaid ? 'Paid' : isPartial ? 'Partial' : 'Pending';
    const statusColor = isPaid ? Colors.success : isPartial ? Colors.warning : Colors.danger;
    const statusBg = isPaid ? Colors.successBg : isPartial ? Colors.warningBg : Colors.dangerBg;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{booking.mandalId?.ganpatiTitle || 'Mandal'}</Text>
                        <Text style={styles.cardSub}>Vendor: {booking.mandalId?.mandalName || '—'}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>⊙ {statusLabel}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.finRow}>
                    <FinCol label="TOTAL" value={`₹ ${(booking.finalPrice || 0).toLocaleString()}`} />
                    <FinCol label="PAID" value={`₹ ${(booking.totalPaid || 0).toLocaleString()}`} valueColor={Colors.textPrimary} />
                    <FinCol
                        label={extraPaid > 0 ? "OVERPAID" : "PENDING"}
                        value={displayRemaining > 0 ? `₹${displayRemaining.toLocaleString()}` : (extraPaid > 0 ? `+₹${extraPaid.toLocaleString()}` : '₹0')}
                        valueColor={displayRemaining > 0 ? Colors.danger : Colors.success}
                        subLabel={extraPaid > 0 ? "extra received" : null}
                    />
                </View>

                <View style={styles.cardFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="calendar" size={12} color={Colors.textMuted} />
                        <Text style={styles.cardSeason}>Season {booking.year}</Text>
                    </View>
                    <View style={styles.cardActions}>
                        <TouchableOpacity onPress={onPressAddPayment} style={styles.footerActionBtn}>
                            <Text style={styles.footerActionText}>+ Payment</Text>
                        </TouchableOpacity>
                        {!isManager && (
                            <>
                                <TouchableOpacity onPress={onPressEdit} style={styles.footerActionBtnGray}>
                                    {isPriceLocked ? <Feather name="lock" size={12} color={Colors.textMuted} /> : <Text style={styles.footerActionTextGray}>Edit</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={onPressDelete} style={styles.footerActionBtnGray}>
                                    <Feather name="trash-2" size={12} color={Colors.danger} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                {booking.createdBy?.name ? (
                    <Text style={styles.attribution}>
                        Booked by: {booking.createdBy.name} {booking.createdBy.role === 'manager' ? '(Manager)' : '(Owner)'}
                    </Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
}

function FinCol({ label, value, valueColor, subLabel }) {
    return (
        <View style={styles.finCol}>
            <Text style={styles.finLabel}>{label}</Text>
            <Text style={[styles.finValue, valueColor && { color: valueColor }]}>{value}</Text>
            {subLabel && <Text style={styles.finSubLabel}>{subLabel}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    list: { padding: Spacing.lg, paddingBottom: 48 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    emptyText: { fontSize: Font.lg, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm },
    emptyHint: { fontSize: Font.sm, color: Colors.textMuted, textAlign: 'center' },

    summaryBanner: {
        backgroundColor: Colors.primary, borderRadius: Radius.lg,
        padding: Spacing.xl, marginBottom: Spacing.xl, ...Shadow.md,
    },
    mainStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bannerLabelText: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.2 },
    bannerMainValue: { fontSize: Font.xxl + 8, fontWeight: '900', color: Colors.white, marginTop: 4 },
    bannerCircleIcon: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    },
    bannerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: Spacing.lg },
    secondaryStatRow: { flexDirection: 'row' },
    statBox: { flex: 1 },
    statHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    statLabelText: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1 },
    statValueText: { fontSize: Font.lg, fontWeight: '800', color: Colors.white },
    statDivider: { width: 1.5, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: Spacing.xl },

    yearSection: { marginBottom: Spacing.xl },
    yearHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    yearLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    yearText: { fontSize: Font.lg, fontWeight: '800', color: Colors.textPrimary },
    yearRight: { alignItems: 'flex-end' },
    yearTotalLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1 },
    yearTotalValue: { fontSize: Font.sm, fontWeight: '800', color: Colors.primary },

    card: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
    cardInfo: { flex: 1, marginRight: Spacing.sm },
    cardTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    cardSub: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 3 },
    statusPill: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: Font.xs, fontWeight: '700' },
    divider: { height: 1, backgroundColor: Colors.separator, marginBottom: Spacing.md },
    finRow: { flexDirection: 'row', marginBottom: Spacing.md },
    finCol: { flex: 1 },
    finLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.8 },
    finValue: { fontSize: Font.sm, fontWeight: '700', color: Colors.textSecondary, marginTop: 2 },
    finSubLabel: { fontSize: 8, color: Colors.success, fontWeight: '700', marginTop: 1, textTransform: 'uppercase' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardSeason: { fontSize: Font.xs, color: Colors.textMuted },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    footerActionBtn: {
        backgroundColor: Colors.primaryMuted, borderRadius: Radius.full,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    footerActionText: { fontSize: Font.xs, color: Colors.primary, fontWeight: '700' },
    footerActionBtnGray: {
        backgroundColor: Colors.bg, borderRadius: Radius.full,
        paddingHorizontal: 10, paddingVertical: 6,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    footerActionTextGray: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600' },
    attribution: { fontSize: 10, color: Colors.textMuted, fontStyle: 'italic', marginTop: Spacing.sm },
    footerNote: { fontSize: Font.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: Spacing.xl, paddingBottom: 40,
    },
    modalTitle: { fontSize: Font.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
    modalSub: { fontSize: Font.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
    modalInput: {
        borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: Radius.md,
        paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: Font.md,
        color: Colors.textPrimary, marginBottom: Spacing.lg,
    },
    modalActions: { flexDirection: 'row', gap: Spacing.md },
    cancelBtn: {
        flex: 1, paddingVertical: 13, alignItems: 'center',
        borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    cancelText: { color: Colors.textSecondary, fontWeight: '600', fontSize: Font.sm },
    updateBtn: { flex: 2 },
    lockedBanner: {
        backgroundColor: Colors.dangerBg, borderRadius: Radius.md,
        padding: Spacing.md, marginBottom: Spacing.md,
    },
    lockedText: { color: Colors.danger, fontWeight: '600', fontSize: Font.sm, textAlign: 'center' },
    modalHint: { fontSize: Font.xs, color: Colors.textMuted, marginBottom: Spacing.lg, marginTop: -Spacing.sm },
});
