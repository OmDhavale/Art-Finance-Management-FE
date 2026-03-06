import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ScrollView, KeyboardAvoidingView, Platform,
    Animated, StatusBar, ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import ScreenHeader from '../components/ScreenHeader';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing, gradeConfig, getGradeConfig } from '../theme';
import { toast } from '../utils/toast';

const BOOKING_FIELDS = [
    { key: 'murtiSize', label: 'Murti Size *', placeholder: 'e.g. 4 feet', keyboard: 'default' },
    { key: 'originalPrice', label: 'Original Price (₹) *', placeholder: '0', keyword: 'numeric' },
    { key: 'finalPrice', label: 'Final Price (₹) *', placeholder: '0', keyboard: 'numeric' },
    { key: 'advancePaid', label: 'Advance Paid (₹)', placeholder: '0', keyboard: 'numeric' },
];

export default function BookMandalScreen({ navigation }) {
    const { user } = useAuth();
    const [step, setStep] = useState(0); // 0 = list, 1 = booking form
    const [allMandals, setAllMandals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedMandal, setSelectedMandal] = useState(null);
    const [expanded, setExpanded] = useState(null); // mandalId of expanded card
    const [booking, setBooking] = useState({
        year: String(new Date().getFullYear()),
        murtiSize: '', originalPrice: '', finalPrice: '', advancePaid: '',
    });
    const [submitting, setSubmitting] = useState(false);
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

    const setB = (key) => (val) => setBooking(b => ({ ...b, [key]: val }));

    const selectMandal = (mandal) => {
        setSelectedMandal(mandal);
        setStep(1);
    };

    const handleBooking = async () => {
        const { year, murtiSize, originalPrice, finalPrice } = booking;
        if (!year || !murtiSize || !originalPrice || !finalPrice || !selectedMandal) {
            toast.error('All required fields must be filled.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/bookings', {
                mandalId: selectedMandal._id,
                year: Number(year),
                murtiSize,
                originalPrice: Number(originalPrice),
                finalPrice: Number(finalPrice),
                advancePaid: Number(booking.advancePaid) || 0,
            });

            toast.success('Booking created successfully.', 'Booked');
            setTimeout(() => navigation.navigate('Dashboard'), 1200);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create booking.');
        } finally {
            setSubmitting(false);
        }
    };

    // Local in-memory filter
    const filtered = allMandals.filter(m => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
            m.ganpatiTitle?.toLowerCase().includes(q) ||
            m.mandalName?.toLowerCase().includes(q) ||
            m.area?.toLowerCase().includes(q) ||
            m.city?.toLowerCase().includes(q)
        );
    });

    if (step === 1) {
        const cfg = selectedMandal?.latestGrade ? gradeConfig[selectedMandal.latestGrade] : null;
        return (
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
                <ScreenHeader title="Booking Details" onBack={() => setStep(0)} />
                <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
                    <View style={styles.selectedCard}>
                        <Text style={styles.selectedLabel}>SELECTED MANDAL</Text>
                        <Text style={styles.selectedTitle}>{selectedMandal?.ganpatiTitle}</Text>
                        <Text style={styles.selectedSub}>{selectedMandal?.mandalName}</Text>
                        {[selectedMandal?.area, selectedMandal?.city].filter(Boolean).length > 0 && (
                            <Text style={styles.selectedLoc}>
                                {[selectedMandal?.area, selectedMandal?.city].filter(Boolean).join(', ')}
                            </Text>
                        )}
                        {cfg ? (
                            <View style={[styles.smallPill, { backgroundColor: cfg.bg }]}>
                                <Text style={[styles.smallPillText, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Previous Murtikars quick summary */}
                    {selectedMandal?.bookingSummary?.length > 0 && (
                        <View style={styles.historyCard}>
                            <Text style={styles.historyLabel}>PREVIOUS MURTIKARS</Text>
                            {selectedMandal.bookingSummary.map((b, i) => {
                                const gc = gradeConfig[b.grade] || gradeConfig.red;
                                return (
                                    <View key={i} style={styles.historyRow}>
                                        <View style={styles.historyLeft}>
                                            <Text style={styles.historyYear}>{b.year}</Text>
                                            <Text style={styles.historyVendor} numberOfLines={1}>{b.vendorName}</Text>
                                            {b.workshopName ? <Text style={styles.historyWorkshop} numberOfLines={1}>{b.workshopName}</Text> : null}
                                        </View>
                                        <View style={styles.historyRight}>
                                            <View style={[styles.miniPill, { backgroundColor: gc.bg }]}>
                                                <Text style={[styles.miniPillText, { color: gc.color }]}>{gc.label}</Text>
                                            </View>
                                            <Text style={[styles.historyPending, { color: gc.color }]}>
                                                ₹{b.remainingAmount.toLocaleString()} due
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    <InputField label="Year *" value={booking.year} onChangeText={setB('year')} placeholder="e.g. 2025" keyboardType="numeric" />
                    {BOOKING_FIELDS.map(({ key, label, placeholder, keyboard }) => (
                        <InputField key={key} label={label} value={booking[key]} onChangeText={setB(key)} placeholder={placeholder} keyboardType={keyboard || 'default'} />
                    ))}
                    <PrimaryButton title="Confirm Booking" onPress={handleBooking} loading={submitting} style={styles.btn} />
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Book Mandal" onBack={() => navigation.goBack()} />

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

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={Colors.accent} size="large" />
                    <Text style={styles.loadingText}>Loading mandals...</Text>
                </View>
            ) : (
                <Animated.FlatList
                    style={{ opacity: listFade }}
                    data={filtered}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchMandals(true); }}
                            colors={[Colors.accent]}
                            tintColor={Colors.accent}
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
                        <MandalListCard
                            mandal={item}
                            expanded={expanded === item._id}
                            onToggle={() => setExpanded(prev => prev === item._id ? null : item._id)}
                            onBook={() => selectMandal(item)}
                        />
                    )}
                />
            )}
        </View>
    );
}

function MandalListCard({ mandal, expanded, onToggle, onBook }) {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, speed: 40 }).start();
    const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
    const cfg = mandal.latestGrade ? gradeConfig[mandal.latestGrade] : null;

    return (
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
            {/* Card header — tap to expand/collapse */}
            <TouchableOpacity onPress={onToggle} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardInitial}>
                        <Text style={styles.cardInitialText}>{(mandal.ganpatiTitle || 'M').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{mandal.ganpatiTitle}</Text>
                        <Text style={styles.cardSub} numberOfLines={1}>{mandal.mandalName}</Text>
                        <Text style={styles.cardLoc} numberOfLines={1}>
                            {[mandal.area, mandal.city].filter(Boolean).join(', ') || 'Location not specified'}
                        </Text>
                    </View>
                    <View style={styles.cardRight}>
                        {cfg ? (
                            <View style={[styles.gradePill, { backgroundColor: cfg.bg }]}>
                                <Text style={[styles.gradeText, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                        ) : (
                            <View style={[styles.gradePill, { backgroundColor: '#F0F0F0' }]}>
                                <Text style={[styles.gradeText, { color: Colors.textMuted }]}>New</Text>
                            </View>
                        )}
                        <Text style={styles.totalPending}>
                            {mandal.totalPending > 0 ? `₹${mandal.totalPending.toLocaleString()} pending` : 'All clear'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Expanded: per-murtikar breakdown */}
            {expanded && mandal.bookingSummary?.length > 0 && (
                <View style={styles.breakdown}>
                    <Text style={styles.breakdownLabel}>ALL MURTIKARS</Text>
                    {mandal.bookingSummary.map((b, i) => {
                        const gc = getGradeConfig(b.remainingAmount);
                        const rawR = b.remainingAmount;
                        const dispR = Math.max(0, rawR);
                        const extra = rawR < 0 ? Math.abs(rawR) : 0;
                        return (
                            <View key={i} style={styles.breakdownRow}>
                                <View style={styles.breakdownLeft}>
                                    <Text style={styles.breakdownYear}>{b.year}</Text>
                                    <Text style={styles.breakdownVendor}>{b.vendorName}</Text>
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
                    })}
                </View>
            )}

            {expanded && (!mandal.bookingSummary || mandal.bookingSummary.length === 0) && (
                <View style={styles.breakdown}>
                    <Text style={styles.noHistory}>No bookings yet for this mandal.</Text>
                </View>
            )}

            {/* Book button */}
            {expanded && (
                <TouchableOpacity style={styles.bookBtn} onPress={onBook}>
                    <Text style={styles.bookBtnText}>Book This Mandal</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
    loadingText: { color: Colors.textMuted, marginTop: Spacing.md, fontSize: Font.sm },
    emptyText: { color: Colors.textMuted, fontSize: Font.sm, textAlign: 'center' },

    searchWrap: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm,
        backgroundColor: Colors.inputBg, borderRadius: Radius.sm,
        borderWidth: 1.5, borderColor: Colors.inputBorder,
        paddingHorizontal: Spacing.md,
    },
    searchInput: {
        flex: 1, height: 44, fontSize: Font.sm,
        color: Colors.textPrimary, paddingVertical: 0,
    },
    clearBtn: { paddingLeft: 8 },
    clearText: { fontSize: 20, color: Colors.textMuted, lineHeight: 24 },

    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 32, paddingTop: Spacing.sm },

    card: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder,
        overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
    cardInitial: {
        width: 46, height: 46, borderRadius: Radius.full,
        backgroundColor: Colors.accentMuted, alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md, flexShrink: 0,
    },
    cardInitialText: { fontSize: Font.lg, fontWeight: '900', color: Colors.accent },
    cardInfo: { flex: 1, marginRight: Spacing.sm },
    cardTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    cardSub: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 1 },
    cardLoc: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 1 },
    cardRight: { alignItems: 'flex-end', flexShrink: 0 },
    gradePill: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
    gradeText: { fontSize: Font.xs, fontWeight: '700' },
    totalPending: { fontSize: Font.xs, color: Colors.textMuted, textAlign: 'right' },

    breakdown: {
        borderTopWidth: 1, borderTopColor: Colors.separator,
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
        backgroundColor: '#FAFAF8',
    },
    breakdownLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.2, marginBottom: Spacing.sm },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.separator },
    breakdownLeft: { flex: 1 },
    breakdownYear: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    breakdownVendor: { fontSize: Font.xs, color: Colors.textSecondary, marginTop: 1 },
    breakdownWorkshop: { fontSize: Font.xs, color: Colors.textMuted },
    breakdownRight: { alignItems: 'flex-end' },
    breakdownAmt: { fontSize: Font.md, fontWeight: '700', marginTop: 2 },
    breakdownAmtLabel: { fontSize: Font.xs, color: Colors.textMuted },
    breakdownExtra: { fontSize: 10, fontWeight: '700', color: '#1B5E20', marginTop: 1 },
    miniPill: { borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
    miniPillText: { fontSize: 10, fontWeight: '700' },
    noHistory: { fontSize: Font.sm, color: Colors.textMuted, paddingBottom: Spacing.sm },

    bookBtn: {
        backgroundColor: Colors.accent, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
        borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center',
    },
    bookBtnText: { color: Colors.white, fontWeight: '700', fontSize: Font.sm, letterSpacing: 0.5 },

    // Step 2 — booking form styles
    formContainer: { padding: Spacing.xl },
    selectedCard: {
        backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
        marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.cardBorder,
        borderLeftWidth: 3, borderLeftColor: Colors.accent,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    selectedLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
    selectedTitle: { fontSize: Font.lg, fontWeight: '800', color: Colors.textPrimary },
    selectedSub: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 2 },
    selectedLoc: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 2 },
    smallPill: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 8, alignSelf: 'flex-start' },
    smallPillText: { fontSize: Font.xs, fontWeight: '700' },

    historyCard: {
        backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
        marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder,
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    },
    historyLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.2, marginBottom: Spacing.sm },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.separator },
    historyLeft: { flex: 1 },
    historyYear: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    historyVendor: { fontSize: Font.xs, color: Colors.textSecondary, marginTop: 1 },
    historyWorkshop: { fontSize: Font.xs, color: Colors.textMuted },
    historyRight: { alignItems: 'flex-end' },
    historyPending: { fontSize: Font.xs, fontWeight: '600', marginTop: 2 },

    btn: { marginTop: Spacing.md },
});
