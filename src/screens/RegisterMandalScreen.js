import React, { useState } from 'react';
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

export default function RegisterMandalScreen({ navigation }) {
    const [form, setForm] = useState({ ganpatiTitle: '', mandalName: '', area: '', city: '' });
    const [loading, setLoading] = useState(false);

    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

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
            setTimeout(() => navigation.replace('MandalDetails', { mandalId }), 1200);
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
});
