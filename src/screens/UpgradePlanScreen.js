import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
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

/**
 * Builds the inline HTML page that loads Razorpay Checkout.js
 * and auto-opens the payment modal.
 */
const buildCheckoutHTML = ({ orderId, keyId, amount, currency, userName, userContact, appName, description }) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0; padding: 0;
      display: flex; align-items: center; justify-content: center;
      height: 100vh;
      background: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .loader {
      text-align: center; color: #475569;
    }
    .loader p { margin-top: 12px; font-size: 14px; }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid #E2E8F0;
      border-top: 4px solid #F97316;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Opening Razorpay…</p>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    var options = {
      key: "${keyId}",
      amount: ${amount},
      currency: "${currency}",
      name: "${appName}",
      description: "${description}",
      order_id: "${orderId}",
      prefill: {
        name: "${(userName || '').replace(/"/g, '\\"')}",
        contact: "${(userContact || '').replace(/"/g, '\\"')}"
      },
      theme: { color: "#F97316" },
      handler: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "PAYMENT_SUCCESS",
          data: {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          }
        }));
      },
      modal: {
        ondismiss: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "PAYMENT_DISMISSED"
          }));
        }
      }
    };

    // Small delay to let the WebView settle before opening
    setTimeout(function() {
      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function(response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "PAYMENT_FAILED",
            data: {
              code: response.error.code,
              description: response.error.description,
              reason: response.error.reason
            }
          }));
        });
        rzp.open();
      } catch(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "PAYMENT_ERROR",
          data: { message: e.message }
        }));
      }
    }, 600);
  </script>
</body>
</html>
`;

export default function UpgradePlanScreen({ navigation }) {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutHTML, setCheckoutHTML] = useState('');
    const isVerifying = useRef(false);

    /**
     * Step 1: Call backend to create a Razorpay order, then open the
     * WebView-based checkout modal with the order details.
     */
    const handleBuyPro = useCallback(async () => {
        if (isVerifying.current) return;
        setLoading(true);
        try {
            const { data: res } = await api.post('/billing/razorpay/create-order');
            if (!res?.success || !res?.data?.orderId) {
                throw new Error(res?.message || 'Could not create payment order.');
            }

            const { orderId, amount, currency, keyId, customer } = res.data;

            const html = buildCheckoutHTML({
                orderId,
                keyId,
                amount,
                currency,
                userName: customer?.name || user?.name || '',
                userContact: customer?.contact || user?.phone || '',
                appName: 'Artist Finance Management',
                description: '1 Year PRO Subscription',
            });

            setCheckoutHTML(html);
            setShowCheckout(true);
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Could not initiate payment.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Step 2: Handle messages coming back from the Razorpay WebView.
     * On success → verify the signature with the backend.
     */
    const handleWebViewMessage = useCallback(async (event) => {
        let parsed;
        try {
            parsed = JSON.parse(event.nativeEvent.data);
        } catch {
            return;
        }

        if (parsed.type === 'PAYMENT_SUCCESS') {
            if (isVerifying.current) return;
            isVerifying.current = true;
            setShowCheckout(false);
            setLoading(true);

            try {
                const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

                const { data: verifyRes } = await api.post('/billing/razorpay/verify-payment', {
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                });

                if (!verifyRes?.success || !verifyRes?.data?.user) {
                    throw new Error(verifyRes?.message || 'Payment verification pending.');
                }

                const updatedUser = verifyRes.data.user;
                await storage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                toast.success('PRO activated successfully!');
                navigation.goBack();
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Could not verify your payment.';
                toast.error(message);
            } finally {
                setLoading(false);
                isVerifying.current = false;
            }
        } else if (parsed.type === 'PAYMENT_FAILED') {
            setShowCheckout(false);
            const description = parsed.data?.description || 'Payment failed. Please try again.';
            toast.error(description);
        } else if (parsed.type === 'PAYMENT_DISMISSED') {
            setShowCheckout(false);
        } else if (parsed.type === 'PAYMENT_ERROR') {
            setShowCheckout(false);
            toast.error(parsed.data?.message || 'Could not open payment gateway.');
        }
    }, [navigation, setUser]);

    const isPro = user?.plan === 'PRO';
    const priceLabel = '₹999';

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

                    {!isPro ? (
                        <TouchableOpacity
                            style={styles.upgradeBtn}
                            onPress={handleBuyPro}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.upgradeBtnText}>Subscribe to PRO</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.currentPlanLabel}>
                            <Feather name="check" size={16} color={Colors.success} />
                            <Text style={styles.currentPlanText}>Your PRO subscription is active</Text>
                        </View>
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
                    Subscription valid for 1 year from the date of purchase. Renew anytime to extend your PRO access by another year.
                </Text>
            </ScrollView>

            {/* ── Razorpay Checkout WebView Modal ── */}
            <Modal
                visible={showCheckout}
                animationType="slide"
                onRequestClose={() => setShowCheckout(false)}
                transparent={false}
            >
                <SafeAreaView style={styles.modalSafe}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowCheckout(false)} style={styles.modalClose}>
                            <Feather name="x" size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Complete Payment</Text>
                        <View style={{ width: 36 }} />
                    </View>
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: checkoutHTML }}
                        onMessage={handleWebViewMessage}
                        javaScriptEnabled
                        domStorageEnabled
                        startInLoadingState
                        renderLoading={() => (
                            <View style={styles.webviewLoader}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                            </View>
                        )}
                        style={styles.webview}
                    />
                </SafeAreaView>
            </Modal>
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
    currentPlanText: { fontSize: Font.sm, fontWeight: '700', color: Colors.success, marginLeft: 6 },
    footerNote: { textAlign: 'center', fontSize: 10, color: Colors.textMuted, marginTop: Spacing.md, fontStyle: 'italic' },

    // Modal / WebView styles
    modalSafe: { flex: 1, backgroundColor: Colors.bg },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.separator,
        backgroundColor: Colors.card,
    },
    modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    modalTitle: { fontSize: Font.lg, fontWeight: '700', color: Colors.textPrimary },
    webview: { flex: 1 },
    webviewLoader: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg,
    },
});
