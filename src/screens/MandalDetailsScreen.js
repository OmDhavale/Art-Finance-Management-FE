import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import api from '../api/api';

const GRADE_COLORS = {
    green: { bg: '#E8F5E9', text: '#2E7D32', label: '✅ Fully Paid' },
    yellow: { bg: '#FFF9C4', text: '#F9A825', label: '⚡ Almost Done' },
    orange: { bg: '#FFF3E0', text: '#E65100', label: '🔶 Partial' },
    red: { bg: '#FFEBEE', text: '#C62828', label: '🔴 Due' },
};

export default function MandalDetailsScreen({ route, navigation }) {
    const { mandalId } = route.params;
    const [mandal, setMandal] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, []);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/mandals/${mandalId}`);
            setMandal(res.data.data.mandal);
            setBookings(res.data.data.bookingHistory || []);
        } catch (err) {
            Alert.alert('Error', 'Failed to load mandal details.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }

    if (!mandal) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Mandal not found.</Text>
            </View>
        );
    }

    const renderBooking = ({ item }) => {
        const grade = GRADE_COLORS[item.grade] || GRADE_COLORS.red;
        return (
            <View style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                    <Text style={styles.bookingYear}>{item.year}</Text>
                    <View style={[styles.gradeBadge, { backgroundColor: grade.bg }]}>
                        <Text style={[styles.gradeText, { color: grade.text }]}>{grade.label}</Text>
                    </View>
                </View>

                <View style={styles.bookingRow}>
                    <Text style={styles.bookingLabel}>Vendor</Text>
                    <Text style={styles.bookingValue}>
                        {item.vendorId?.name || 'N/A'} ({item.vendorId?.workshopName || '—'})
                    </Text>
                </View>
                <View style={styles.bookingRow}>
                    <Text style={styles.bookingLabel}>Murti Size</Text>
                    <Text style={styles.bookingValue}>{item.murtiSize || '—'}</Text>
                </View>
                <View style={styles.bookingRow}>
                    <Text style={styles.bookingLabel}>Final Price</Text>
                    <Text style={styles.bookingValue}>₹{item.finalPrice?.toLocaleString() || 0}</Text>
                </View>
                <View style={styles.bookingRow}>
                    <Text style={styles.bookingLabel}>Total Paid</Text>
                    <Text style={styles.bookingValue}>₹{item.totalPaid?.toLocaleString() || 0}</Text>
                </View>
                <View style={styles.bookingRow}>
                    <Text style={styles.bookingLabel}>Remaining</Text>
                    <Text style={[styles.bookingValue, { color: grade.text, fontWeight: '700' }]}>
                        ₹{item.remainingAmount?.toLocaleString() || 0}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.paymentButton}
                    onPress={() => navigation.navigate('AddPayment', { bookingId: item._id })}
                >
                    <Text style={styles.paymentButtonText}>+ Add Payment</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <FlatList
            style={styles.container}
            ListHeaderComponent={
                <View>
                    {/* Mandal Info */}
                    <View style={styles.mandalCard}>
                        <Text style={styles.mandalEmoji}>🙏</Text>
                        <Text style={styles.ganpatiTitle}>{mandal.ganpatiTitle}</Text>
                        <Text style={styles.mandalName}>{mandal.mandalName}</Text>
                        <Text style={styles.mandalLocation}>
                            {[mandal.area, mandal.city].filter(Boolean).join(', ')}
                        </Text>
                    </View>

                    <Text style={styles.sectionHeading}>Booking History</Text>
                </View>
            }
            data={bookings}
            keyExtractor={(item) => item._id}
            renderItem={renderBooking}
            ListEmptyComponent={
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>No bookings yet for this mandal.</Text>
                </View>
            }
            contentContainerStyle={styles.list}
        />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF8F5' },
    list: { padding: 16, paddingBottom: 32 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#888', fontSize: 16 },
    mandalCard: {
        backgroundColor: '#FF6B35',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#FF6B35',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    mandalEmoji: { fontSize: 36, marginBottom: 6 },
    ganpatiTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    mandalName: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 4 },
    mandalLocation: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
    sectionHeading: {
        fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 12,
    },
    bookingCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    bookingYear: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    gradeBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    gradeText: { fontSize: 12, fontWeight: '700' },
    bookingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    bookingLabel: { fontSize: 13, color: '#888' },
    bookingValue: { fontSize: 13, color: '#333', fontWeight: '500' },
    paymentButton: {
        marginTop: 12, backgroundColor: '#FF6B35',
        borderRadius: 10, paddingVertical: 10, alignItems: 'center',
    },
    paymentButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    empty: { alignItems: 'center', marginTop: 30 },
    emptyText: { color: '#aaa', fontSize: 14 },
});
