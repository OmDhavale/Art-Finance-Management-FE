import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Colors, Font, Spacing } from '../theme';

export default function ScreenHeader({ title, onBack, rightElement }) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <View style={styles.row}>
                {onBack ? (
                    <TouchableOpacity onPress={onBack} style={styles.backBtn} accessible accessibilityLabel="Go back">
                        <Text style={styles.backIcon}>‹</Text>
                    </TouchableOpacity>
                ) : <View style={styles.placeholder} />}
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {rightElement ? rightElement : <View style={styles.placeholder} />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 52,
        paddingBottom: 14,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.separator,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { padding: 4, marginRight: 8 },
    backIcon: { fontSize: Font.xxl + 4, color: Colors.accent, lineHeight: 28, marginTop: -2 },
    title: { flex: 1, fontSize: Font.lg, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginHorizontal: 4 },
    placeholder: { width: 36 },
});
