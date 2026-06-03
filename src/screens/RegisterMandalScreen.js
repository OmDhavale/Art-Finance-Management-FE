import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'react-native';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';
import { toast } from '../utils/toast';
import { getSimilarity } from '../utils/phoneticMatcher';

export default function RegisterMandalScreen({ navigation }) {
    const [form, setForm] = useState({ ganpatiTitle: '', mandalName: '', area: '', city: '' });
    const [loading, setLoading] = useState(false);
    const [existingMandals, setExistingMandals] = useState([]);
    const [warnings, setWarnings] = useState([]);

    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    useEffect(() => {
        api.get('/mandals')
            .then(res => {
                setExistingMandals(res.data.data || []);
            })
            .catch(err => {
                console.log('Failed to fetch mandals for duplicate checking:', err);
            });
    }, []);

    useEffect(() => {
        const mName = form.mandalName.trim();
        const gTitle = form.ganpatiTitle.trim();
        if (!mName && !gTitle) {
            setWarnings([]);
            return;
        }

        const found = [];
        for (const item of existingMandals) {
            let isMatch = false;
            let matchReason = '';

            if (mName && item.mandalName) {
                const sim = getSimilarity(mName, item.mandalName);
                if (sim >= 0.8) {
                    isMatch = true;
                    matchReason = `Similar Mandal Name (${Math.round(sim * 100)}% match)`;
                }
            }
            if (gTitle && item.ganpatiTitle) {
                const sim = getSimilarity(gTitle, item.ganpatiTitle);
                if (sim >= 0.8) {
                    isMatch = true;
                    matchReason = `Similar Ganpati Title (${Math.round(sim * 100)}% match)`;
                }
            }

            if (isMatch) {
                found.push({
                    ...item,
                    matchReason
                });
            }
        }
        setWarnings(found);
    }, [form.mandalName, form.ganpatiTitle, existingMandals]);

    const handleSubmit = async () => {
        if (!form.ganpatiTitle.trim() || !form.mandalName.trim() || !form.area.trim() || !form.city.trim()) {
            toast.error('All fields are required.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/mandals', form);
            const mandalId = res.data.data._id;
            toast.success(`${form.ganpatiTitle} has been registered.`, 'Mandal Registered');
            setTimeout(() => navigation.navigate('MandalDetails', { mandalId }), 1200);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to register mandal.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
            <ScreenHeader title="Register Mandal" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                {/* Logo Section */}
                <View style={styles.logoRow}>
                    <View style={styles.logoCircle}>
                        <Image
                            source={require('../../assets/ganesha_logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                <Text style={styles.heading}>Mandal Registration</Text>
                <Text style={styles.subText}>Add a new mandal to your workshop records.</Text>

                <View style={styles.formSection}>
                    <Text style={styles.fieldLabel}>Ganpati Title</Text>
                    <InputField
                        value={form.ganpatiTitle}
                        onChangeText={set('ganpatiTitle')}
                        placeholder="e.g. Ganesh Galli"
                        iconName="tag"
                    />

                    <Text style={styles.fieldLabel}>Mandal Name</Text>
                    <InputField
                        value={form.mandalName}
                        onChangeText={set('mandalName')}
                        placeholder="e.g. Sarvajanik Ganeshotsav Mandal"
                        iconName="users"
                    />

                    <View style={styles.row}>
                        <View style={styles.halfWidth}>
                            <Text style={styles.fieldLabel}>Area</Text>
                            <InputField
                                value={form.area}
                                onChangeText={set('area')}
                                placeholder="e.g. Dadar"
                                iconName="map-pin"
                            />
                        </View>
                        <View style={styles.halfWidth}>
                            <Text style={styles.fieldLabel}>City</Text>
                            <InputField
                                value={form.city}
                                onChangeText={set('city')}
                                placeholder="e.g. Mumbai"
                                iconName="map-pin"
                            />
                        </View>
                    </View>

                    {/* Duplicate Warnings Banner */}
                    {warnings.length > 0 && (
                        <View style={styles.warningContainer}>
                            <View style={styles.warningHeader}>
                                <Feather name="alert-triangle" size={16} color="#C2410C" />
                                <Text style={styles.warningTitle}>Potential Duplicate Detected</Text>
                            </View>
                            <Text style={styles.warningText}>
                                A similar mandal is already registered in your records. Please verify before proceeding:
                            </Text>
                            {warnings.slice(0, 3).map((w, idx) => (
                                <View key={w._id || idx} style={styles.warningItem}>
                                    <Text style={styles.warnName}>• {w.ganpatiTitle} ({w.mandalName})</Text>
                                    <Text style={styles.warnLoc}>
                                        Locality: {w.area || '—'}, {w.city || '—'} • {w.matchReason}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <PrimaryButton
                        title="Register Mandal"
                        iconName="plus"
                        onPress={handleSubmit}
                        loading={loading}
                        style={styles.btn}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    container: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },

    logoRow: { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.lg },
    logoCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: Colors.white,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.cardBorder,
        ...Shadow.md,
    },
    logoImage: { width: 80, height: 80 },

    heading: { fontSize: Font.xl + 2, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
    subText: { fontSize: Font.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: Spacing.xxl },

    formSection: { gap: Spacing.sm },
    fieldLabel: { fontSize: Font.sm, color: Colors.textPrimary, fontWeight: '600', marginBottom: 6 },

    row: { flexDirection: 'row', gap: Spacing.md },
    halfWidth: { flex: 1 },

    btn: { marginTop: Spacing.lg },

    warningContainer: {
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FED7AA',
        borderRadius: Radius.md,
        padding: Spacing.md,
        marginTop: Spacing.md,
        ...Shadow.sm,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    warningTitle: {
        fontSize: Font.sm,
        fontWeight: '800',
        color: '#C2410C',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    warningText: {
        fontSize: Font.xs,
        color: '#7C2D12',
        lineHeight: 16,
        marginBottom: 8,
    },
    warningItem: {
        backgroundColor: Colors.white,
        borderRadius: Radius.sm,
        padding: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#FDBA74',
    },
    warnName: {
        fontSize: Font.xs + 1,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    warnLoc: {
        fontSize: 10,
        color: Colors.textMuted,
        marginTop: 2,
    },
});
