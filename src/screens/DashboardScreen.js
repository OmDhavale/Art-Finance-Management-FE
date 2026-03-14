import React, { useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Animated, StatusBar, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Font, Radius, Spacing } from '../theme';

// ── Professional geometric icon component ─────────────────────────────────────
// Uses styled Views with initials/shapes — no emojis, no external deps
function TileIcon({ shape, bg, color, letter }) {
    return (
        <View style={[iconStyles.wrap, { backgroundColor: bg }]}>
            {shape === 'circle' ? (
                <View style={[iconStyles.circle, { borderColor: color }]} />
            ) : shape === 'book' ? (
                // Two stacked rectangles — represents a ledger/booking
                <View>
                    <View style={[iconStyles.bookLine, { backgroundColor: color }]} />
                    <View style={[iconStyles.bookLine, { backgroundColor: color, opacity: 0.6, marginTop: 3 }]} />
                    <View style={[iconStyles.bookLine, { backgroundColor: color, opacity: 0.35, marginTop: 3 }]} />
                </View>
            ) : shape === 'grid' ? (
                // 2×2 squares — represents add/register
                <View style={iconStyles.grid}>
                    <View style={[iconStyles.dot, { backgroundColor: color }]} />
                    <View style={[iconStyles.dot, { backgroundColor: color }]} />
                    <View style={[iconStyles.dot, { backgroundColor: color }]} />
                    <View style={[iconStyles.dot, { backgroundColor: color }]} />
                </View>
            ) : shape === 'person' ? (
                // Circle head + bar body
                <View style={iconStyles.person}>
                    <View style={[iconStyles.personHead, { backgroundColor: color }]} />
                    <View style={[iconStyles.personBody, { backgroundColor: color }]} />
                </View>
            ) : (
                <Text style={[iconStyles.letter, { color }]}>{letter}</Text>
            )}
        </View>
    );
}

const iconStyles = StyleSheet.create({
    wrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    circle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2.5 },
    bookLine: { height: 3, width: 22, borderRadius: 2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', width: 22, height: 22, gap: 3 },
    dot: { width: 9, height: 9, borderRadius: 2.5 },
    person: { alignItems: 'center' },
    personHead: { width: 11, height: 11, borderRadius: 6, marginBottom: 3 },
    personBody: { width: 18, height: 8, borderRadius: 4 },
    letter: { fontSize: 18, fontWeight: '800' },
});

// Primary actions → hero full-width cards
const PRIMARY_ACTIONS = [
    {
        id: 'book-mandal',
        title: 'Book Mandal',
        sub: 'Search mandals by grade, view\npending history & create booking',
        shape: 'circle',
        iconBg: '#FFF0DC',
        iconColor: Colors.accent,
        route: 'BookMandal',
    },
    {
        id: 'my-bookings',
        title: 'My Bookings',
        sub: 'Year-wise view of your bookings,\npayments due & entries',
        shape: 'book',
        iconBg: '#EAF4EC',
        iconColor: '#2E7D32',
        route: 'MyBookings',
    },
];

// Secondary actions → compact row tiles
const SECONDARY_ACTIONS = [
    {
        id: 'register-mandal',
        title: 'Register Mandal',
        sub: 'Add new mandal',
        shape: 'grid',
        iconBg: '#EDE7F6',
        iconColor: '#6A1B9A',
        route: 'RegisterMandal',
        ownerOnly: false,
    },
    {
        id: 'add-manager',
        title: 'Add Manager',
        sub: 'Create account',
        shape: 'person',
        iconBg: '#E3F2FD',
        iconColor: '#1565C0',
        route: 'AddManager',
        ownerOnly: true,
    },
];

