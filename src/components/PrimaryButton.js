import React, { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Radius, Font, Shadow } from '../theme';

export default function PrimaryButton({
    title, onPress, loading = false, disabled = false,
    style, variant = 'filled', iconName,
    // legacy text icon
    icon,
}) {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
    const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

    const isFilled = variant === 'filled';
    const iconColor = isFilled ? Colors.white : Colors.primary;

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity
                style={[
                    styles.button,
                    isFilled ? styles.filled : styles.outlined,
                    disabled && styles.disabled,
                ]}
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={disabled || loading}
                activeOpacity={1}
                accessible
                accessibilityRole="button"
            >
                {loading ? (
                    <ActivityIndicator color={iconColor} size="small" />
                ) : (
                    <View style={styles.row}>
                        {iconName ? (
                            <Feather name={iconName} size={16} color={iconColor} />
                        ) : icon ? (
                            <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
                        ) : null}
                        <Text style={[styles.text, !isFilled && styles.textOutlined]}>{title}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: Radius.full,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filled: {
        backgroundColor: Colors.primary,
        ...Shadow.sm,
    },
    outlined: {
        backgroundColor: Colors.white,
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    disabled: { opacity: 0.45 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    icon: { fontSize: Font.md },
    text: { color: Colors.white, fontSize: Font.md, fontWeight: '700', letterSpacing: 0.3 },
    textOutlined: { color: Colors.primary },
});
