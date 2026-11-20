import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Font, Spacing, Radius, Shadow } from '../theme';

/**
 * AccountDeletionSection
 *
 * Renders the account deletion UI for the Workshop Profile page.
 *
 * For owners:
 *   - If NO deletion is pending → shows a "Delete My Account" button (danger).
 *     Tapping it opens a confirmation modal requiring password entry.
 *   - If a deletion IS pending → shows status info + "Cancel Deletion" button.
 *
 * For managers:
 *   - Renders nothing (managers cannot delete accounts).
 *
 * Props:
 *   - onSuccess: optional callback after successful request/cancel.
 */
export default function AccountDeletionSection({ onSuccess }) {
    const { user, requestAccountDeletion, cancelAccountDeletion } = useAuth();

    const [showModal, setShowModal] = useState(false);
    const [showConfirmStep, setShowConfirmStep] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);

    // Managers cannot delete — render nothing
    if (!user || user.role !== 'owner') {
        return null;
    }

    const isDeletionPending = !!user.deletionScheduledFor;

    // ─── Compute remaining time ───────────────────────────────────────────────
    const getTimeRemaining = () => {
        if (!user.deletionScheduledFor) return null;
        const now = new Date();
        const scheduledFor = new Date(user.deletionScheduledFor);
        const diff = scheduledFor - now;
        if (diff <= 0) return 'Imminent';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ${hours}h`;
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    };

    // ─── Handle Deletion Request ──────────────────────────────────────────────
    const handleRequestDeletion = async () => {
        if (!password.trim()) {
            setError('Please enter your password to confirm.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await requestAccountDeletion(password);
            setShowModal(false);
            setShowConfirmStep(false);
            setPassword('');
            if (onSuccess) onSuccess('requested');
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to request deletion. Try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ─── Handle Cancel Deletion ───────────────────────────────────────────────
    const handleCancelDeletion = async () => {
        setCancelLoading(true);
        try {
            await cancelAccountDeletion();
            if (onSuccess) onSuccess('cancelled');
        } catch (err) {
            // Silently handle — user will see the state hasn't changed
            console.error('Cancel deletion failed:', err?.response?.data?.message || err.message);
        } finally {
            setCancelLoading(false);
        }
    };

    // ─── Close Modal ──────────────────────────────────────────────────────────
    const closeModal = () => {
        setShowModal(false);
        setShowConfirmStep(false);
        setPassword('');
        setError('');
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: Deletion is Pending
    // ═══════════════════════════════════════════════════════════════════════════
    if (isDeletionPending) {
        return (
            <View style={styles.sectionContainer}>
                <View style={styles.pendingCard}>
                    <Text style={styles.pendingIcon}>⏳</Text>
                    <Text style={styles.pendingTitle}>Account Deletion Scheduled</Text>
                    <Text style={styles.pendingText}>
                        Your account and all associated data (managers, mandals, bookings)
                        will be permanently deleted in{' '}
                        <Text style={styles.boldText}>{getTimeRemaining()}</Text>.
                    </Text>
                    <Text style={styles.pendingSubtext}>
                        You can continue using all features until then. If you change your
                        mind, cancel the deletion below.
                    </Text>

                    <TouchableOpacity
                        style={styles.cancelDeletionButton}
                        onPress={handleCancelDeletion}
                        disabled={cancelLoading}
                        activeOpacity={0.7}
                    >
                        {cancelLoading ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <Text style={styles.cancelDeletionText}>Cancel Deletion</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: No Deletion Pending — Show Delete Button
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            <View style={styles.dangerCard}>
                <Text style={styles.dangerDescription}>
                    Permanently delete your workshop account, including all managers,
                    mandals, and booking records. This action has a 7-day cooling period
                    during which you can cancel.
                </Text>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setShowModal(true)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.deleteButtonText}>Delete My Account</Text>
                </TouchableOpacity>
            </View>

            {/* ── Confirmation Modal ─────────────────────────────────────────── */}
            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {!showConfirmStep ? (
                            /* Step 1: Warning */
                            <>
                                <Text style={styles.modalIcon}>⚠️</Text>
                                <Text style={styles.modalTitle}>Are you sure?</Text>
                                <Text style={styles.modalBody}>
                                    This will schedule your account for permanent deletion after 7 days.
                                    {'\n\n'}
                                    <Text style={styles.boldText}>What will be deleted:</Text>
                                    {'\n'}• Your workshop account{'\n'}• All manager accounts under you{'\n'}• All mandal records{'\n'}• All booking & payment history
                                    {'\n\n'}
                                    You can still use all features and cancel this request during the 7-day period.
                                </Text>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalCancelBtn}
                                        onPress={closeModal}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.modalCancelText}>Go Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalProceedBtn}
                                        onPress={() => setShowConfirmStep(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.modalProceedText}>I Understand, Continue</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            /* Step 2: Password Confirmation */
                            <>
                                <Text style={styles.modalIcon}>🔐</Text>
                                <Text style={styles.modalTitle}>Confirm Your Identity</Text>
                                <Text style={styles.modalBody}>
                                    Enter your password to confirm the account deletion request.
                                </Text>

                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Enter your password"
                                    placeholderTextColor={Colors.textMuted}
                                    secureTextEntry
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        setError('');
                                    }}
                                    editable={!loading}
                                />

                                {error ? (
                                    <Text style={styles.errorText}>{error}</Text>
                                ) : null}

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalCancelBtn}
                                        onPress={() => {
                                            setShowConfirmStep(false);
                                            setPassword('');
                                            setError('');
                                        }}
                                        disabled={loading}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.modalCancelText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalDeleteBtn, loading && styles.disabledBtn]}
                                        onPress={handleRequestDeletion}
                                        disabled={loading}
                                        activeOpacity={0.7}
                                    >
                                        {loading ? (
                                            <ActivityIndicator size="small" color={Colors.white} />
                                        ) : (
                                            <Text style={styles.modalDeleteText}>Delete My Account</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionContainer: {
        marginTop: Spacing.xl,
        paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Font.lg,
        fontWeight: '700',
        color: Colors.danger,
        marginBottom: Spacing.md,
    },

    // ─── Danger Card (no deletion pending) ──────────────────────────────────
    dangerCard: {
        backgroundColor: Colors.dangerBg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.danger,
        padding: Spacing.lg,
    },
    dangerDescription: {
        fontSize: Font.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: Spacing.lg,
    },
    deleteButton: {
        backgroundColor: Colors.danger,
        paddingVertical: Spacing.md,
        borderRadius: Radius.sm,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: Colors.white,
        fontSize: Font.md,
        fontWeight: '700',
    },

    // ─── Pending Deletion Card ──────────────────────────────────────────────
    pendingCard: {
        backgroundColor: Colors.warningBg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.warning,
        padding: Spacing.lg,
        alignItems: 'center',
    },
    pendingIcon: {
        fontSize: 36,
        marginBottom: Spacing.sm,
    },
    pendingTitle: {
        fontSize: Font.lg,
        fontWeight: '700',
        color: Colors.warning,
        marginBottom: Spacing.sm,
    },
    pendingText: {
        fontSize: Font.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    pendingSubtext: {
        fontSize: Font.xs,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 17,
        marginBottom: Spacing.lg,
    },
    cancelDeletionButton: {
        backgroundColor: Colors.success,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        borderRadius: Radius.sm,
        alignItems: 'center',
        minWidth: 180,
    },
    cancelDeletionText: {
        color: Colors.white,
        fontSize: Font.md,
        fontWeight: '700',
    },
    boldText: {
        fontWeight: '700',
    },

    // ─── Modal ──────────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        width: '100%',
        maxWidth: 400,
        ...Shadow.md,
    },
    modalIcon: {
        fontSize: 40,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    modalTitle: {
        fontSize: Font.xl,
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    modalBody: {
        fontSize: Font.sm,
        color: Colors.textSecondary,
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    passwordInput: {
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        backgroundColor: Colors.inputBg,
        borderRadius: Radius.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: Font.md,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    errorText: {
        color: Colors.danger,
        fontSize: Font.sm,
        marginBottom: Spacing.md,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: Radius.sm,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        alignItems: 'center',
    },
    modalCancelText: {
        color: Colors.textSecondary,
        fontSize: Font.sm,
        fontWeight: '600',
    },
    modalProceedBtn: {
        flex: 1.5,
        paddingVertical: Spacing.md,
        borderRadius: Radius.sm,
        backgroundColor: Colors.warning,
        alignItems: 'center',
    },
    modalProceedText: {
        color: Colors.white,
        fontSize: Font.sm,
        fontWeight: '600',
    },
    modalDeleteBtn: {
        flex: 1.5,
        paddingVertical: Spacing.md,
        borderRadius: Radius.sm,
        backgroundColor: Colors.danger,
        alignItems: 'center',
    },
    modalDeleteText: {
        color: Colors.white,
        fontSize: Font.sm,
        fontWeight: '700',
    },
    disabledBtn: {
        opacity: 0.6,
    },
});