export default function DashboardScreen({ navigation }) {
    const { user, logout } = useAuth();
    const isOwner = user?.role === 'owner';
    const isArtist = user?.role === 'sketch-artist';
    const visibleSecondary = SECONDARY_ACTIONS.filter(a => {
        if (isArtist) return false; // Artists don't see secondary actions
        return !a.ownerOnly || isOwner;
    });

    const headerFade = useRef(new Animated.Value(0)).current;
    const primaryAnims = useRef(PRIMARY_ACTIONS.map(() => new Animated.Value(0))).current;
    const secondaryAnims = useRef(SECONDARY_ACTIONS.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        [...PRIMARY_ACTIONS, ...SECONDARY_ACTIONS].forEach((_, i) => {
            const anim = i < PRIMARY_ACTIONS.length
                ? primaryAnims[i]
                : secondaryAnims[i - PRIMARY_ACTIONS.length];
            Animated.timing(anim, {
                toValue: 1, duration: 380, delay: 150 + i * 90, useNativeDriver: true,
            }).start();
        });
    }, []);

    const getRoleLabel = () => {
        if (isArtist) return 'Sketch Artist';
        return 'Murtikar';
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
            <ScrollView contentContainerStyle={styles.container}>

                {/* ── Header ── */}
                <Animated.View style={[styles.header, { opacity: headerFade }]}>
                    <View>
                        <Text style={styles.greeting}>Welcome back</Text>
                        <Text style={styles.userName}>{user?.name || getRoleLabel()}</Text>
                        {user?.workshopName ? (
                            <Text style={styles.workshop}>{user.workshopName}</Text>
                        ) : null}
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.divider} />

                {/* ── Primary Hero Tiles ── */}
                <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
                {PRIMARY_ACTIONS.map((action, i) => (
                    <Animated.View
                        key={action.id}
                        style={{
                            opacity: primaryAnims[i],
                            transform: [{
                                translateY: primaryAnims[i].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                            }],
                        }}
                    >
                        <HeroTile action={action} onPress={() => navigation.navigate(action.route)} />
                    </Animated.View>
                ))}

                {/* ── Secondary compact row ── */}
                {visibleSecondary.length > 0 && (
                    <>
                        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>MORE OPTIONS</Text>
                        <View style={styles.secondaryRow}>
                            {visibleSecondary.map((action, i) => (
                                <Animated.View key={action.id} style={[styles.secondaryWrap, { opacity: secondaryAnims[i] }]}>
                                    <SecondaryTile action={action} onPress={() => navigation.navigate(action.route)} />
                                </Animated.View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function HeroTile({ action, onPress }) {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
    const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

    return (
        <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
            <Animated.View style={[styles.heroTile, { transform: [{ scale }] }]}>
                <TileIcon shape={action.shape} bg={action.iconBg} color={action.iconColor} />
                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>{action.title}</Text>
                    <Text style={styles.heroSub}>{action.sub}</Text>
                </View>
                {/* Chevron arrow */}
                <Text style={styles.arrow}>›</Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

function SecondaryTile({ action, onPress }) {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
    const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

    return (
        <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
            <Animated.View style={[styles.secondaryTile, { transform: [{ scale }] }]}>
                <TileIcon shape={action.shape} bg={action.iconBg} color={action.iconColor} />
                <Text style={styles.secondaryTitle}>{action.title}</Text>
                <Text style={styles.secondarySub}>{action.sub}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    container: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 48 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
    greeting: { fontSize: Font.sm, color: Colors.textSecondary, letterSpacing: 0.4 },
    userName: { fontSize: Font.xxl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
    workshop: { fontSize: Font.sm, color: Colors.accent, marginTop: 3, fontWeight: '600' },

    logoutBtn: {
        paddingHorizontal: Spacing.md, paddingVertical: 7,
        borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.cardBorder,
        marginLeft: Spacing.md, marginTop: 4,
    },
    logoutText: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600' },

    divider: { height: 1, backgroundColor: Colors.separator, marginBottom: Spacing.xl },
    sectionLabel: {
        fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700',
        letterSpacing: 1.5, marginBottom: Spacing.md,
    },

    // Hero tiles — full width horizontal card
    heroTile: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        borderWidth: 1, borderColor: Colors.cardBorder,
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    heroContent: { flex: 1, marginLeft: Spacing.md },
    heroTitle: { fontSize: Font.lg, fontWeight: '800', color: Colors.textPrimary },
    heroSub: { fontSize: Font.xs, color: Colors.textSecondary, marginTop: 3, lineHeight: 17 },

    // Chevron arrow
    arrow: { fontSize: 26, color: Colors.textMuted, marginLeft: Spacing.sm },

    // Secondary tiles — compact horizontal row
    secondaryRow: { flexDirection: 'row', gap: Spacing.md },
    secondaryWrap: { flex: 1 },
    secondaryTile: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        borderWidth: 1, borderColor: Colors.cardBorder,
        padding: Spacing.md, alignItems: 'flex-start',
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    },
    secondaryTitle: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.sm },
    secondarySub: { fontSize: Font.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 15 },
});
