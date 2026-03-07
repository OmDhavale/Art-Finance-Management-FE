import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Animated, StatusBar, ActivityIndicator, TextInput, RefreshControl, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Font, Radius, Spacing, Shadow, getGradeConfig, overallGradeConfig, getOverallGradeConfig } from '../theme';
import { toast } from '../utils/toast';

export default function MandalSearchScreen({ navigation }) {
    const [allMandals, setAllMandals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState(null); // mandalId of expanded card
    const [gradeFilter, setGradeFilter] = useState('all');    // 'all' | 'O' | 'A' | 'B' | 'C' | 'D'
    const listFade = useRef(new Animated.Value(0)).current;

    const fetchMandals = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const res = await api.get('/mandals');
            setAllMandals(res.data.data || []);
            Animated.timing(listFade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
        } catch {
            toast.error('Failed to load mandals.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchMandals(); }, []);

    // Filter with search + grade
    const filtered = allMandals.filter(m => {
        // Text search
        if (query.trim()) {
            const q = query.toLowerCase();
            const textMatch =
                m.ganpatiTitle?.toLowerCase().includes(q) ||
                m.mandalName?.toLowerCase().includes(q) ||
                m.area?.toLowerCase().includes(q) ||
                m.city?.toLowerCase().includes(q);
            if (!textMatch) return false;
        }
        // Grade filter
        if (gradeFilter !== 'all' && m.overallGrade !== gradeFilter) return false;
        return true;
    });

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Search Mandal" onBack={() => navigation.goBack()} />

            {/* Search bar */}
            <View style={styles.searchWrap}>
                <TextInput
                    style={styles.searchInput}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Filter by title, name, area..."
                    placeholderTextColor={Colors.textMuted}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                        <Text style={styles.clearText}>×</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Grade filter chips */}
            <View style={styles.filterSection}>
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterChip, gradeFilter === 'all' && styles.filterChipActive]}
                        onPress={() => setGradeFilter('all')}
                    >
                        <Text style={[styles.filterChipText, gradeFilter === 'all' && styles.filterChipTextActive]}>Any Grade</Text>
                    </TouchableOpacity>
                    {Object.entries(overallGradeConfig).map(([key, cfg]) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.filterChip,
                                gradeFilter === key && { backgroundColor: cfg.bg, borderColor: cfg.borderColor },
                            ]}
                            onPress={() => setGradeFilter(prev => prev === key ? 'all' : key)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                gradeFilter === key && { color: cfg.color, fontWeight: '800' },
                            ]}>{cfg.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Grade legend */}
            <View style={styles.legendRow}>
                {Object.entries(overallGradeConfig).map(([key, cfg]) => (
                    <View key={key} style={styles.legendItem}>
                        <View style={[styles.legendBadge, { backgroundColor: cfg.bg, borderColor: cfg.borderColor }]}>
                            <Text style={[styles.legendBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        <Text style={styles.legendLabel}>{cfg.fullLabel}</Text>
                    </View>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={Colors.primary} size="large" />
                    <Text style={styles.loadingText}>Loading Directory...</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchMandals(true); }}
                            colors={[Colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>
                                {allMandals.length === 0 ? 'No mandals registered yet.' : 'No mandals match your search.'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <MandalDirectoryCard
                            mandal={item}
                            expanded={expanded === item._id}
                            onToggle={() => setExpanded(prev => prev === item._id ? null : item._id)}
                            onPressDetails={() => navigation.navigate('MandalDetails', { mandalId: item._id })}
                        />
                    )}
                />
            )}
        </View>
    );
}

