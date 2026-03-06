import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Animated, ActivityIndicator, StatusBar,
} from 'react-native';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Font, Radius, Spacing, gradeConfig } from '../theme';
import { toast } from '../utils/toast';

export default function MyBookingsScreen({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/bookings/my');
            setBookings(res.data.data || []);
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        } catch {
            toast.error('Failed to load your bookings.');
        } finally {
            setLoading(false);
        }
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
                <View style={styles.center}>
                    <ActivityIndicator color={Colors.accent} size="large" />
                </View>
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
                                onPress={() => navigation.navigate('MandalDetails', { mandalId: booking.mandalId?._id })}
                                onPressAddPayment={(id) => navigation.navigate('AddPayment', { bookingId: id })}
                            />
                        ))}
                    </View>
                )}
            />
        </View>
    );
}

function BookingCard({ booking, onPress, onPressAddPayment }) {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
    const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
    const cfg = gradeConfig[booking.grade] || gradeConfig.red;

    return (
        <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
            <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
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
                        <Text style={styles.remaining}>₹{(booking.remainingAmount || 0).toLocaleString()}</Text>
                        <Text style={styles.remainingLabel}>remaining</Text>
                    </View>
                </View>
                <View style={styles.cardFooter}>
                    <View style={styles.footerInfo}>
                        <FinRow label="Final" value={`₹${(booking.finalPrice || 0).toLocaleString()}`} />
                        <FinRow label="Paid" value={`₹${(booking.totalPaid || 0).toLocaleString()}`} />
                    </View>
                    <TouchableOpacity
                        style={styles.addPayBtn}
                        onPress={() => onPressAddPayment(booking._id)}
                    >
                        <Text style={styles.addPayText}>+ Add Payment</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
}

function FinRow({ label, value }) {
    return (
        <View style={styles.finRow}>
            <Text style={styles.finLabel}>{label}</Text>
            <Text style={styles.finValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    list: { padding: Spacing.lg, paddingBottom: 40 },
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
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    cardInfo: { flex: 1, marginRight: Spacing.md },
    cardTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    cardSub: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 2 },
    murtiSize: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 4 },
    cardRight: { alignItems: 'flex-end' },
    gradeBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
    gradeText: { fontSize: Font.xs, fontWeight: '700' },
    remaining: { fontSize: Font.lg, fontWeight: '800', color: Colors.textPrimary },
    remainingLabel: { fontSize: Font.xs, color: Colors.textMuted },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.separator },
    footerInfo: { flexDirection: 'row', gap: Spacing.lg },
    finRow: {},
    finLabel: { fontSize: Font.xs, color: Colors.textMuted, marginBottom: 2 },
    finValue: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '600' },
    addPayBtn: {
        borderWidth: 1, borderColor: Colors.accent, borderRadius: Radius.sm,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    addPayText: { color: Colors.accent, fontSize: Font.xs, fontWeight: '700' },
});
