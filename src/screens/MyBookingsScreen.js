import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Animated, ActivityIndicator, StatusBar, Modal,
    TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing, gradeConfig, getGradeConfig } from '../theme';
import { toast } from '../utils/toast';


export default function MyBookingsScreen({ navigation }) {
    const { user } = useAuth();
    const isManager = user?.role === 'manager';
    const [bookings, setBookings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Edit price modal state
    const [editModal, setEditModal] = useState(null); // { bookingId, currentPrice }
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
    }, []);

    useEffect(() => { fetchBookings(); }, []);

    const handleEditPrice = async () => {
        if (isManager) {
            toast.error('Only the workshop owner can edit the price.');
            setEditModal(null);
            return;
        }
        const price = Number(newPrice);

        if (isNaN(price) || price <= 0) {
            toast.error('Enter a valid price.');
            return;
        }
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

    // Group by year descending
    const grouped = bookings.reduce((acc, b) => {
        const yr = b.year;
        if (!acc[yr]) acc[yr] = [];
        acc[yr].push(b);
        return acc;
    }, {});
    const years = Object.keys(grouped).sort((a, b) => b - a);

    if (loading) {
        return (
            <View style={styles.flex}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
                <ScreenHeader title="My Bookings" onBack={() => navigation.goBack()} />
                <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
            </View>
        );
    }

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="My Bookings" onBack={() => navigation.goBack()} />

            <Animated.FlatList
                style={{ opacity: fadeAnim }}
                data={years}
                keyExtractor={yr => yr}
                contentContainerStyle={styles.list}
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchBookings(true); }}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No bookings yet.</Text>
                        <Text style={styles.emptyHint}>Use "Book Mandal" to create your first booking.</Text>
                    </View>
                }
                renderItem={({ item: yr }) => (
                    <View style={styles.yearSection}>
                        <View style={styles.yearHeader}>
                            <Text style={styles.yearText}>{yr}</Text>
                            <View style={styles.yearDivider} />
                            <Text style={styles.yearCount}>{grouped[yr].length} booking{grouped[yr].length !== 1 ? 's' : ''}</Text>
                        </View>
                        {grouped[yr].map(booking => (
                            <BookingCard
                                key={booking._id}
                                booking={booking}
                                isManager={isManager}
                                onPress={() => navigation.navigate('MandalDetails', { mandalId: booking.mandalId?._id })}
                                onPressAddPayment={() => navigation.navigate('AddPayment', { bookingId: booking._id })}
                                onPressEdit={() => {
                                    if (isManager) {
                                        toast.error('Only the owner can edit the price.');
                                        return;
                                    }
                                    setNewPrice(String(booking.finalPrice || ''));
                                    setEditModal({
                                        bookingId: booking._id,
                                        currentPrice: booking.finalPrice,
                                        isLocked: booking.isPriceLocked || (booking.remainingAmount || 0) <= 0,
                                    });
                                }}
                                onPressDelete={() => {
                                    if (isManager) {
                                        toast.error('Only the owner can delete bookings.');
                                        return;
                                    }
                                    handleDelete(booking._id, booking.mandalId?.ganpatiTitle || 'this mandal');
                                }}
                                isPriceLocked={booking.isPriceLocked || (booking.remainingAmount || 0) <= 0}
                            />

                        ))}
                    </View>
                )}
            />

            {/* ─── Edit Price Modal ─── */}
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
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
    const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
    const cfg = getGradeConfig(booking.remainingAmount || 0);
    const rawRemaining = booking.remainingAmount || 0;
    const displayRemaining = Math.max(0, rawRemaining);
    const extraPaid = rawRemaining < 0 ? Math.abs(rawRemaining) : 0;

    return (
        <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
            <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{booking.mandalId?.ganpatiTitle || 'Mandal'}</Text>
                        <Text style={styles.cardSub} numberOfLines={1}>{booking.mandalId?.mandalName}</Text>
                        <Text style={styles.murtiSize}>{booking.murtiSize}</Text>
                    </View>
                    <View style={styles.cardRight}>
                        <View style={[styles.gradeBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.gradeText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        <Text style={[styles.remaining, { color: cfg.color }]}>₹{displayRemaining.toLocaleString()}</Text>
                        <Text style={styles.remainingLabel}>{extraPaid > 0 ? 'fully paid' : 'remaining'}</Text>
                        {extraPaid > 0 && (
                            <Text style={styles.extraPaid}>+₹{extraPaid.toLocaleString()} extra</Text>
                        )}
                    </View>
                </View>

                {/* Finance row */}
                <View style={styles.financeRow}>
                    <FinCol label="Final Price" value={`₹${(booking.finalPrice || 0).toLocaleString()}`} />
                    <FinCol label="Total Paid" value={`₹${(booking.totalPaid || 0).toLocaleString()}`} />
                    <FinCol label="Original" value={`₹${(booking.originalPrice || 0).toLocaleString()}`} muted />
                </View>

                {/* Action row */}
                <View style={styles.actionRow}>
                    <ActionBtn label="+ Payment" color={Colors.accent} onPress={onPressAddPayment} />
                    <ActionBtn
                        label={isManager ? 'Owner Only' : (isPriceLocked ? 'Price Locked' : 'Edit Price')}
                        color={Colors.textMuted}
                        onPress={onPressEdit}
                        border
                        disabled={isManager}
                    />
                    <ActionBtn
                        label={isManager ? 'Owner Only' : 'Delete'}
                        color={isManager ? Colors.textMuted : Colors.danger}
                        onPress={onPressDelete}
                        border
                        disabled={isManager}
                    />
                </View>

                {/* Attribution row — visible to both owner and manager */}
                <View style={styles.attributionRow}>
                    {booking.createdBy?.name ? (
                        <Text style={styles.attributionText}>
                            Booked by: {booking.createdBy.name}
                            {booking.createdBy.role === 'manager' ? ' (Manager)' : ' (Owner)'}
                        </Text>
                    ) : null}
                    {isManager && (
                        <Text style={styles.attributionText}>
                            Workshop: {booking.vendorId?.workshopName || '—'}
                        </Text>
                    )}
                </View>

            </Animated.View>
        </TouchableOpacity>
    );
}


function FinCol({ label, value, muted }) {
    return (
        <View style={styles.finCol}>
            <Text style={styles.finLabel}>{label}</Text>
            <Text style={[styles.finValue, muted && { color: Colors.textMuted }]}>{value}</Text>
        </View>
    );
}

function ActionBtn({ label, color, onPress, border, disabled }) {
    return (
        <TouchableOpacity
            style={[
                styles.actionBtn,
                border && styles.actionBtnBorder,
                border && { borderColor: disabled ? Colors.separator : color },
                disabled && styles.actionBtnDisabled,
            ]}
            onPress={onPress}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
            <Text style={[styles.actionBtnText, { color: disabled ? Colors.textMuted : color }]}>{label}</Text>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    list: { padding: Spacing.lg, paddingBottom: 48 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    emptyText: { fontSize: Font.lg, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm },
    emptyHint: { fontSize: Font.sm, color: Colors.textMuted, textAlign: 'center' },

    yearSection: { marginBottom: Spacing.xl },
    yearHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
    yearText: { fontSize: Font.xl, fontWeight: '800', color: Colors.accent, marginRight: Spacing.md },
    yearDivider: { flex: 1, height: 1, backgroundColor: Colors.separator },
    yearCount: { fontSize: Font.xs, color: Colors.textMuted, marginLeft: Spacing.md, fontWeight: '600' },

    card: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
    cardInfo: { flex: 1, marginRight: Spacing.md },
    cardTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    cardSub: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 2 },
    murtiSize: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 4 },
    cardRight: { alignItems: 'flex-end' },
    gradeBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
    gradeText: { fontSize: Font.xs, fontWeight: '700' },
    remaining: { fontSize: Font.lg, fontWeight: '800' },
    remainingLabel: { fontSize: Font.xs, color: Colors.textMuted },
    extraPaid: { fontSize: Font.xs, fontWeight: '700', color: '#1B5E20', marginTop: 1 },

    financeRow: {
        flexDirection: 'row', gap: Spacing.md,
        paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.separator,
        marginBottom: Spacing.md,
    },
    finCol: { flex: 1 },
    finLabel: { fontSize: Font.xs, color: Colors.textMuted, marginBottom: 2 },
    finValue: { fontSize: Font.sm, fontWeight: '600', color: Colors.textSecondary },

    actionRow: {
        flexDirection: 'row', gap: Spacing.sm,
        paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.separator,
    },
    actionBtn: {
        flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm,
        backgroundColor: Colors.accentMuted,
    },
    actionBtnBorder: { backgroundColor: 'transparent', borderWidth: 1 },
    actionBtnText: { fontSize: Font.xs, fontWeight: '700' },
    actionBtnDisabled: { opacity: 0.5 },

    // Manager attribution footer on each booking card
    attributionRow: {
        marginTop: Spacing.sm, paddingTop: Spacing.sm,
        borderTopWidth: 1, borderTopColor: Colors.separator,
    },
    attributionText: { fontSize: Font.xs, color: Colors.textMuted, fontStyle: 'italic' },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: Spacing.xl, paddingBottom: 40,
    },
    modalTitle: { fontSize: Font.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
    modalSub: { fontSize: Font.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
    modalInput: {
        borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: Radius.sm,
        paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: Font.md,
        color: Colors.textPrimary, marginBottom: Spacing.lg,
    },
    modalActions: { flexDirection: 'row', gap: Spacing.md },
    cancelBtn: {
        flex: 1, paddingVertical: 13, alignItems: 'center',
        borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    cancelText: { color: Colors.textSecondary, fontWeight: '600', fontSize: Font.sm },
    updateBtn: { flex: 2 },
    lockedBanner: {
        backgroundColor: Colors.dangerBg, borderRadius: Radius.sm,
        padding: Spacing.md, marginBottom: Spacing.md,
    },
    lockedText: { color: Colors.danger, fontWeight: '600', fontSize: Font.sm, textAlign: 'center' },
    modalHint: { fontSize: Font.xs, color: Colors.textMuted, marginBottom: Spacing.lg, marginTop: -Spacing.sm },
});

