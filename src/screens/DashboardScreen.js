import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen({ navigation }) {
    const { user, logout } = useAuth();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.welcomeCard}>
                <Text style={styles.emoji}>🙏</Text>
                <Text style={styles.welcome}>Welcome back,</Text>
                <Text style={styles.name}>{user?.name || 'Vendor'}</Text>
                {user?.workshopName ? (
                    <Text style={styles.workshop}>{user.workshopName}</Text>
                ) : null}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('BookMandal')}
                >
                    <Text style={styles.actionIcon}>📋</Text>
                    <Text style={styles.actionText}>Book Mandal</Text>
                    <Text style={styles.actionSub}>Create a new mandal booking</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('SearchMandal')}
                >
                    <Text style={styles.actionIcon}>🔍</Text>
                    <Text style={styles.actionText}>Search Mandal</Text>
                    <Text style={styles.actionSub}>Find mandal & view history</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF8F5' },
    welcomeCard: {
        backgroundColor: '#FF6B35',
        margin: 20,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#FF6B35',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    emoji: { fontSize: 40, marginBottom: 8 },
    welcome: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    name: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
    workshop: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },
    actions: { paddingHorizontal: 20, gap: 14 },
    actionButton: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    actionIcon: { fontSize: 32, marginBottom: 6 },
    actionText: { fontSize: 18, fontWeight: '700', color: '#333' },
    actionSub: { fontSize: 13, color: '#888', marginTop: 2 },
    logoutButton: {
        margin: 20,
        borderWidth: 1.5,
        borderColor: '#FF6B35',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    logoutText: { color: '#FF6B35', fontWeight: '700', fontSize: 15 },
});
