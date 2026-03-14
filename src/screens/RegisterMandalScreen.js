import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import api, { getMandalPath } from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Spacing } from '../theme';
import { toast } from '../utils/toast';

export default function RegisterMandalScreen({ navigation }) {
    const [form, setForm] = useState({ ganpatiTitle: '', mandalName: '', area: '', city: '' });
    const [loading, setLoading] = useState(false);

    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        if (!form.ganpatiTitle.trim() || !form.mandalName.trim() || !form.area.trim() || !form.city.trim()) {
            toast.error('Ganpati title, mandal name, area and city are required.');
            return;
        }
        setLoading(true);
        try {
            const mandalPath = getMandalPath();
            const res = await api.post(mandalPath, form);
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
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Register Mandal" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <InputField label="Ganpati Title *" value={form.ganpatiTitle} onChangeText={set('ganpatiTitle')} placeholder="e.g. Ganesh Galli" />
                <InputField label="Mandal Name *" value={form.mandalName} onChangeText={set('mandalName')} placeholder="e.g. Sarvajanik Ganeshotsav Mandal" />
                <InputField label="Area *" value={form.area} onChangeText={set('area')} placeholder="e.g. Dadar" />
                <InputField label="City *" value={form.city} onChangeText={set('city')} placeholder="e.g. Mumbai" />
                <PrimaryButton title="Register Mandal" onPress={handleSubmit} loading={loading} style={styles.btn} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    container: { padding: Spacing.xl },
    btn: { marginTop: Spacing.md },
});
