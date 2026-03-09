import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Animated, StatusBar, SafeAreaView, RefreshControl, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';
import { toast } from '../utils/toast';
import ScreenHeader from '../components/ScreenHeader';

export default function WorkshopDetailsScreen({ navigation }) {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const isOwner = user?.role === 'owner';

    const fetchWorkshopData = async (isRefresh = false) => {
        if (!isRefresh && !data) setLoading(true);
        try {
            const res = await api.get('/users/workshop-users');
            setData(res.data.data);
            // Always ensure content is visible once data is loaded
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        } catch (err) {
            toast.error('Failed to load workshop details.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchWorkshopData(true);
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchWorkshopData(true);
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={Colors.primary} size="large" />
            </View>
        );
    }

    const { owner, managers } = data || {};

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Workshop Profile" onBack={() => navigation.goBack()} />

            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Workshop Info Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.workshopHeader}>
                            <View style={styles.logoCircle}>
                                <Feather name="briefcase" size={24} color={Colors.primary} />
                            </View>
                            <View style={styles.workshopInfoText}>
                                <View style={styles.workshopNameRow}>
                                    <Text style={styles.workshopName}>{owner?.workshopName || 'My Workshop'}</Text>
                                    <View style={styles.roleChip}>
                                        <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <Text style={styles.ownerLabel}>Murtikar: {owner?.name}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailRow}>
                            <DetailItem icon="phone" label="Phone" value={owner?.phone} />
                            <DetailItem icon="map-pin" label="Location" value={`${owner?.location?.area}, ${owner?.location?.city}`} />
                        </View>
                    </View>

                    {/* Management Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>MANAGEMENT TEAM</Text>
                        <View style={styles.countChip}>
                            <Text style={styles.countText}>{managers?.length || 0} Managers</Text>
                        </View>
                    </View>

                    {/* Manager List */}
                    {managers?.length > 0 ? (
                        managers.map((m, idx) => (
                            <View key={m._id} style={styles.managerItem}>
                                <View style={styles.managerIcon}>
                                    <Feather name="user" size={18} color={Colors.textSecondary} />
                                </View>
                                <View style={styles.managerInfo}>
                                    <Text style={styles.managerName}>{m.name}</Text>
                                    <Text style={styles.managerPhone}>{m.phone}</Text>
                                </View>
                                <View style={styles.managerTag}>
                                    <Text style={styles.managerTagText}>MANAGER</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No managers added yet.</Text>
                        </View>
                    )}

                    {/* Add Manager Button (Owners only) */}
                    {isOwner && (
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => navigation.navigate('AddManager')}
                        >
                            <Feather name="plus" size={20} color={Colors.white} />
                            <Text style={styles.addBtnText}>Add New Manager</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

function DetailItem({ icon, label, value }) {
    return (
        <View style={styles.detailItem}>
            <View style={styles.detailIconRow}>
                <Feather name={icon} size={12} color={Colors.textMuted} />
                <Text style={styles.detailLabel}>{label}</Text>
            </View>
            <Text style={styles.detailValue}>{value || '—'}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { padding: Spacing.lg, paddingBottom: 40 },

    roleChip: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm, marginLeft: 8 },
    roleText: { fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },

    infoCard: {
        backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl,
        ...Shadow.md, marginBottom: Spacing.xl,
    },
    workshopHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.md },
    logoCircle: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: Colors.primary + '10', alignItems: 'center', justifyContent: 'center',
    },
    workshopInfoText: { flex: 1 },
    workshopNameRow: { flexDirection: 'row', alignItems: 'center' },
    workshopName: { fontSize: Font.lg, fontWeight: '800', color: Colors.textPrimary },
    ownerLabel: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 1 },

    divider: { height: 1, backgroundColor: Colors.separator, marginVertical: Spacing.sm, marginBottom: Spacing.lg },

    detailRow: { flexDirection: 'row', gap: Spacing.xl },
    detailItem: { flex: 1 },
    detailIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    detailLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
    detailValue: { fontSize: Font.sm, color: Colors.textPrimary, fontWeight: '600' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1 },
    countChip: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.separator, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm },
    countText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700' },

    managerItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.sm,
        ...Shadow.sm,
    },
    managerIcon: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md,
    },
    managerInfo: { flex: 1 },
    managerName: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    managerPhone: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 2 },
    managerTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    managerTagText: { fontSize: 8, fontWeight: '800', color: Colors.textSecondary },

    emptyCard: {
        padding: Spacing.xl, alignItems: 'center', backgroundColor: Colors.white,
        borderRadius: Radius.lg, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.separator
    },
    emptyText: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '600' },

    addBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: Colors.primary, borderRadius: Radius.lg,
        padding: Spacing.md, marginTop: Spacing.xl, gap: 8, ...Shadow.md,
    },
    addBtnText: { color: Colors.white, fontSize: Font.md, fontWeight: '700' },
});
