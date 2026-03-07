import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Font, Spacing, Shadow } from '../theme';

export default function ScreenHeader({ title, onBack, rightElement }) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <View style={styles.row}>
                {onBack ? (
                    <TouchableOpacity onPress={onBack} style={styles.backBtn} accessible accessibilityLabel="Go back">
                        <Feather name="chevron-left" size={22} color={Colors.textPrimary} />
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
        paddingBottom: 16,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.separator,
        ...Shadow.sm,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: Colors.bg,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 8,
    },
    title: {
        flex: 1, fontSize: Font.lg, fontWeight: '700',
        color: Colors.textPrimary, textAlign: 'center', marginHorizontal: 4,
    },
    placeholder: { width: 36 },
});
