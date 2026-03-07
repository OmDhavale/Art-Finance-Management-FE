import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, StatusBar, Alert, Image, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';
import { toast } from '../utils/toast';

// Role pill colors
const ROLE_STYLE = {
    manager: { bg: '#FFF3E0', color: '#E65100', label: 'Senior Manager' },
    lead: { bg: '#FFF3E0', color: '#E65100', label: 'Workshop Lead' },
    accounting: { bg: '#E3F2FD', color: '#1565C0', label: 'Accounting' },
};
const getRoleCfg = (role) =>
    ROLE_STYLE[role] || { bg: Colors.bg, color: Colors.textMuted, label: role || 'Manager' };

// ── Manager card ──────────────────────────────────────────────────────────────
function ManagerCard({ manager, onDelete }) {
    const cfg = getRoleCfg(manager.role);
    const initials = (manager.name || 'M').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                {/* Avatar — initials circle */}
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                {/* Online dot */}
                <View style={styles.onlineDot} />
            </View>
            <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                    <Text style={styles.managerName}>{manager.name}</Text>
                    <View style={[styles.rolePill, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.rolePillText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>
                <View style={styles.phoneRow}>
                    <Feather name="phone" size={13} color={Colors.textMuted} />
                    <Text style={styles.phone}>{manager.phone || '—'}</Text>
                </View>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
                    <Feather name="trash-2" size={17} color={Colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreBtn}>
                    <Feather name="more-vertical" size={17} color={Colors.textMuted} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AddManagerScreen({ navigation }) {
    const { user } = useAuth();
    const [managers, setManagers] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [form, setForm] = useState({ name: '', phone: '', password: '', area: '', city: '' });
    const [adding, setAdding] = useState(false);
    const [showForm, setShowForm] = useState(false);

    React.useEffect(() => { fetchManagers(); }, []);

    const fetchManagers = async () => {
        setLoadingList(true);
        try {
            const res = await api.get('/users/managers');
            setManagers(res.data.data || []);
        } catch {
            toast.error('Failed to load managers.');
        } finally {
            setLoadingList(false);
        }
    };

    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        if (!form.name || !form.phone || !form.password) {
            toast.error('Name, phone, and password are required.');
            return;
        }
        setAdding(true);
        try {
            await api.post('/users/add-manager', form);
            toast.success('Manager account created.');
            setForm({ name: '', phone: '', password: '', area: '', city: '' });
            setShowForm(false);
            fetchManagers();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to add manager.');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = (managerId, managerName) => {
        Alert.alert(
            'Remove Manager',
            `Remove ${managerName} from your workshop? They will lose access.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove', style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/users/managers/${managerId}`);
                            setManagers(prev => prev.filter(m => m._id !== managerId));
                            toast.success('Manager removed.');
                        } catch (err) {
                            toast.error(err?.response?.data?.message || 'Failed to remove manager.');
                        }
                    },
                },
            ]
        );
    };

    const MAX = 5;
    const atCapacity = managers.length >= MAX;

    return (
        <View style={styles.flex}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Workshop Staff</Text>
                <View style={styles.shieldBtn}>
                    <Feather name="shield" size={20} color={Colors.primary} />
                </View>
            </View>

            <FlatList
                data={managers}
                keyExtractor={m => m._id}
                contentContainerStyle={styles.list}
                refreshing={loadingList}
                onRefresh={fetchManagers}
                ListHeaderComponent={(
                    <View>
                        {/* Access Control banner */}
                        <View style={styles.accessBanner}>
                            <View style={styles.bannerIconWrap}>
                                <Feather name="users" size={24} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.bannerLabel}>ACCESS CONTROL</Text>
                                <Text style={styles.bannerCount}>{managers.length} Active Manager{managers.length !== 1 ? 's' : ''}</Text>
                            </View>
                        </View>

                        {/* Section row */}
                        <View style={styles.sectionRow}>
                            <View>
                                <Text style={styles.sectionTitle}>Manage Staff</Text>
                                <Text style={styles.sectionSub}>Grant or revoke workshop data access</Text>
                            </View>
                            {!atCapacity && (
                                <TouchableOpacity
                                    style={styles.addBtn}
                                    onPress={() => setShowForm(v => !v)}
                                >
                                    <Feather name="user-plus" size={15} color={Colors.white} />
                                    <Text style={styles.addBtnText}>Add New</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Inline add form */}
                        {showForm && (
                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>New Manager Details</Text>
                                <InputField value={form.name} onChangeText={set('name')} placeholder="Full name" iconName="user" />
                                <InputField value={form.phone} onChangeText={set('phone')} placeholder="Phone number" keyboardType="phone-pad" autoCapitalize="none" iconName="phone" />
                                <InputField value={form.password} onChangeText={set('password')} placeholder="Set a password" secureTextEntry autoCapitalize="none" iconName="lock" />
                                <InputField value={form.city} onChangeText={set('city')} placeholder="City (optional)" iconName="map-pin" />
                                <PrimaryButton title="Add Manager" iconName="user-plus" onPress={handleSubmit} loading={adding} />
                            </View>
                        )}
                    </View>
                )}
                renderItem={({ item }) => (
                    <ManagerCard
                        manager={item}
                        onDelete={() => handleDelete(item._id, item.name)}
                    />
                )}
                ListFooterComponent={(
                    <View style={styles.capacityCard}>
                        <View style={styles.capacityIconWrap}>
                            <Feather name="plus" size={22} color={Colors.textMuted} />
                        </View>
                        <Text style={styles.capacityTitle}>Limited to {MAX} Managers per Workshop</Text>
                        <Text style={styles.capacitySub}>Upgrade your plan for more slots</Text>
                    </View>
                )}
                ListEmptyComponent={loadingList ? null : (
                    <View style={styles.emptyWrap}>
                        <Feather name="users" size={40} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>No managers added yet</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },

    // Top bar
    topBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surface, paddingHorizontal: Spacing.lg,
        paddingTop: Platform?.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 52,
        paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.separator,
        ...Shadow.sm,
    },
    backBtn: { marginRight: Spacing.sm },
    topTitle: { flex: 1, fontSize: Font.lg, fontWeight: '700', color: Colors.textPrimary },
    shieldBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
    },

    list: { padding: Spacing.lg, paddingBottom: 48 },

    // Access control banner
    accessBanner: {
        backgroundColor: '#FFF7ED', borderRadius: Radius.lg,
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        padding: Spacing.lg, marginBottom: Spacing.lg,
        borderWidth: 1, borderColor: '#FED7AA',
    },
    bannerIconWrap: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center',
    },
    bannerLabel: { fontSize: Font.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.2 },
    bannerCount: { fontSize: Font.xl, fontWeight: '800', color: Colors.textPrimary },

    // Section header
    sectionRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    sectionSub: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 2 },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: Colors.primary, borderRadius: Radius.full,
        paddingHorizontal: 14, paddingVertical: 9, ...Shadow.sm,
    },
    addBtnText: { color: Colors.white, fontWeight: '700', fontSize: Font.sm },

    // Form card
    formCard: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm,
    },
    formTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },

    // Manager card
    card: {
        backgroundColor: Colors.card, borderRadius: Radius.lg,
        flexDirection: 'row', alignItems: 'center',
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.cardBorder, ...Shadow.sm,
    },
    cardLeft: { position: 'relative', marginRight: Spacing.md },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: Font.md, fontWeight: '800', color: '#4338CA' },
    onlineDot: {
        position: 'absolute', bottom: 1, right: 1,
        width: 11, height: 11, borderRadius: 6,
        backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.white,
    },
    cardInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 5 },
    managerName: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    rolePill: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
    rolePillText: { fontSize: 11, fontWeight: '700' },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    phone: { fontSize: Font.sm, color: Colors.textSecondary },
    cardActions: { gap: Spacing.md, alignItems: 'center' },
    deleteBtn: { padding: 4 },
    moreBtn: { padding: 4 },

    // Capacity footer
    capacityCard: {
        borderRadius: Radius.lg, alignItems: 'center',
        padding: Spacing.xl, marginTop: Spacing.md,
        borderWidth: 1.5, borderColor: Colors.cardBorder,
        borderStyle: 'dashed', backgroundColor: Colors.bg,
    },
    capacityIconWrap: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.cardBorder,
        alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    },
    capacityTitle: { fontSize: Font.sm, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
    capacitySub: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

    emptyWrap: { alignItems: 'center', paddingTop: 40, gap: Spacing.md },
    emptyText: { fontSize: Font.sm, color: Colors.textMuted },
});
