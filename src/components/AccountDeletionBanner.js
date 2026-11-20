import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors, Font, Spacing, Radius, Shadow } from '../theme';

/**
 * AccountDeletionBanner
 *
 * Warning banner displayed cleanly below the screen header or top bar when an owner
 * has requested account deletion (7-day grace period).
 *
 * Shows countdown + warning message + Cancel button that navigates to WorkshopDetails.
 */
export default function AccountDeletionBanner({ navigation, style }) {
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!user?.deletionScheduledFor) {
            setTimeLeft(null);
            return;
        }

        const computeTimeLeft = () => {
            const now = new Date();
            const scheduledFor = new Date(user.deletionScheduledFor);
            const diff = scheduledFor - now;

            if (diff <= 0) {
                return { expired: true, days: 0, hours: 0 };
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            return { expired: false, days, hours };
        };

        setTimeLeft(computeTimeLeft());

        const interval = setInterval(() => {
            setTimeLeft(computeTimeLeft());
        }, 60 * 1000);

        return () => clearInterval(interval);
    }, [user?.deletionScheduledFor]);

    // Don't render if no deletion is scheduled or user is not an owner
    if (!user?.deletionScheduledFor || !timeLeft || user?.role !== 'owner') {
        return null;
    }

    if (timeLeft.expired) {
        return (
            <View style={[styles.container, styles.containerExpired, style]}>
                <View style={styles.iconCircleExpired}>
                    <Feather name="alert-triangle" size={16} color={Colors.danger} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.titleExpired}>Account deletion grace period expired</Text>
                    <Text style={styles.subtext}>Your account will be permanently deleted on next refresh.</Text>
                </View>
            </View>
        );
    }

    const timeText = timeLeft.days > 0
        ? `${timeLeft.days}d ${timeLeft.hours}h`
        : `${timeLeft.hours} hours`;

    return (
        <View style={[styles.container, style]}>
            <View style={styles.topRow}>
                <View style={styles.iconCircle}>
                    <Feather name="alert-triangle" size={16} color="#D97706" />
                </View>
                <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>Account Deletion Scheduled</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{timeText} left</Text>
                        </View>
                    </View>
                    <Text style={styles.subtext}>
                        Your account and data will be permanently deleted in {timeText}. Tap cancel to keep your account.
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                    if (navigation) {
                        navigation.navigate('WorkshopDetails');
                    }
                }}
                activeOpacity={0.8}
            >
                <Feather name="rotate-ccw" size={14} color={Colors.white} />
                <Text style={styles.cancelButtonText}>Cancel Deletion Request</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
        ...Shadow.sm,
    },
    containerExpired: {
        backgroundColor: Colors.dangerBg,
        borderColor: Colors.danger,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm + 2,
        marginTop: 2,
    },
    iconCircleExpired: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.dangerBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm + 2,
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 6,
    },
    title: {
        fontSize: Font.sm,
        fontWeight: '800',
        color: '#92400E',
    },
    titleExpired: {
        fontSize: Font.sm,
        fontWeight: '800',
        color: Colors.danger,
    },
    badge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#B45309',
    },
    subtext: {
        fontSize: Font.xs,
        color: '#78350F',
        marginTop: 3,
        lineHeight: 16,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#D97706',
        borderRadius: Radius.md,
        paddingVertical: 8,
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.sm + 2,
    },
    cancelButtonText: {
        color: Colors.white,
        fontSize: Font.xs,
        fontWeight: '700',
    },
});
