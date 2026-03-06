import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, StatusBar,
} from 'react-native';
import api from '../api/api';
import ScreenHeader from '../components/ScreenHeader';
import InputField from '../components/InputField';
import { Colors, Font, Radius, Spacing, gradeConfig } from '../theme';

export default function MandalSearchScreen({ navigation }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const res = await api.get(`/mandals/search?q=${encodeURIComponent(query.trim())}`);
            setResults(res.data.data || []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.flex} importantForAccessibility="yes">
            <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
            <ScreenHeader title="Search Mandal" onBack={() => navigation.goBack()} />
            <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                    <InputField
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search by title, name, or area..."
                        style={styles.searchInput}
                    />
                </View>
                <TouchableOpacity
                    style={styles.searchBtn}
                    onPress={handleSearch}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Search"
                >
                    {loading
                        ? <ActivityIndicator color={Colors.bg} size="small" />
                        : <Text style={styles.searchBtnText}>Search</Text>
                    }
                </TouchableOpacity>
            </View>

            <FlatList
                data={results}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>
                            {searched ? 'No mandals found.' : 'Search mandals by Ganpati title, mandal name, or area'}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const cfg = item.latestGrade ? gradeConfig[item.latestGrade] : null;
                    return (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => navigation.navigate('MandalDetails', { mandalId: item._id })}
                            activeOpacity={0.75}
                        >
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>{item.ganpatiTitle}</Text>
                                <Text style={styles.cardSub}>{item.mandalName}</Text>
                                <Text style={styles.cardLoc}>
                                    {[item.area, item.city].filter(Boolean).join(', ') || 'Location not specified'}
                                </Text>
                            </View>
                            <View style={styles.cardRight}>
                                {cfg && (
                                    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
                                        <Text style={[styles.pillText, { color: cfg.color }]}>{cfg.label}</Text>
                                    </View>
                                )}
                                <Text style={styles.arrow}>›</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    searchRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: 10, alignItems: 'flex-end' },
    searchInputWrap: { flex: 1 },
    searchInput: { marginBottom: 0 },
    searchBtn: {
        backgroundColor: Colors.accent, borderRadius: Radius.sm,
        paddingVertical: 13, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center',
    },
    searchBtnText: { color: Colors.bg, fontWeight: '700', fontSize: Font.sm },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 24 },
    empty: { marginTop: 48, alignItems: 'center', paddingHorizontal: Spacing.xl },
    emptyText: { color: Colors.textMuted, fontSize: Font.sm, textAlign: 'center', lineHeight: 22 },
    card: {
        backgroundColor: Colors.card, borderRadius: Radius.md,
        padding: Spacing.lg, marginBottom: Spacing.sm,
        borderWidth: 1, borderColor: Colors.cardBorder,
        flexDirection: 'row', alignItems: 'center',
    },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: Font.md, fontWeight: '700', color: Colors.textPrimary },
    cardSub: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 2 },
    cardLoc: { fontSize: Font.xs, color: Colors.textMuted, marginTop: 2 },
    cardRight: { alignItems: 'flex-end', gap: 6, marginLeft: Spacing.sm },
    pill: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
    pillText: { fontSize: Font.xs, fontWeight: '700' },
    arrow: { fontSize: 22, color: Colors.textMuted },
});
