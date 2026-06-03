import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, Animated, StatusBar, ScrollView, Platform, RefreshControl,
    ActivityIndicator, Image, Linking, Modal, Pressable, Dimensions, DevSettings,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';
import api from '../api/api';
import { toast } from '../utils/toast';
import { formatDistanceToNow } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, iconName, tinted, style, footer }) {
    return (
        <View style={[statStyles.card, tinted && statStyles.tinted, style]}>
            <View style={statStyles.headerRow}>
                <Feather name={iconName} size={14} color={tinted ? Colors.primary : Colors.textMuted} />
                <Text style={statStyles.label}>{label}</Text>
            </View>
            <Text style={statStyles.value} numberOfLines={1}>{value}</Text>
            {footer ? <Text style={statStyles.footer}>{footer}</Text> : null}
        </View>
    );
}

const statStyles = StyleSheet.create({
    card: {
        flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg,
        padding: Spacing.md, ...Shadow.sm,
    },
    tinted: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    label: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    value: { fontSize: Font.xl, fontWeight: '800', color: Colors.textPrimary },
    footer: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
});

// ── Activity Item ─────────────────────────────────────────────────────────────
function ActivityItem({ activity }) {
    const isPayment = activity.type === 'payment';
    const timeAgo = formatDistanceToNow(new Date(activity.date), { addSuffix: true }).replace('about ', '');

    return (
        <View style={activityStyles.card}>
            <View style={activityStyles.left}>
                <View style={[activityStyles.iconCircle, { backgroundColor: isPayment ? '#ECFDF5' : '#EFF6FF' }]}>
                    {isPayment ? (
                        <Text style={{ fontSize: 22, color: '#059669', fontWeight: '800' }}>₹</Text>
                    ) : (
                        <Feather name="plus" size={20} color="#2563EB" />
                    )}
                </View>
                <View style={activityStyles.info}>
                    <Text style={activityStyles.title} numberOfLines={1}>{activity.title}</Text>
                    <Text style={activityStyles.sub}>{activity.subtitle}</Text>
                    <View style={activityStyles.timeRow}>
                        <Feather name="clock" size={10} color={Colors.textMuted} />
                        <Text style={activityStyles.timeText}>{timeAgo}</Text>
                    </View>
                </View>
            </View>
            <View style={activityStyles.right}>
                <Text style={[activityStyles.amount, isPayment && activityStyles.amountPlus]}>
                    {isPayment ? '+' : ''} ₹{activity.amount?.toLocaleString()}
                </Text>
                <View style={[activityStyles.tag, { backgroundColor: isPayment ? Colors.success + '10' : '#0284C710' }]}>
                    <Text style={[activityStyles.tagText, { color: isPayment ? Colors.success : '#0284C7' }]}>
                        {activity.type}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const activityStyles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        padding: Spacing.md, marginBottom: Spacing.md,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        ...Shadow.sm,
    },
    left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconCircle: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
    },
    info: { flex: 1 },
    title: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    sub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    timeText: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
    right: { alignItems: 'flex-end', gap: 6 },
    amount: { fontSize: Font.md, fontWeight: '800', color: Colors.textPrimary },
    amountPlus: { color: Colors.textPrimary }, // User image shows dark text for payment amount in summary
    tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    tagText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
});

