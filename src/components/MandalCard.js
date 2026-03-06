import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors, Font, Radius, Spacing, gradeConfig } from '../theme';

export default function MandalCard({ mandal, onPress }) {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
    const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

    const cfg = mandal.latestGrade ? gradeConfig[mandal.latestGrade] : null;
    const initial = (mandal.ganpatiTitle || 'M').charAt(0).toUpperCase();

    return (
        <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
            <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
                <View style={styles.iconBox}>
                    <Text style={styles.iconText}>{initial}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{mandal.ganpatiTitle}</Text>
                    <Text style={styles.name} numberOfLines={1}>{mandal.mandalName}</Text>
                    <Text style={styles.location} numberOfLines={1}>
                        {[mandal.area, mandal.city].filter(Boolean).join(', ') || 'Location not specified'}
                    </Text>
                </View>
                <View style={styles.right}>
                    {cfg ? (
                        <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.pillText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                    ) : null}
                    <Text style={styles.arrow}>›</Text>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.card, borderRadius: Radius.md,
        padding: Spacing.lg, marginBottom: Spacing.sm,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    iconBox: {
        width: 44, height: 44, borderRadius: Radius.full,
        backgroundColor: Colors.accentMuted, alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md,
    },
    iconText: { fontSize: Font.lg, fontWeight: '900', color: Colors.accent },
    info: { flex: 1 },
    title: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    name: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 2 },
    location: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: 6, marginLeft: Spacing.sm },
    pill: { borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
    pillText: { fontSize: Font.xs, fontWeight: '700' },
    arrow: { fontSize: 22, color: Colors.textMuted },
});
