import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Radius, Font, Spacing } from '../theme';

export default function InputField({
    label, value, onChangeText, placeholder,
    secureTextEntry = false, keyboardType = 'default',
    autoCapitalize = 'sentences', multiline = false, editable = true,
    style, onFocus, onBlur, iconName, hint, rightElement,
    // legacy emoji icon prop still accepted (renders as text if no iconName)
    icon,
}) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={[styles.wrap, style]}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <View style={[
                styles.inputWrap,
                focused && styles.inputWrapFocused,
                !editable && styles.inputWrapDisabled,
            ]}>
                {iconName ? (
                    <Feather name={iconName} size={16} color={Colors.textMuted} style={styles.iconLeft} />
                ) : icon ? (
                    <Text style={styles.iconText}>{icon}</Text>
                ) : null}
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    multiline={multiline}
                    editable={editable}
                    onFocus={() => { setFocused(true); onFocus?.(); }}
                    onBlur={() => { setFocused(false); onBlur?.(); }}
                />
                {rightElement || null}
            </View>
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginBottom: Spacing.md },
    label: {
        fontSize: Font.sm, color: Colors.textPrimary, fontWeight: '600',
        marginBottom: 8, letterSpacing: 0.2,
    },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.inputBg,
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        borderRadius: Radius.md,
        paddingHorizontal: 14,
        minHeight: 52,
    },
    inputWrapFocused: { borderColor: Colors.inputFocus },
    inputWrapDisabled: { opacity: 0.5, backgroundColor: Colors.bg },
    iconLeft: { marginRight: 10 },
    iconText: { fontSize: Font.md, marginRight: 8, color: Colors.textMuted },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: Font.md,
        color: Colors.textPrimary,
    },
    hint: {
        fontSize: Font.xs, color: Colors.textMuted, marginTop: 4,
        fontStyle: 'italic',
    },
});