export default function DashboardScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Drawer state and animations
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [themeExpanded, setThemeExpanded] = useState(false);
    const { width } = Dimensions.get('window');
    const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const openDrawer = () => {
        setDrawerVisible(true);
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeDrawer = (callback) => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -width * 0.8,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setDrawerVisible(false);
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    const currentTheme = global.__SELECTED_THEME__ || 'light_orange';

    const handleThemeChange = async (newTheme) => {
        if (newTheme === currentTheme) return;
        toast.info('Applying appearance theme...');
        await AsyncStorage.setItem('app_theme', newTheme);
        closeDrawer(() => {
            setTimeout(() => {
                DevSettings.reload();
            }, 100);
        });
    };

    const headerFade = useRef(new Animated.Value(0)).current;
    const contentFade = useRef(new Animated.Value(0)).current;

    const fetchStats = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const res = await api.get('/bookings/stats');
            setStats(res.data.data);
            if (!isRefresh) {
                Animated.stagger(100, [
                    Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(contentFade, { toValue: 1, duration: 500, useNativeDriver: true }),
                ]).start();
            }
        } catch (error) {
            toast.error('Failed to load dashboard stats.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchStats(true);
    }, []);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar
                barStyle={global.__SELECTED_THEME__ === 'dark_charcoal' ? 'light-content' : 'dark-content'}
                backgroundColor={Colors.surface}
            />

            {/* Custom Settings Drawer Modal */}
            <Modal
                transparent={true}
                visible={drawerVisible}
                onRequestClose={() => closeDrawer()}
                animationType="none"
            >
                <View style={drawerStyles.overlay}>
                    {/* Backdrop */}
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => closeDrawer()}>
                        <Animated.View style={[drawerStyles.backdrop, { opacity: fadeAnim }]} />
                    </Pressable>

                    {/* Drawer Content */}
                    <Animated.View
                        style={[
                            drawerStyles.drawer,
                            {
                                width: width * 0.8,
                                transform: [{ translateX: slideAnim }]
                            }
                        ]}
                    >
                        {/* Drawer Header */}
                        <View style={drawerStyles.header}>
                            <View style={drawerStyles.logoChip}>
                                <Image
                                    source={require('../../assets/ganesha_logo.png')}
                                    style={drawerStyles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <View style={drawerStyles.headerText}>
                                <Text style={drawerStyles.workshopName} numberOfLines={1}>
                                    {user?.workshopName || 'My Workshop'}
                                </Text>
                                <Text style={drawerStyles.userName} numberOfLines={1}>
                                    Murtikar: {user?.name || 'Artist'}
                                </Text>
                                <View style={drawerStyles.roleBadge}>
                                    <Text style={drawerStyles.roleText}>{user?.role?.toUpperCase() || 'OWNER'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={drawerStyles.divider} />

                        {/* Drawer Items */}
                        <ScrollView contentContainerStyle={drawerStyles.menuList} showsVerticalScrollIndicator={false}>
                            {/* 1. Account Center */}
                            <DrawerItem
                                icon="user"
                                title="Account Center"
                                subtitle="Workshop profile & team management"
                                onPress={() => {
                                    closeDrawer(() => {
                                        navigation.navigate('WorkshopDetails');
                                    });
                                }}
                            />

                            {/* 2. App Appearance (Theme Switcher) */}
                            <TouchableOpacity
                                style={drawerStyles.menuItem}
                                onPress={() => setThemeExpanded(!themeExpanded)}
                                activeOpacity={0.7}
                            >
                                <View style={[drawerStyles.iconWrap, { backgroundColor: Colors.primaryMuted }]}>
                                    <Feather name="aperture" size={18} color={Colors.primary} />
                                </View>
                                <View style={drawerStyles.textWrap}>
                                    <Text style={drawerStyles.itemTitle}>App Appearance</Text>
                                    <Text style={drawerStyles.itemSubtitle}>
                                        {currentTheme === 'light_orange' ? 'Warm Orange' : currentTheme === 'light_teal' ? 'Creative Teal' : 'Charcoal Dark'}
                                    </Text>
                                </View>
                                <Feather name={themeExpanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.textMuted} />
                            </TouchableOpacity>

                            {themeExpanded && (
                                <View style={drawerStyles.themeSubmenu}>
                                    <ThemeOption
                                        label="Warm Orange (Default)"
                                        color="#F97316"
                                        selected={currentTheme === 'light_orange'}
                                        onPress={() => handleThemeChange('light_orange')}
                                    />
                                    <ThemeOption
                                        label="Creative Teal"
                                        color="#0D9488"
                                        selected={currentTheme === 'light_teal'}
                                        onPress={() => handleThemeChange('light_teal')}
                                    />
                                    <ThemeOption
                                        label="Charcoal Dark"
                                        color="#1E293B"
                                        selected={currentTheme === 'dark_charcoal'}
                                        onPress={() => handleThemeChange('dark_charcoal')}
                                        darkBorder
                                    />
                                </View>
                            )}

                            {/* 3. App User Guide */}
                            <DrawerItem
                                icon="book-open"
                                title="App User Guide"
                                subtitle="How to use the application"
                                onPress={() => {
                                    closeDrawer(() => {
                                        navigation.navigate('Onboarding');
                                    });
                                }}
                            />

                            {/* 4. Contact Developer Support */}
                            <DrawerItem
                                icon="whatsapp"
                                title="Developer Support"
                                subtitle="WhatsApp us for any issues/bugs"
                                iconType="fa"
                                iconColor="#16A34A"
                                onPress={() => {
                                    Linking.openURL('https://wa.me/9892783192');
                                }}
                            />

                            <View style={drawerStyles.menuDivider} />

                            {/* 5. Sign Out */}
                            <DrawerItem
                                icon="log-out"
                                title="Sign Out"
                                subtitle="Exit current session"
                                iconColor={Colors.danger}
                                hideChevron
                                onPress={() => {
                                    closeDrawer(() => {
                                        logout();
                                    });
                                }}
                            />
                        </ScrollView>

                        {/* Footer */}
                        <View style={drawerStyles.footer}>
                            <Text style={drawerStyles.versionText}>Version 1.0.4</Text>
                            <Text style={drawerStyles.proudlyIndia}>Proudly Made in India 🇮🇳</Text>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* Top Header */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={openDrawer}
                    style={styles.hamburgerBtn}
                    activeOpacity={0.7}
                >
                    <Feather name="menu" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.logoChip}>
                    <Image
                        source={require('../../assets/ganesha_logo.png')}
                        style={styles.logoImageSmall}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.workshopName} numberOfLines={1}>{user?.workshopName || 'My Workshop'}</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
                }
            >
                {/* Greeting */}
                <Animated.View style={[styles.greeting, { opacity: headerFade }]}>
                    <Text style={styles.greetText}>Namaste, {user?.name?.split(' ')[0] || 'Murtikar'}!</Text>
                    <Text style={styles.greetSub}>Your workshop summary for this season</Text>
                </Animated.View>

                {loading && !refreshing ? (
                    <View style={styles.loaderWrap}>
                        <ActivityIndicator color={Colors.primary} size="large" />
                    </View>
                ) : (
                    <Animated.View style={{ opacity: contentFade }}>

                        {/* Financial Status */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>FINANCIAL STATUS</Text>
                        </View>
                        <View style={styles.statRow}>
                            <StatCard
                                label="Active Mandals"
                                value={stats?.activeMandals ?? '—'}
                                iconName="users"
                                footer="Current year"
                            />
                            <View style={styles.gap} />
                            <StatCard
                                label="Pending"
                                value={stats?.totalPending ? `₹${stats.totalPending.toLocaleString()}` : (stats?.totalPending === 0 ? '₹0' : '—')}
                                iconName="clock"
                                tinted
                                footer={stats?.dueMandals > 0 ? `${stats.dueMandals} due mandals` : 'No dues'}
                            />
                        </View>



                        {/* Quick Actions */}
                        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl, marginBottom: Spacing.md }]}>QUICK ACTIONS</Text>

                        {/* Main Row — Prioritized actions */}
                        <View style={styles.quickGrid}>
                            <TouchableOpacity
                                style={styles.mainTilePrimary}
                                onPress={() => navigation.navigate('BookMandal')}
                                activeOpacity={0.85}
                            >
                                <View style={styles.iconCircleWhite}>
                                    <Feather name="plus" size={24} color={Colors.primary} />
                                </View>
                                <Text style={styles.mainTileLabelWhite}>Book New{'\n'}Mandal</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.mainTileSecondary}
                                onPress={() => navigation.navigate('MyBookings')}
                                activeOpacity={0.85}
                            >
                                <View style={styles.iconCircleBlue}>
                                    <Feather name="book-open" size={24} color="#0284C7" />
                                </View>
                                <Text style={styles.mainTileLabelBlue}>My All{'\n'}Bookings</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.secondaryActionRow}
                            onPress={() => navigation.navigate('RegisterMandal')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.secondaryIconWrap}>
                                <Feather name="edit-3" size={18} color={Colors.primary} />
                            </View>
                            <View style={styles.secondaryTextWrap}>
                                <Text style={styles.secondaryActionTitle}>Register New Mandal</Text>
                                <Text style={styles.secondaryActionSub}>Add a new mandal to the system</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color={Colors.textMuted} />
                        </TouchableOpacity>
                        {/* Recent Activity */}
                        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
                            <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
                            <View style={styles.timeFilter}>
                                <Text style={styles.timeFilterText}>Last 10 entries</Text>
                            </View>
                        </View>

                        {stats?.recentActivity?.length > 0 ? (
                            stats.recentActivity.map(act => (
                                <ActivityItem key={act._id + act.type} activity={act} />
                            ))
                        ) : (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>No recent activity mixed with current year data.</Text>
                            </View>
                        )}

                        {/* Account & Support Section
                        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl + 10, marginBottom: Spacing.md }]}>ACCOUNT & SUPPORT</Text>
                        
                        <View style={styles.supportContainer}>
                            <SupportRow 
                                icon="help-circle" 
                                title="App User Guide" 
                                sub="How to use the application"
                                onPress={() => navigation.navigate('Onboarding')}
                            />
                            <SupportRow 
                                icon="whatsapp" 
                                title="Contact Developer Support" 
                                sub="WhatsApp us for any issues/bugs"
                                iconType="fa"
                                color="#16A34A"
                                onPress={() => Linking.openURL('https://wa.me/9892783192')}
                            />
                            <SupportRow 
                                icon="log-out" 
                                title="Sign Out" 
                                sub="Log out of your workshop account"
                                color={Colors.danger}
                                onPress={logout}
                                hideChevron
                            />
                        </View> */}

                        <Text style={styles.appVersion}>Version 1.0.4 • Proudly Made in India 🇮🇳</Text>
                    </Animated.View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function SupportRow({ icon, title, sub, onPress, iconType = 'feather', color = Colors.primary, hideChevron = false }) {
    return (
        <TouchableOpacity style={styles.supportRow} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.supportIconWrap, { backgroundColor: color + '10' }]}>
                {iconType === 'fa' ? (
                    <FontAwesome name={icon} size={18} color={color} />
                ) : (
                    <Feather name={icon} size={18} color={color} />
                )}
            </View>
            <View style={styles.supportTextWrap}>
                <Text style={styles.supportTitle}>{title}</Text>
                <Text style={styles.supportSub}>{sub}</Text>
            </View>
            {!hideChevron && <Feather name="chevron-right" size={16} color={Colors.textMuted} />}
        </TouchableOpacity>
    );
}

