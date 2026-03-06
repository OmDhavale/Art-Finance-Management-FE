import React, { useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Animated, StatusBar, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Font, Radius, Spacing } from '../theme';

const ACTIONS = [
    {
        id: 'add-manager',
        title: 'Add Manager',
        sub: 'Create a manager account',
        icon: 'M',
        route: 'AddManager',
        ownerOnly: true,
    },
    {
        id: 'register-mandal',
        title: 'Register Mandal',
        sub: 'Add a new Ganesh Mandal',
        icon: 'R',
        route: 'RegisterMandal',
        ownerOnly: false,
    },
    {
        id: 'book-mandal',
        title: 'Book Mandal',
        sub: 'Search mandals & book murti',
        icon: 'B',
        route: 'BookMandal',
        ownerOnly: false,
    },
    {
        id: 'my-bookings',
        title: 'My Bookings',
        sub: 'View year-wise bookings',
        icon: 'Y',
        route: 'MyBookings',
        ownerOnly: false,
    },
];

export default function DashboardScreen({ navigation }) {
    const { user, logout } = useAuth();
    const isOwner = user?.role === 'owner';

    const fadeAnims = useRef(ACTIONS.map(() => new Animated.Value(0))).current;
    const slideAnims = useRef(ACTIONS.map(() => new Animated.Value(20))).current;
    const headerFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        ACTIONS.forEach((_, i) => {
            Animated.parallel([
                Animated.timing(fadeAnims[i], { toValue: 1, duration: 400, delay: 200 + i * 100, useNativeDriver: true }),
                Animated.timing(slideAnims[i], { toValue: 0, duration: 400, delay: 200 + i * 100, useNativeDriver: true }),
            ]).start();
        });
    }, []);

    const visibleActions = ACTIONS.filter(a => !a.ownerOnly || isOwner);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
            <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

                {/* Header */}
                <Animated.View style={[styles.header, { opacity: headerFade }]}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>Welcome back</Text>
                        <Text style={styles.userName}>{user?.name || 'Murtikar'}</Text>
                        {user?.workshopName ? (
                            <Text style={styles.workshop}>{user.workshopName}</Text>
                        ) : null}
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Accent separator */}
                <View style={styles.accentLine} />

                {/* Section label */}
                <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

                {/* Action grid */}
                <View style={styles.grid}>
                    {visibleActions.map((action, idx) => (
                        <Animated.View
                            key={action.id}
                            style={[
                                styles.tileWrap,
                                { opacity: fadeAnims[idx], transform: [{ translateY: slideAnims[idx] }] },
                            ]}
                        >
                            <ActionTile action={action} onPress={() => navigation.navigate(action.route)} />
                        </Animated.View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

function ActionTile({ action, onPress }) {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
    const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

    return (
        <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
            <Animated.View style={[styles.tile, { transform: [{ scale }] }]}>
                <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>{action.icon}</Text>
                </View>
                <Text style={styles.tileTitle}>{action.title}</Text>
                <Text style={styles.tileSub}>{action.sub}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flex: 1 },
    container: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 40 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
    headerLeft: { flex: 1 },
    greeting: { fontSize: Font.sm, color: Colors.textSecondary, letterSpacing: 0.4 },
    userName: { fontSize: Font.xxl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
    workshop: { fontSize: Font.sm, color: Colors.accent, marginTop: 3, fontWeight: '500' },

    logoutBtn: {
        paddingHorizontal: Spacing.md, paddingVertical: 7,
        borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.cardBorder,
        marginLeft: Spacing.md, marginTop: 4,
    },
    logoutText: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 0.5 },

    accentLine: { height: 1, backgroundColor: Colors.separator, marginBottom: Spacing.xl },
    sectionLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: Spacing.lg },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    tileWrap: { width: '47.5%' },
    tile: {
        backgroundColor: Colors.card,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        minHeight: 140,
        justifyContent: 'space-between',
    },
    iconCircle: {
        width: 44, height: 44, borderRadius: Radius.full,
        backgroundColor: Colors.accentMuted,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    iconText: { fontSize: Font.lg, fontWeight: '900', color: Colors.accent },
    tileTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    tileSub: { fontSize: Font.xs, color: Colors.textSecondary, marginTop: 3, lineHeight: 16 },
});