function MandalDirectoryCard({ mandal, expanded, onToggle, onPressDetails }) {
    const scale = useRef(new Animated.Value(1)).current;
    const ogCfg = mandal.overallGrade ? getOverallGradeConfig(mandal.overallGrade) : null;

    const onIn = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, speed: 40 }).start();
    const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

    return (
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
            <TouchableOpacity onPress={onToggle} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardInitial}>
                        <Text style={styles.cardInitialText}>
                            {(mandal.ganpatiTitle || 'M').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{mandal.ganpatiTitle}</Text>
                        <Text style={styles.cardSub} numberOfLines={1}>{mandal.mandalName}</Text>
                        <Text style={styles.cardLoc} numberOfLines={1}>
                            {[mandal.area, mandal.city].filter(Boolean).join(', ') || 'Unknown'}
                        </Text>
                    </View>
                    <View style={styles.cardRight}>
                        {ogCfg ? (
                            <View style={[styles.overallBadge, { backgroundColor: ogCfg.bg, borderColor: ogCfg.borderColor }]}>
                                <Text style={[styles.overallBadgeText, { color: ogCfg.color }]}>{ogCfg.label}</Text>
                            </View>
                        ) : (
                            <View style={[styles.overallBadge, { backgroundColor: '#F0F0F0', borderColor: '#DDD' }]}>
                                <Text style={[styles.overallBadgeText, { color: Colors.textMuted }]}>–</Text>
                            </View>
                        )}
                        <Text style={styles.totalPending}>
                            {mandal.totalPending > 0 ? `₹${mandal.totalPending.toLocaleString()} due` : 'Clear'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.breakdown}>
                    <View style={styles.breakdownHeader}>
                        <Text style={styles.breakdownLabel}>ALL MURTIKARS</Text>
                        <TouchableOpacity onPress={onPressDetails}>
                            <Text style={styles.detailsLink}>Full Details →</Text>
                        </TouchableOpacity>
                    </View>
                    {mandal.bookingSummary?.length > 0 ? (
                        mandal.bookingSummary.map((b, i) => {
                            const gc = getGradeConfig(b.remainingAmount);
                            const rawR = b.remainingAmount;
                            const dispR = Math.max(0, rawR);
                            const extra = rawR < 0 ? Math.abs(rawR) : 0;
                            return (
                                <View key={i} style={styles.breakdownRow}>
                                    <View style={styles.breakdownLeft}>
                                        <Text style={styles.breakdownYear}>{b.year}</Text>
                                        <Text style={styles.breakdownName}>{b.vendorName}</Text>
                                        {b.workshopName ? <Text style={styles.breakdownWorkshop}>{b.workshopName}</Text> : null}
                                    </View>
                                    <View style={styles.breakdownRight}>
                                        <View style={[styles.miniPill, { backgroundColor: gc.bg }]}>
                                            <Text style={[styles.miniPillText, { color: gc.color }]}>{gc.label}</Text>
                                        </View>
                                        <Text style={[styles.breakdownAmt, { color: gc.color }]}>
                                            ₹{dispR.toLocaleString()}
                                        </Text>
                                        <Text style={styles.breakdownAmtLabel}>{extra > 0 ? 'paid' : 'due'}</Text>
                                        {extra > 0 && (
                                            <Text style={styles.breakdownExtra}>+₹{extra.toLocaleString()} extra</Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyBreakdown}>No booking history available.</Text>
                    )}
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    loadingText: { marginTop: 12, fontSize: Font.sm, color: Colors.textMuted, fontWeight: '600' },

    searchWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.separator,
        paddingHorizontal: Spacing.lg, paddingVertical: 10,
    },
    searchInput: { flex: 1, height: 40, fontSize: Font.sm, color: Colors.textPrimary },
    clearBtn: { padding: 4 },
    clearText: { fontSize: 20, color: Colors.textMuted, lineHeight: 20 },

    filterSection: { padding: Spacing.md, gap: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.separator },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
        backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterChipText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
    filterChipTextActive: { color: Colors.white, fontWeight: '800' },

    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, paddingVertical: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendBadge: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    legendBadgeText: { fontSize: 10, fontWeight: '900' },
    legendLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '700' },

    listContent: { padding: Spacing.lg, paddingBottom: 40 },
    emptyText: { fontSize: Font.sm, color: Colors.textMuted, textAlign: 'center' },

    card: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder,
        ...Shadow.sm, overflow: 'hidden',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
    cardInitial: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md,
    },
    cardInitialText: { fontSize: Font.lg, fontWeight: '800', color: Colors.primary },
    cardInfo: { flex: 1, marginRight: Spacing.sm },
    cardTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    cardSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
    cardLoc: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
    cardRight: { alignItems: 'flex-end', gap: 4 },
    overallBadge: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    overallBadgeText: { fontSize: 12, fontWeight: '900' },
    totalPending: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },

    breakdown: { backgroundColor: Colors.bg + '50', padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.separator },
    breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    breakdownLabel: { fontSize: 9, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1 },
    detailsLink: { fontSize: 11, fontWeight: '700', color: Colors.primary },
    breakdownRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.separator + '50',
    },
    breakdownLeft: { flex: 1 },
    breakdownYear: { fontSize: Font.lg, fontWeight: '800', color: Colors.textPrimary },
    breakdownName: { fontSize: Font.sm, color: Colors.textSecondary },
    breakdownWorkshop: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 1 },
    breakdownRight: { alignItems: 'flex-end' },
    miniPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
    miniPillText: { fontSize: 9, fontWeight: '800' },
    breakdownAmt: { fontSize: Font.md, fontWeight: '800' },
    breakdownAmtLabel: { fontSize: 9, color: Colors.textMuted, marginTop: -2 },
    breakdownExtra: { fontSize: 10, color: Colors.success, fontWeight: '700', marginTop: 2 },
    emptyBreakdown: { fontSize: Font.xs, color: Colors.textMuted, textAlign: 'center', fontStyle: 'italic', paddingVertical: 10 },
});
