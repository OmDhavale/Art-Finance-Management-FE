import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Animated, StatusBar,
} from 'react-native';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Font, Radius, Spacing, gradeConfig } from '../theme';
import { toast } from '../utils/toast';

export default function MandalDetailsScreen({ route, navigation }) {
    const { mandalId } = route.params;
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
        const cfg = gradeConfig[item.grade] || gradeConfig.red;
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
                <Row label="Remaining" value={`₹${(item.remainingAmount || 0).toLocaleString()}`} valueColor={cfg.color} bold />

                <TouchableOpacity
                    style={styles.addPayBtn}
                    onPress={() => navigation.navigate('AddPayment', { bookingId: item._id })}
                >
                    <Text style={styles.addPayText}>+ Add Payment</Text>
                </TouchableOpacity>
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
});
