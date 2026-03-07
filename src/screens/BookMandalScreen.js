import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ScrollView, KeyboardAvoidingView, Platform, Switch,
    Animated, StatusBar, ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import ScreenHeader from '../components/ScreenHeader';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing, Shadow, gradeConfig, getGradeConfig, overallGradeConfig, getOverallGradeConfig } from '../theme';
import { toast } from '../utils/toast';

// Only advance paid comes from BOOKING_FIELDS now; prices are handled separately
const ADVANCE_FIELD = { key: 'advancePaid', label: 'Advance Paid (₹)', placeholder: 'Enter advance amount (₹)', keyboard: 'numeric' };

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
        murtiSize: '', advancePaid: '',
    });
    // Price state — separated for cleaner toggle UX
    const [price, setPrice] = useState('');             // Murti Price (original)
    const [isNegotiated, setIsNegotiated] = useState(false);
    const [negotiatedPrice, setNegotiatedPrice] = useState(''); // Final Agreed Price
    const [submitting, setSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');  // 'all' | 'available' | 'booked'
    const [gradeFilter, setGradeFilter] = useState('all');    // 'all' | 'O' | 'A' | 'B' | 'C' | 'D'
    const [historyQuery, setHistoryQuery] = useState('');     // For filtering previous murtikars
    const listFade = useRef(new Animated.Value(0)).current;
    const currentYear = new Date().getFullYear();

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

    // Auto-attach " feet" to murtiSize on blur; strip on focus for clean editing
    const handleMurtiSizeBlur = () => {
        const raw = booking.murtiSize.trim().replace(/\s*feet$/i, '');
        if (raw) setBooking(b => ({ ...b, murtiSize: raw + ' feet' }));
    };
    const handleMurtiSizeFocus = () => {
        setBooking(b => ({ ...b, murtiSize: b.murtiSize.replace(/\s*feet$/i, '').trim() }));
    };

    const selectMandal = (mandal, yearOverride) => {
        setSelectedMandal(mandal);
        setBooking(b => ({ ...b, year: String(yearOverride || currentYear) }));
        setStep(1);
    };

    const handleBooking = async () => {
        const { year, murtiSize } = booking;
        if (!year || !murtiSize || !price || !selectedMandal) {
            toast.error('All required fields must be filled.');
            return;
        }

        const originalPrice = Number(price);
        let finalPrice = originalPrice;

        if (isNegotiated) {
            if (!negotiatedPrice) {
                toast.error('Please enter the final agreed price.');
                return;
            }
            finalPrice = Number(negotiatedPrice);
            if (finalPrice > originalPrice) {
                toast.error('Final price cannot exceed original price.');
                return;
            }
        }

        setSubmitting(true);
        try {
            await api.post('/bookings', {
                mandalId: selectedMandal._id,
                year: Number(year),
                murtiSize,
                originalPrice,
                finalPrice,
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

    // Filter with search + status + grade
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
        // Status filter — check if mandal has a booking for the current year
        const isBookedThisYear = m.bookingSummary?.some(b => b.year === currentYear);
        if (statusFilter === 'available' && isBookedThisYear) return false;
        if (statusFilter === 'booked' && !isBookedThisYear) return false;
        // Grade filter
        if (gradeFilter !== 'all' && m.overallGrade !== gradeFilter) return false;
        return true;
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
                        {/* Overall grade badge */}
                        {selectedMandal?.overallGrade ? (() => {
                            const ogCfg = getOverallGradeConfig(selectedMandal.overallGrade);
                            return ogCfg ? (
                                <View style={styles.selectedGradeRow}>
                                    <View style={[styles.overallBadgeLg, { backgroundColor: ogCfg.bg, borderColor: ogCfg.borderColor }]}>
                                        <Text style={[styles.overallBadgeLgText, { color: ogCfg.color }]}>{ogCfg.label}</Text>
                                    </View>
                                    <Text style={[styles.selectedGradeLabel, { color: ogCfg.color }]}>
                                        {ogCfg.fullLabel} Payer
                                    </Text>
                                </View>
                            ) : null;
                        })() : (
                            <View style={styles.selectedGradeRow}>
                                <View style={[styles.overallBadgeLg, { backgroundColor: '#F0F0F0', borderColor: '#DDD' }]}>
                                    <Text style={[styles.overallBadgeLgText, { color: Colors.textMuted }]}>–</Text>
                                </View>
                                <Text style={[styles.selectedGradeLabel, { color: Colors.textMuted }]}>No booking history</Text>
                            </View>
                        )}
                    </View>

                    {/* Previous Murtikars quick summary */}
                    {selectedMandal?.bookingSummary?.length > 0 && (
                        <View style={styles.historyCard}>
                            <View style={styles.historyHeaderRow}>
                                <Text style={styles.historyLabel}>PREVIOUS MURTIKARS</Text>
                                <TextInput
                                    style={styles.historySearch}
                                    placeholder="Search Year..."
                                    placeholderTextColor={Colors.textMuted}
                                    value={historyQuery}
                                    onChangeText={setHistoryQuery}
                                />
                            </View>

                            <ScrollView
                                style={styles.historyScroll}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                            >
                                {selectedMandal.bookingSummary
                                    .filter(b =>
                                        !historyQuery ||
                                        String(b.year).includes(historyQuery) ||
                                        b.vendorName?.toLowerCase().includes(historyQuery.toLowerCase())
                                    )
                                    .map((b, i) => {
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
                                    })
                                }
                                {selectedMandal.bookingSummary.filter(b =>
                                    !historyQuery ||
                                    String(b.year).includes(historyQuery) ||
                                    b.vendorName?.toLowerCase().includes(historyQuery.toLowerCase())
                                ).length === 0 && (
                                        <Text style={styles.historyEmpty}>No matching records found.</Text>
                                    )}
                            </ScrollView>
                        </View>
                    )}

                    {/* Year chip picker */}
                    {(() => {
                        const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
                        const bookingSummary = selectedMandal?.bookingSummary || [];
                        const bookedYearsMap = Array.isArray(bookingSummary)
                            ? bookingSummary.reduce((acc, b) => ({ ...acc, [b.year]: b }), {})
                            : {};

                        const isYearBooked = bookedYearsMap[booking.year];

                        return (
                            <View style={styles.yearSection}>
                                <View style={styles.yearHeaderRow}>
                                    <Text style={styles.yearLabel}>Booking Year *</Text>
                                    {isYearBooked && (
                                        <Text style={styles.bookedWarning}>
                                            Already booked
                                            {/* Already booked by {isYearBooked.vendorName} */}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.yearRow}>
                                    {years.map(yr => {
                                        const isSelected = booking.year === String(yr);
                                        const isBooked = !!bookedYearsMap[yr];
                                        return (
                                            <TouchableOpacity
                                                key={yr}
                                                style={[
                                                    styles.yearChip,
                                                    isSelected && styles.yearChipSelected,
                                                    isBooked && !isSelected && styles.yearChipBooked,
                                                    isSelected && isBooked && styles.yearChipSelectedBooked,
                                                ]}
                                                onPress={() => setBooking(b => ({ ...b, year: String(yr) }))}
                                            >
                                                <Text style={[
                                                    styles.yearChipText,
                                                    isSelected && styles.yearChipTextSelected,
                                                    isBooked && !isSelected && styles.yearChipTextBooked,
                                                ]}>{yr}</Text>
                                                {isBooked && (
                                                    <Text style={[
                                                        styles.yearChipNote,
                                                        isSelected && { color: Colors.white, opacity: 0.8 },
                                                    ]}>booked</Text>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })()}

                    {(() => {
                        const isYearBooked = (selectedMandal?.bookingSummary || []).some(b => b.year === Number(booking.year));
                        const editable = !isYearBooked;

                        return (
                            <View style={!editable && { opacity: 0.6 }}>
                                <InputField
                                    label="Murti Size * (in feet)"
                                    value={booking.murtiSize}
                                    onChangeText={setB('murtiSize')}
                                    onFocus={handleMurtiSizeFocus}
                                    onBlur={handleMurtiSizeBlur}
                                    placeholder="e.g. 4 (feet)"
                                    keyboardType="default"
                                    editable={editable}
                                />

                                {/* ── Price section ─────────────────────────────────── */}
                                <InputField
                                    label="Murti Price (₹) *"
                                    value={price}
                                    onChangeText={setPrice}
                                    placeholder="Enter Murti Price (₹)"
                                    keyboardType="numeric"
                                    editable={editable}
                                />

                                {/* Negotiated Price toggle */}
                                <View style={styles.toggleRow}>
                                    <View style={styles.toggleLeft}>
                                        <Text style={styles.toggleLabel}>Negotiated Price</Text>
                                        <Text style={styles.toggleSub}>
                                            {isNegotiated ? 'Final price differs from quoted price' : 'Same as quoted price'}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={isNegotiated}
                                        onValueChange={(val) => {
                                            if (!editable) return;
                                            setIsNegotiated(val);
                                            if (!val) setNegotiatedPrice('');
                                        }}
                                        disabled={!editable}
                                        trackColor={{ false: Colors.separator, true: Colors.accentMuted }}
                                        thumbColor={isNegotiated ? Colors.accent : Colors.textMuted}
                                    />
                                </View>

                                {/* Final Agreed Price — only when negotiated */}
                                {isNegotiated && (
                                    <InputField
                                        label="Final Agreed Price (₹) *"
                                        value={negotiatedPrice}
                                        onChangeText={setNegotiatedPrice}
                                        placeholder="Enter Final Price (₹)"
                                        keyboardType="numeric"
                                        editable={editable}
                                    />
                                )}

                                <InputField
                                    key={ADVANCE_FIELD.key}
                                    label={ADVANCE_FIELD.label}
                                    value={booking[ADVANCE_FIELD.key]}
                                    onChangeText={setB(ADVANCE_FIELD.key)}
                                    placeholder={ADVANCE_FIELD.placeholder}
                                    keyboardType={ADVANCE_FIELD.keyboard}
                                    editable={editable}
                                />
                                <PrimaryButton
                                    title={editable ? "Confirm Booking" : "Year Already Booked"}
                                    onPress={handleBooking}
                                    loading={submitting}
                                    style={styles.btn}
                                    disabled={!editable}
                                />
                            </View>
                        );
                    })()}
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

            {/* Status + Grade filter chips */}
            <View style={styles.filterSection}>
                {/* Row 1: Booking status */}
                <View style={styles.filterRow}>
                    {[['all', 'All'], ['available', 'Available'], ['booked', 'Booked']].map(([val, label]) => (
                        <TouchableOpacity
                            key={val}
                            style={[styles.filterChip, statusFilter === val && styles.filterChipActive]}
                            onPress={() => setStatusFilter(val)}
                        >
                            <Text style={[styles.filterChipText, statusFilter === val && styles.filterChipTextActive]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {/* Row 2: Grade filter */}
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
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>
                                {allMandals.length === 0 ? 'No mandals registered yet.' : 'No mandals match your search.'}
                            </Text>
                            <TouchableOpacity
                                style={styles.registerLink}
                                onPress={() => navigation.navigate('RegisterMandal')}
                            >
                                <Feather name="plus-circle" size={16} color={Colors.primary} />
                                <Text style={styles.registerLinkText}>Register New Mandal</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <MandalListCard
                            mandal={item}
                            currentYear={currentYear}
                            expanded={expanded === item._id}
                            onToggle={() => setExpanded(prev => prev === item._id ? null : item._id)}
                            onBook={(yr) => selectMandal(item, yr)}
                        />
                    )}
                />
            )}
        </View>
    );
}

function MandalListCard({ mandal, currentYear, expanded, onToggle, onBook }) {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, speed: 40 }).start();
    const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
    const ogCfg = mandal.overallGrade ? getOverallGradeConfig(mandal.overallGrade) : null;

    // Check for booked years from current year onwards
    const bookedFutureYears = (mandal.bookingSummary || [])
        .map(b => b.year)
        .filter(y => y >= currentYear)
        .sort((a, b) => a - b);

    // Mandal is disabled in current list view only if the ACTUAL current year is booked
    const isDisabled = bookedFutureYears.includes(currentYear);

    const bannerText = bookedFutureYears.length > 1
        ? bookedFutureYears.slice(0, -1).join(', ') + ' & ' + bookedFutureYears.slice(-1)
        : currentYear;

    return (
        <Animated.View style={[styles.card, isDisabled && styles.cardDisabled, { transform: [{ scale }] }]}>
            {/* Booked banner — show all booked years from current onwards */}
            {isDisabled && (
                <View style={styles.bookedBanner}>
                    <Text style={styles.bookedBannerText}>
                        ✓ Already Booked for {bannerText}
                    </Text>
                </View>
            )}

            {/* Card header — tap to expand/collapse */}
            <TouchableOpacity onPress={onToggle} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
                <View style={[styles.cardHeader, isDisabled && styles.cardHeaderDisabled]}>
                    <View style={[styles.cardInitial, isDisabled && styles.cardInitialDisabled]}>
                        <Text style={[styles.cardInitialText, isDisabled && styles.cardInitialTextDisabled]}>
                            {(mandal.ganpatiTitle || 'M').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={[styles.cardTitle, isDisabled && styles.cardTitleDisabled]} numberOfLines={1}>
                            {mandal.ganpatiTitle}
                        </Text>
                        <Text style={styles.cardSub} numberOfLines={1}>{mandal.mandalName}</Text>
                        <Text style={styles.cardLoc} numberOfLines={1}>
                            {[mandal.area, mandal.city].filter(Boolean).join(', ') || 'Location not specified'}
                        </Text>
                    </View>
                    <View style={styles.cardRight}>
                        {/* Overall O/A/B/C/D grade badge */}
                        {ogCfg ? (
                            <View style={[styles.overallBadge, { backgroundColor: ogCfg.bg, borderColor: ogCfg.borderColor }, isDisabled && styles.badgeDisabled]}>
                                <Text style={[styles.overallBadgeText, { color: ogCfg.color }, isDisabled && styles.badgeTextDisabled]}>{ogCfg.label}</Text>
                            </View>
                        ) : (
                            <View style={[styles.overallBadge, { backgroundColor: '#F0F0F0', borderColor: '#DDD' }]}>
                                <Text style={[styles.overallBadgeText, { color: Colors.textMuted }]}>–</Text>
                            </View>
                        )}
                        {ogCfg && !isDisabled && (
                            <Text style={[styles.overallBadgeLabel, { color: ogCfg.color }]}>{ogCfg.fullLabel}</Text>
                        )}
                        <Text style={[styles.totalPending, isDisabled && { color: Colors.textMuted }]}>
                            {mandal.totalPending > 0 ? `₹${mandal.totalPending.toLocaleString()} due` : 'All clear'}
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

            {/* Book button — only for available mandals */}
            {expanded && !isDisabled && (
                <TouchableOpacity style={styles.bookBtn} onPress={onBook}>
                    <Text style={styles.bookBtnText}>Book This Mandal</Text>
                </TouchableOpacity>
            )}

            {/* Next year booking option for already-booked mandals */}
            {expanded && isDisabled && (() => {
                const bookedYears = (mandal.bookingSummary || []).map(b => b.year);
                let nextAvail = currentYear;
                while (bookedYears.includes(nextAvail)) nextAvail++;

                return (
                    <TouchableOpacity
                        style={[styles.bookBtn, styles.bookBtnNext]}
                        onPress={() => onBook(nextAvail)}
                    >
                        <Text style={styles.bookBtnText}>Book for Year {nextAvail} →</Text>
                    </TouchableOpacity>
                );
            })()}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
    loadingText: { color: Colors.textMuted, marginTop: Spacing.md, fontSize: Font.sm },

    // Filter chips
    filterSection: { paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.xs },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    filterChip: {
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
        borderWidth: 1.5, borderColor: Colors.inputBorder,
        backgroundColor: Colors.surface,
    },
    filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterChipText: { fontSize: Font.xs, fontWeight: '600', color: Colors.textSecondary },
    filterChipTextActive: { color: Colors.white },

    // Disabled card (already booked this year)
    cardDisabled: { opacity: 0.72 },
    bookedBanner: {
        backgroundColor: '#D1FAE5', paddingHorizontal: Spacing.lg, paddingVertical: 6,
        borderBottomWidth: 1, borderBottomColor: '#6EE7B7',
    },
    bookedBannerText: { fontSize: Font.xs, fontWeight: '700', color: '#065F46' },
    cardHeaderDisabled: { backgroundColor: '#FAFAFA' },
    cardInitialDisabled: { backgroundColor: '#E2E8F0' },
    cardInitialTextDisabled: { color: '#94A3B8' },
    cardTitleDisabled: { color: Colors.textMuted },
    badgeDisabled: { opacity: 0.5 },
    badgeTextDisabled: {},
    emptyText: { color: Colors.textMuted, fontSize: Font.sm, textAlign: 'center' },

    searchWrap: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.xs,
        backgroundColor: Colors.inputBg, borderRadius: Radius.md,
        borderWidth: 1.5, borderColor: Colors.inputBorder,
        paddingHorizontal: Spacing.md, ...Shadow.sm,
    },
    searchInput: {
        flex: 1, height: 48, fontSize: Font.sm,
        color: Colors.textPrimary, paddingVertical: 0,
    },
    clearBtn: { paddingLeft: 8 },
    clearText: { fontSize: 20, color: Colors.textMuted, lineHeight: 24 },

    // Grade legend strip
    legendRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
        marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
        backgroundColor: Colors.card, borderRadius: Radius.md,
        borderWidth: 1, borderColor: Colors.cardBorder,
        paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
    },
    legendItem: { alignItems: 'center', gap: 3 },
    legendBadge: {
        width: 24, height: 24, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5,
    },
    legendBadgeText: { fontSize: 11, fontWeight: '900' },
    legendLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '500' },

    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 32, paddingTop: Spacing.xs },

    card: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder,
        overflow: 'hidden', ...Shadow.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
    cardInitial: {
        width: 46, height: 46, borderRadius: Radius.full,
        backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md, flexShrink: 0,
    },
    cardInitialText: { fontSize: Font.lg, fontWeight: '900', color: Colors.primary },
    cardInfo: { flex: 1, marginRight: Spacing.sm },
    cardTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    cardSub: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 1 },
    cardLoc: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 1 },
    cardRight: { alignItems: 'flex-end', flexShrink: 0 },

    // Overall O/A/B/C/D badge
    overallBadge: {
        width: 34, height: 34, borderRadius: 17,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, marginBottom: 3,
    },
    overallBadgeText: { fontSize: Font.md, fontWeight: '900' },
    overallBadgeLabel: { fontSize: 9, fontWeight: '700', marginBottom: 2 },
    totalPending: { fontSize: Font.xs, color: Colors.textMuted, textAlign: 'right' },

    // Expanded breakdown
    breakdown: {
        borderTopWidth: 1, borderTopColor: Colors.separator,
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
        backgroundColor: Colors.bg,
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
    breakdownExtra: { fontSize: 10, fontWeight: '700', color: '#065F46', marginTop: 1 },
    miniPill: { borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
    miniPillText: { fontSize: 10, fontWeight: '700' },
    noHistory: { fontSize: Font.sm, color: Colors.textMuted, paddingBottom: Spacing.sm },

    bookBtn: {
        backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
        borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center',
        ...Shadow.sm,
    },
    bookBtnText: { color: Colors.white, fontWeight: '700', fontSize: Font.sm, letterSpacing: 0.5 },

    registerLink: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: Spacing.lg, paddingVertical: 8, paddingHorizontal: 16,
        backgroundColor: Colors.primaryMuted, borderRadius: Radius.full,
    },
    registerLinkText: { fontSize: Font.sm, fontWeight: '700', color: Colors.primary },

    // Step 2 — New Booking form (matches "New Booking" mockup)
    formContainer: { padding: Spacing.xl },

    // Section grouping card (Mandal Details / Murti & Pricing)
    selectedCard: {
        backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
        marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm,
    },
    selectedLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
    selectedTitle: { fontSize: Font.lg, fontWeight: '800', color: Colors.textPrimary },
    selectedSub: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 2 },
    selectedLoc: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 2 },

    // Overall grade inside booking form
    selectedGradeRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.sm },
    overallBadgeLg: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2,
    },
    overallBadgeLgText: { fontSize: Font.lg, fontWeight: '900' },
    selectedGradeLabel: { fontSize: Font.sm, fontWeight: '700' },

    historyCard: {
        backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
        marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm,
    },
    historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    historyLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.2 },
    historySearch: {
        fontSize: Font.xs, color: Colors.textPrimary,
        backgroundColor: Colors.inputBg, borderRadius: Radius.sm,
        paddingHorizontal: 8, paddingVertical: 4,
        borderWidth: 1.5, borderColor: Colors.inputBorder,
        width: 120, height: 32,
    },
    historyScroll: { maxHeight: 240 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.separator },
    historyLeft: { flex: 1 },
    historyYear: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    historyVendor: { fontSize: Font.xs, color: Colors.textSecondary, marginTop: 1 },
    historyWorkshop: { fontSize: Font.xs, color: Colors.textMuted },
    historyRight: { alignItems: 'flex-end' },
    historyPending: { fontSize: Font.xs, fontWeight: '600', marginTop: 2 },
    historyEmpty: { fontSize: Font.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md, fontStyle: 'italic' },

    btn: { marginTop: Spacing.md },

    // Negotiated Price toggle row
    toggleRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.card, borderRadius: Radius.md,
        borderWidth: 1.5, borderColor: Colors.cardBorder,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
        marginBottom: Spacing.md,
    },
    toggleLeft: { flex: 1, marginRight: Spacing.md },
    toggleLabel: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    toggleSub: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 2 },

    // Year Selection
    yearSection: { marginBottom: Spacing.xl },
    yearHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    yearLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.2 },
    bookedWarning: {
        fontSize: 10, fontWeight: '700', color: Colors.danger,
        backgroundColor: Colors.dangerBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    yearChip: {
        flex: 1, minWidth: '10%',
        paddingVertical: 1, borderRadius: Radius.md,
        backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.inputBorder,
        alignItems: 'center', justifyContent: 'center',
    },
    yearChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    yearChipSelectedBooked: { backgroundColor: Colors.danger, borderColor: Colors.danger },
    yearChipBooked: { backgroundColor: Colors.bg, borderColor: Colors.separator, opacity: 0.6 },
    yearChipText: { fontSize: Font.md, fontWeight: '700', color: Colors.textSecondary },
    yearChipTextSelected: { color: Colors.white },
    yearChipTextBooked: { color: Colors.textMuted },
    yearChipNote: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', marginTop: 2, color: Colors.textMuted },

    bookBtnNext: { backgroundColor: Colors.textSecondary, marginTop: -Spacing.xs },
});
