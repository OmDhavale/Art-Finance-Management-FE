import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import api from '../api/api';
import MandalCard from '../components/MandalCard';

export default function MandalSearchScreen({ navigation }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) {
            Alert.alert('Error', 'Please enter a search term.');
            return;
        }
        setLoading(true);
        setSearched(true);
        try {
            const res = await api.get(`/mandals/search?q=${encodeURIComponent(query.trim())}`);
            setResults(res.data.data || []);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Search failed.';
            Alert.alert('Error', msg);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container} importantForAccessibility="yes">
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.input}
                    placeholder="Search by title, name, or area..."
                    placeholderTextColor="#aaa"
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    accessibilityLabel="Search mandals"
                />
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearch}
                    accessible={true}
                    accessibilityLabel="Search"
                    accessibilityRole="button"
                >
                    <Text style={styles.searchButtonText}>🔍</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <MandalCard
                            mandal={item}
                            onPress={() => navigation.navigate('MandalDetails', { mandalId: item._id })}
                        />
                    )}
                    ListEmptyComponent={
                        searched ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyIcon}>🙏</Text>
                                <Text style={styles.emptyText}>No mandals found</Text>
                            </View>
                        ) : (
                            <View style={styles.hint}>
                                <Text style={styles.hintText}>Search mandals by Ganpati title, mandal name, or area</Text>
                            </View>
                        )
                    }
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF8F5' },
    searchBar: { flexDirection: 'row', padding: 16, gap: 10 },
    input: {
        flex: 1, borderWidth: 1, borderColor: '#E0E0E0',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: '#333', backgroundColor: '#fff',
    },
    searchButton: {
        backgroundColor: '#FF6B35', borderRadius: 12,
        paddingHorizontal: 16, justifyContent: 'center',
    },
    searchButtonText: { fontSize: 20 },
    list: { paddingHorizontal: 16, paddingBottom: 20 },
    loader: { marginTop: 40 },
    empty: { marginTop: 60, alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 8 },
    emptyText: { fontSize: 16, color: '#888' },
    hint: { marginTop: 60, alignItems: 'center', paddingHorizontal: 40 },
    hintText: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 22 },
});
