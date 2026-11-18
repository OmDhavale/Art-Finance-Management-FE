import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, ActivityIndicator, Alert, Platform, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ScreenHeader from '../components/ScreenHeader';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';
import api from '../api/api';
import storage from '../utils/storage';
import { toast } from '../utils/toast';
import { Image } from 'react-native';
import { useIAP } from 'expo-iap';

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

const PRO_PRODUCT_ID = 'artist_finance_pro_yearly';

export default function UpgradePlanScreen({ navigation }) {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [pendingPurchase, setPendingPurchase] = useState(null);
    const processingTokens = useRef(new Set());

    const handlePurchaseError = useCallback((error) => {
        const message = error?.message || 'Google Play could not complete the purchase.';
        if (!String(message).toLowerCase().includes('cancel')) toast.error(message);
        setLoading(false);
    }, []);

    const { connected, subscriptions, fetchProducts, requestPurchase,
        finishTransaction, getAvailablePurchases, availablePurchases } = useIAP({
            onPurchaseSuccess: (purchase) => setPendingPurchase(purchase),
            onPurchaseError: handlePurchaseError,
            onError: (error) => console.warn('Google Play Billing:', error),
        });

    const proSubscription = subscriptions.find((item) => item.id === PRO_PRODUCT_ID);

    const verifyAndFinish = useCallback(async (purchase) => {
        const token = purchase?.purchaseToken;
        const productId = purchase?.productId;
        if (!token || productId !== PRO_PRODUCT_ID) {
            throw new Error('Google Play did not return a valid subscription purchase token.');
        }
        if (processingTokens.current.has(token)) return;
        processingTokens.current.add(token);
        setLoading(true);
        try {
            const response = await api.post('/billing/verify-purchase', {
                purchaseToken: token,
                productId,
            });
            if (!response.data?.success || !response.data?.data?.user) {
                throw new Error(response.data?.message || 'Purchase verification is still pending.');
            }
            const updatedUser = response.data.data.user;
            await storage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            // Complete the Play transaction only after our backend has verified it.
            await finishTransaction({ purchase, isConsumable: false });
            toast.success('PRO activated successfully!');
            navigation.goBack();
        } catch (error) {
            processingTokens.current.delete(token);
            const message = error.response?.data?.message || error.message || 'Could not verify your purchase.';
            toast.error(message);
        } finally {
            setLoading(false);
            setRestoring(false);
            setPendingPurchase(null);
        }
    }, [finishTransaction, navigation, setUser]);

    useEffect(() => {
        if (connected) {
            fetchProducts({ skus: [PRO_PRODUCT_ID], type: 'subs' });
            // Query Google Play on entry so a purchase completed on another device
            // or during a previous session can be restored against the signed-in account.
            getAvailablePurchases();
        }
    }, [connected, fetchProducts, getAvailablePurchases]);

    useEffect(() => {
        if (pendingPurchase) verifyAndFinish(pendingPurchase);
    }, [pendingPurchase, verifyAndFinish]);

    useEffect(() => {
        if (!availablePurchases?.length) return;
        const matching = availablePurchases.find((purchase) =>
            purchase.productId === PRO_PRODUCT_ID && purchase.purchaseToken
        );
        if (matching && user?.plan !== 'PRO') verifyAndFinish(matching);
    }, [availablePurchases, user?.plan, verifyAndFinish]);

    const handleBuyPro = async () => {
        if (Platform.OS !== 'android') {
            Alert.alert('Android only', 'Google Play Billing is configured for the Android version of this app.');
            return;
        }
        if (!connected) {
            toast.error('Google Play is not available yet. Please try again.');
            return;
        }
        const offers = proSubscription?.subscriptionOfferDetailsAndroid || [];
        const offer = offers.find((item) => item.offerToken) || offers[0];
        if (!offer?.offerToken) {
            toast.error('PRO subscription is not available. Check its activation and base plan in Play Console.');
            return;
        }
        setLoading(true);
        try {
            await requestPurchase({
                request: {
                    google: {
                        skus: [PRO_PRODUCT_ID],
                        subscriptionOffers: [{ sku: PRO_PRODUCT_ID, offerToken: offer.offerToken }],
                    },
                },
                type: 'subs',
            });
            // Purchase result arrives asynchronously through onPurchaseSuccess.
        } catch (error) {
            setLoading(false);
            handlePurchaseError(error);
        }
    };

    const handleRestore = async () => {
        if (!connected) {
            toast.error('Google Play is not connected. Please try again.');
            return;
        }
        setRestoring(true);
        try {
            await getAvailablePurchases();
            // availablePurchases updates through the hook; the effect above verifies it.
            setTimeout(() => setRestoring(false), 2500);
        } catch (error) {
            setRestoring(false);
            toast.error('Unable to restore purchases. Please try again.');
        }
    };

    const isPro = user?.plan === 'PRO';
    const priceLabel = proSubscription?.displayPrice || '₹990';
    const BillingStatus = ({ connected, productsCount }) => {
        if (!connected) {
            return (
                <View style={{
                    backgroundColor: '#FEF3C7',
                    padding: 12,
                    borderRadius: 12,
                    marginTop: 16,
                }}>
                    <Text style={{ color: '#92400E', fontWeight: '700' }}>
                        ⚠️ Google Play Billing Disconnected
                    </Text>

                    <Text style={{
                        color: '#92400E',
                        fontSize: 12,
                        marginTop: 5
                    }}>
                        Unable to connect to Google Play.
                        PRO purchases are temporarily unavailable.
                    </Text>
                </View>
            );
        }

        if (productsCount === 0) {
            return (
                <View style={{
                    backgroundColor: '#FEF3C7',
                    padding: 12,
                    borderRadius: 12,
                    marginTop: 16,
                }}>
                    <Text style={{ color: '#92400E', fontWeight: '700' }}>
                        ⚠️ Subscription Product Not Found
                    </Text>

                    <Text style={{ color: '#92400E', fontSize: 12 }}>
                        Billing is connected, but the PRO subscription
                        could not be loaded.
                    </Text>
                </View>
            );
    }

        return (
            <View style={{
                backgroundColor: '#DCFCE7',
                padding: 12,
                borderRadius: 12,
                marginTop: 16,
            }}>
                <Text style={{ color: '#166534', fontWeight: '700' }}>
                    ✓ Google Play Billing Connected
                </Text>
                <Text style={{ color: '#166534', fontSize: 12 }}>
                    PRO subscription is available.
                </Text>
            </View>
        );
    };
    return (
        <SafeAreaView style={styles.safe}>
            <ScreenHeader title="Plans & Billing" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                        <Image source={require('../../assets/ganesha_logo.png')} style={styles.logoImage} resizeMode="contain" />
                    </View>
                    <Text style={styles.heroTitle}>Level Up Your Workshop</Text>
                    <Text style={styles.heroSub}>Choose the plan that fits your growth</Text>
                </View>

                <View style={[styles.planCard, styles.proCard, isPro && styles.activePlan]}>
                    <View style={styles.planHeader}>
                        <View>
                            <Text style={styles.planName}>PRO PLAN</Text>
                            <View style={styles.priceContainer}>
                                <Text style={styles.planPrice}>{priceLabel}<Text style={styles.planPeriod}>/year</Text></Text>
                            </View>
                        </View>
                        <View style={styles.proBadge}><Text style={styles.proBadgeText}>BEST VALUE</Text></View>
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
                    <BillingStatus
                        connected={connected}
                        productsCount={proSubscription ? 1 : 0}
                    />
                    {!isPro ? (
                        <TouchableOpacity
                            style={[
                                styles.upgradeBtn,
                                (!connected || !proSubscription) && {
                                    backgroundColor: '#9CA3AF',
                                    opacity: 0.7
                                }
                            ]}
                            onPress={handleBuyPro}
                            disabled={loading || !connected || !proSubscription}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.upgradeBtnText}>
                                    {!connected
                                        ? 'Billing Unavailable'
                                        : !proSubscription
                                            ? 'Subscription Unavailable'
                                            : 'Subscribe to PRO'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.currentPlanLabel}>
                            <Feather name="check" size={16} color={Colors.success} />
                            <Text style={styles.currentPlanText}>Your PRO subscription is active</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoring || loading}>
                        <Text style={styles.restoreText}>{restoring ? 'Checking purchases…' : 'Restore purchases'}</Text>
                    </TouchableOpacity>
                    {isPro && (
                        <TouchableOpacity style={styles.restoreBtn} onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions')}>
                            <Text style={styles.restoreText}>Manage / cancel subscription in Google Play</Text>
                        </TouchableOpacity>
                    )}
                </View>

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
                    {!isPro && (
                        <View style={styles.currentPlanLabel}>
                            <Feather name="check" size={16} color={Colors.success} />
                            <Text style={styles.currentPlanText}>Your Current Plan</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.footerNote}>
                    Subscription renews yearly through Google Play unless cancelled. Cancellation does not remove access before the paid period expires.
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
    restoreBtn: { alignItems: 'center', paddingTop: 14 },
    restoreText: { color: Colors.primary, fontSize: Font.sm, fontWeight: '600', textAlign: 'center' },
    footerNote: { textAlign: 'center', fontSize: 10, color: Colors.textMuted, marginTop: Spacing.md, fontStyle: 'italic' }
});
