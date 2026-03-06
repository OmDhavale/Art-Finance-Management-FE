import React, { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { Colors, Radius, Font } from '../theme';

export default function PrimaryButton({ title, onPress, loading = false, disabled = false, style }) {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
    const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity
                style={[styles.button, disabled && styles.disabled]}
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={disabled || loading}
                activeOpacity={1}
                accessible
                accessibilityRole="button"
            >
                {loading
                    ? <ActivityIndicator color={Colors.bg} size="small" />
                    : <Text style={styles.text}>{title}</Text>
                }
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: Colors.accent,
        borderRadius: Radius.md,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabled: { opacity: 0.45 },
    text: { color: Colors.bg, fontSize: Font.md, fontWeight: '700', letterSpacing: 0.4 },
});