function DrawerItem({ icon, title, subtitle, onPress, iconType = 'feather', iconColor = Colors.primary, hideChevron = false }) {
    return (
        <TouchableOpacity style={drawerStyles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[drawerStyles.iconWrap, { backgroundColor: iconColor + '12' }]}>
                {iconType === 'fa' ? (
                    <FontAwesome name={icon} size={18} color={iconColor} />
                ) : (
                    <Feather name={icon} size={18} color={iconColor} />
                )}
            </View>
            <View style={drawerStyles.textWrap}>
                <Text style={drawerStyles.itemTitle}>{title}</Text>
                <Text style={drawerStyles.itemSubtitle}>{subtitle}</Text>
            </View>
            {!hideChevron && <Feather name="chevron-right" size={16} color={Colors.textMuted} />}
        </TouchableOpacity>
    );
}

function ThemeOption({ label, color, selected, onPress, darkBorder = false }) {
    return (
        <TouchableOpacity style={drawerStyles.themeOption} onPress={onPress} activeOpacity={0.7}>
            <View style={[drawerStyles.colorDot, { backgroundColor: color, borderWidth: darkBorder ? 1 : 0, borderColor: '#475569' }]} />
            <Text style={[drawerStyles.themeLabel, selected && drawerStyles.themeLabelSelected]}>
                {label}
            </Text>
            {selected && <Feather name="check" size={14} color={Colors.primary} />}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    container: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? Spacing.lg : Spacing.xxl,
        paddingBottom: 40
    },
    loaderWrap: { height: 300, justifyContent: 'center', alignItems: 'center' },

    topBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 12,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 12,
        borderBottomWidth: 1, borderBottomColor: Colors.separator, ...Shadow.sm,
    },
    hamburgerBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    logoChip: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: Colors.white,
        alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    logoImageSmall: { width: 28, height: 28 },
    workshopName: { flex: 1, fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    contactBtn: {
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DCFCE7'
    },
    contactText: { fontSize: 10, fontWeight: '800', color: '#16A34A' },
    helpBtn: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
    },
    signOutBtn: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
    },

    greeting: { paddingTop: Spacing.xl, marginBottom: Spacing.lg },
    greetText: { fontSize: Font.xxl, fontWeight: '800', color: Colors.textPrimary },
    greetSub: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 4 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    sectionLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },

    timeFilter: { backgroundColor: Colors.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: Colors.separator },
    timeFilterText: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary },

    statRow: { flexDirection: 'row', marginBottom: Spacing.md },
    gap: { width: Spacing.md },

    quickGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
    mainTilePrimary: {
        flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.lg,
        padding: Spacing.lg, height: 140, justifyContent: 'space-between', ...Shadow.md,
    },
    iconCircleWhite: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    },
    mainTileLabelWhite: { fontSize: Font.md, fontWeight: '800', color: Colors.white, lineHeight: 22 },

    mainTileSecondary: {
        flex: 1, backgroundColor: '#E0F2FE', borderRadius: Radius.lg,
        padding: Spacing.lg, height: 140, justifyContent: 'space-between',
        borderWidth: 1, borderColor: '#BAE6FD', ...Shadow.sm,
    },
    iconCircleBlue: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#7DD3FC',
    },
    mainTileLabelBlue: { fontSize: Font.md, fontWeight: '800', color: '#0369A1', lineHeight: 22 },

    secondaryActionRow: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        flexDirection: 'row', alignItems: 'center',
        padding: Spacing.md, paddingVertical: 14,
        ...Shadow.sm, marginTop: Spacing.xs,
    },
    secondaryIconWrap: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md,
    },
    secondaryTextWrap: { flex: 1 },
    secondaryActionTitle: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    secondaryActionSub: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 2 },

    emptyCard: { padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.separator },
    emptyText: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '600' },

    supportContainer: { backgroundColor: Colors.card, borderRadius: Radius.lg, ...Shadow.sm, overflow: 'hidden' },
    supportRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.separator },
    supportIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    supportTextWrap: { flex: 1 },
    supportTitle: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    supportSub: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
    appVersion: { textAlign: 'center', fontSize: 10, color: Colors.textMuted, marginTop: Spacing.xl, fontWeight: '600', letterSpacing: 0.5 },
});

