import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    ScrollView, StatusBar, ActivityIndicator, Alert, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';
import api from '../api/api';
import storage from '../utils/storage';
import { toast } from '../utils/toast';
import { Image } from 'react-native';

const FeatureItem = ({ text, included, isProOnly }) => (
    <View style={styles.featureRow}>
        <Feather
            name={included ? "check-circle" : "x-circle"}
            size={18}
            color={included ? Colors.success : Colors.textMuted}
        />
        <Text style={[styles.featureText, !included && styles.featureDisabled]}>
            {text}
        </Text>
        {isProOnly && <View style={styles.proBadgeSmall}><Text style={styles.proBadgeTextSmall}>PRO</Text></View>}
    </View>
);

export default function UpgradePlanScreen({ navigation }) {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const handlePlanToggle = async (targetPlan) => {
        setLoading(true);
        try {
            const res = await api.post('/users/update-plan', { plan: targetPlan });
            if (res.data.success) {
                const updatedUser = res.data.data;
                await storage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                toast.success(`Successfully switched to ${targetPlan}!`);
                navigation.goBack();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to switch to ${targetPlan}.`);
        } finally {
            setLoading(false);
        }
    };

    const isPro = user?.plan === 'PRO';

    return (
        <SafeAreaView style={styles.safe}>
            <ScreenHeader title="Plans & Billing" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                        {/* <Feather name="zap" size={40} color={Colors.primary} /> */}
                        <Image
                            source={require('../../assets/ganesha_logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.heroTitle}>Level Up Your Workshop</Text>
                    <Text style={styles.heroSub}>Choose the plan that fits your growth</Text>
                </View>

                {/* PRO PLAN CARD */}
                <View style={[styles.planCard, styles.proCard, isPro && styles.activePlan]}>
                    <View style={styles.planHeader}>
                        <View>
                            <Text style={styles.planName}>PRO PLAN</Text>
                            <View style={styles.priceContainer}>
                                <Text style={styles.planPrice}>₹999<Text style={styles.planPeriod}>/year</Text></Text>
                                <Text style={styles.oldPrice}>₹1,499</Text>
                            </View>
                        </View>
                        <View style={styles.proBadge}>
                            <Text style={styles.proBadgeText}>BEST VALUE</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.benefits}>
                        <FeatureItem text="Unlimited bookings per year" included />
                        <FeatureItem text="Full Mandal payment history" included isProOnly />
                        <FeatureItem text="View previous vendors & dues" included isProOnly />
                        <FeatureItem text="Mandal Grade Analytics" included isProOnly />
                        <FeatureItem text="Add multiple managers" included isProOnly />
                        <FeatureItem text="Real-time risk alerts" included isProOnly />
                    </View>

                    {!isPro ? (
                        <TouchableOpacity
                            style={styles.upgradeBtn}
                            onPress={() => handlePlanToggle('PRO')}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.upgradeBtnText}>Upgrade to PRO</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.currentPlanLabel}>
                            <Feather name="check" size={16} color={Colors.success} />
                            <Text style={styles.currentPlanText}>Your Current Plan</Text>
                        </View>
                    )}
                </View>

                {/* FREE PLAN CARD */}
                <View style={[styles.planCard, !isPro && styles.activePlan]}>
                    <Text style={styles.planName}>FREE PLAN</Text>
                    <Text style={styles.planPrice}>₹0<Text style={styles.planPeriod}>/forever</Text></Text>

                    <View style={styles.divider} />

                    <View style={styles.benefits}>
                        <FeatureItem text="Max 15 bookings per year" included />
                        <FeatureItem text="Manage your own bookings" included />
                        <FeatureItem text="Basic Mandal search" included />
                        <FeatureItem text="Mandal payment history" included={false} />
                        <FeatureItem text="Multi-manager access" included={false} />
                    </View>

                    {isPro ? (
                        <TouchableOpacity
                            style={[styles.upgradeBtn, { backgroundColor: '#334155' }]}
                            onPress={() => handlePlanToggle('FREE')}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.upgradeBtnText}>Downgrade to FREE</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.currentPlanLabel}>
                            <Feather name="check" size={16} color={Colors.success} />
                            <Text style={styles.currentPlanText}>Your Current Plan</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.footerNote}>
                    * Current subscription valid for 365 days from date of upgrade.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: Spacing.lg },
    heroSection: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.md },
    iconCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF7ED',
        alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
        borderWidth: 2, borderColor: '#FED7AA'
    },
    heroTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
    heroSub: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 4 },
    planCard: {
        backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl,
        marginBottom: Spacing.lg, ...Shadow.md, borderWidth: 1, borderColor: Colors.cardBorder
    },
    proCard: { borderColor: Colors.primary, borderWidth: 2 },
    activePlan: { backgroundColor: '#F8FAFC' },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    planName: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.5 },
    planPrice: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary },
    planPeriod: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
    priceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 },
    oldPrice: { 
        fontSize: 16, fontWeight: '700', color: Colors.danger, 
        textDecorationLine: 'line-through', opacity: 0.8 
    },
    proBadge: { backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    proBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.white },
    proBadgeSmall: { backgroundColor: '#F9731615', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
    proBadgeTextSmall: { fontSize: 8, fontWeight: '800', color: '#F97316' },
    divider: { height: 1, backgroundColor: Colors.separator, marginVertical: Spacing.lg },
    benefits: { gap: 14 },
    featureRow: { flexDirection: 'row', alignItems: 'center' },
    featureText: { fontSize: Font.sm, color: Colors.textPrimary, marginLeft: 12, fontWeight: '500' },
    featureDisabled: { color: Colors.textMuted, textDecorationLine: 'line-through' },
    upgradeBtn: {
        backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: Radius.lg,
        alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl, ...Shadow.primary
    },
    upgradeBtnText: { fontSize: Font.md, fontWeight: '700', color: Colors.white },
    currentPlanLabel: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginTop: Spacing.xl, backgroundColor: '#ECFDF5', paddingVertical: 10, borderRadius: Radius.md
    },
    logoImage: { width: 60, height: 60 },
    heading: { fontSize: Font.xl + 2, fontWeight: '800', color: Colors.textPrimary },
    subText: { fontSize: Font.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, paddingHorizontal: 20, lineHeight: 20 },

    currentPlanText: { fontSize: Font.sm, fontWeight: '700', color: Colors.success, marginLeft: 6 },
    footerNote: { textAlign: 'center', fontSize: 10, color: Colors.textMuted, marginTop: Spacing.md, fontStyle: 'italic' }
});
