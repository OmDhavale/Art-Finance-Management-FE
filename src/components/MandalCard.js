import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MandalCard({ mandal, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.iconBox}>
                <Text style={styles.icon}>🙏</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{mandal.ganpatiTitle}</Text>
                <Text style={styles.name} numberOfLines={1}>{mandal.mandalName}</Text>
                <Text style={styles.location} numberOfLines={1}>
                    {[mandal.area, mandal.city].filter(Boolean).join(', ') || 'Location not specified'}
                </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    iconBox: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
    },
    icon: { fontSize: 22 },
    info: { flex: 1 },
    title: { fontSize: 15, fontWeight: '700', color: '#333' },
    name: { fontSize: 13, color: '#666', marginTop: 2 },
    location: { fontSize: 12, color: '#aaa', marginTop: 2 },
    arrow: { fontSize: 22, color: '#ccc', marginLeft: 8 },
});