const drawerStyles = StyleSheet.create({
    overlay: { flex: 1, flexDirection: 'row' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
    drawer: {
        height: '100%',
        backgroundColor: Colors.surface,
        paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
        paddingHorizontal: Spacing.lg,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    logoChip: {
        width: 54, height: 54, borderRadius: 14,
        backgroundColor: Colors.white,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.cardBorder,
        ...Shadow.sm,
    },
    logoImage: { width: 38, height: 38 },
    headerText: { flex: 1 },
    workshopName: { fontSize: Font.md + 1, fontWeight: '800', color: Colors.textPrimary },
    userName: { fontSize: Font.xs, color: Colors.textSecondary, marginTop: 2 },
    roleBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryMuted,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 6,
    },
    roleText: { fontSize: 8, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
    divider: { height: 1, backgroundColor: Colors.separator, marginVertical: Spacing.xs },
    menuList: { paddingTop: Spacing.sm },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.separator + '40',
    },
    iconWrap: {
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md,
    },
    textWrap: { flex: 1 },
    itemTitle: { fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary },
    itemSubtitle: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
    themeSubmenu: {
        backgroundColor: Colors.bg,
        borderRadius: Radius.md,
        padding: Spacing.sm,
        marginTop: Spacing.xs,
        marginBottom: Spacing.sm,
        gap: Spacing.xs,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radius.sm,
    },
    colorDot: { width: 14, height: 14, borderRadius: 7, marginRight: Spacing.md },
    themeLabel: { flex: 1, fontSize: Font.xs, fontWeight: '600', color: Colors.textSecondary },
    themeLabelSelected: { color: Colors.textPrimary, fontWeight: '700' },
    menuDivider: { height: 1, backgroundColor: Colors.separator, marginVertical: Spacing.sm },
    footer: {
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.separator,
        alignItems: 'center',
        justifyContent: 'center',
    },
    versionText: { fontSize: Font.xs - 1, fontWeight: '700', color: Colors.textMuted },
    proudlyIndia: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
});
