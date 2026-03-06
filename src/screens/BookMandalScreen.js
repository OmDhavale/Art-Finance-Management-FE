import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const STEPS = ['Mandal Info', 'Booking Info'];

export default function BookMandalScreen({ navigation }) {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [mandalId, setMandalId] = useState(null);

    const [mandal, setMandal] = useState({
        ganpatiTitle: '',
        mandalName: '',
        area: '',
        city: '',
    });

    const [booking, setBooking] = useState({
        year: String(new Date().getFullYear()),
        murtiSize: '',
        originalPrice: '',
        finalPrice: '',
        advancePaid: '',
    });

    const setM = (key) => (val) => setMandal((f) => ({ ...f, [key]: val }));
    const setB = (key) => (val) => setBooking((f) => ({ ...f, [key]: val }));

    const handleMandalSubmit = async () => {
        if (!mandal.ganpatiTitle || !mandal.mandalName) {
            Alert.alert('Error', 'Ganpati title and mandal name are required.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/mandals', {
                ...mandal,
                createdBy: user?._id,
            });
            setMandalId(res.data.data._id);
            setStep(1);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to create mandal.';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleBookingSubmit = async () => {
        const { year, murtiSize, originalPrice, finalPrice, advancePaid } = booking;
        if (!year || !murtiSize || !originalPrice || !finalPrice) {
            Alert.alert('Error', 'Year, murti size, original price, and final price are required.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/bookings', {
                mandalId,
                vendorId: user?._id,
                year: Number(year),
                murtiSize,
                originalPrice: Number(originalPrice),
                finalPrice: Number(finalPrice),
                advancePaid: Number(advancePaid) || 0,
            });
            Alert.alert('Success', 'Booking created successfully! 🙏', [
                { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
            ]);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to create booking.';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>
                {/* Step indicator */}
                <View style={styles.steps}>
                    {STEPS.map((s, i) => (
                        <View key={i} style={styles.stepWrap}>
                            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                                <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>{i + 1}</Text>
                            </View>
                            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.card}>
                    {step === 0 ? (
                        <>
                            <Text style={styles.sectionTitle}>📍 Mandal Information</Text>
                            {[
                                { key: 'ganpatiTitle', label: 'Ganpati Title *', placeholder: 'e.g. Ganesh Galli' },
                                { key: 'mandalName', label: 'Mandal Name *', placeholder: 'e.g. Sarvajanik Ganeshotsav' },
                                { key: 'area', label: 'Area', placeholder: 'e.g. Dadar' },
                                { key: 'city', label: 'City', placeholder: 'e.g. Mumbai' },
                            ].map(({ key, label, placeholder }) => (
                                <View key={key}>
                                    <Text style={styles.label}>{label}</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={placeholder}
                                        placeholderTextColor="#aaa"
                                        value={mandal[key]}
                                        onChangeText={setM(key)}
                                    />
                                </View>
                            ))}
                            <TouchableOpacity style={styles.button} onPress={handleMandalSubmit} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Next: Booking Info →</Text>}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>📋 Booking Details</Text>
                            {[
                                { key: 'year', label: 'Year *', placeholder: 'e.g. 2025', keyboard: 'numeric' },
                                { key: 'murtiSize', label: 'Murti Size *', placeholder: 'e.g. 4 feet' },
                                { key: 'originalPrice', label: 'Original Price (₹) *', placeholder: '0', keyboard: 'numeric' },
                                { key: 'finalPrice', label: 'Final Price (₹) *', placeholder: '0', keyboard: 'numeric' },
                                { key: 'advancePaid', label: 'Advance Paid (₹)', placeholder: '0', keyboard: 'numeric' },
                            ].map(({ key, label, placeholder, keyboard }) => (
                                <View key={key}>
                                    <Text style={styles.label}>{label}</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={placeholder}
                                        placeholderTextColor="#aaa"
                                        value={booking[key]}
                                        onChangeText={setB(key)}
                                        keyboardType={keyboard || 'default'}
                                    />
                                </View>
                            ))}
                            <TouchableOpacity style={styles.button} onPress={handleBookingSubmit} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Booking ✓</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStep(0)}>
                                <Text style={styles.back}>← Back to Mandal Info</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#FFF8F5' },
    container: { padding: 20, paddingBottom: 40 },
    steps: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 24 },
    stepWrap: { alignItems: 'center' },
    stepDot: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
    },
    stepDotActive: { backgroundColor: '#FF6B35' },
    stepNum: { fontSize: 14, fontWeight: '700', color: '#999' },
    stepNumActive: { color: '#fff' },
    stepLabel: { fontSize: 12, color: '#999' },
    stepLabelActive: { color: '#FF6B35', fontWeight: '600' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 4,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
    label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5, marginTop: 12 },
    input: {
        borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: '#333', backgroundColor: '#FAFAFA',
    },
    button: {
        backgroundColor: '#FF6B35', borderRadius: 10,
        paddingVertical: 14, alignItems: 'center', marginTop: 24,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    back: { textAlign: 'center', color: '#FF6B35', marginTop: 12, fontSize: 14 },
});
