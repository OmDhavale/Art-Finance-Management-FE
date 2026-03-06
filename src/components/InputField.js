import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Radius, Font, Spacing } from '../theme';

export default function InputField({
    label, value, onChangeText, placeholder,
    secureTextEntry = false, keyboardType = 'default',
    autoCapitalize = 'sentences', multiline = false, editable = true,
    style,
}) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={[styles.wrap, style]}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <TextInput
                style={[styles.input, focused && styles.inputFocused, !editable && styles.inputDisabled]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                multiline={multiline}
                editable={editable}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginBottom: Spacing.md },
    label: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
    input: {
        backgroundColor: Colors.inputBg,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        borderRadius: Radius.sm,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: Font.md,
        color: Colors.textPrimary,
    },
    inputFocused: { borderColor: Colors.inputFocus },
    inputDisabled: { opacity: 0.5 },
});
