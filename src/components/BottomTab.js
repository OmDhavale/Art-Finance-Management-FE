import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Shadow } from '../theme';

export default function BottomTab({ state, descriptors, navigation }) {
    // These are the main tabs we want to show in the UI
    const mainTabs = [
        { name: 'Dashboard', label: 'Home', iconName: 'home' },
        { name: 'SearchMandal', label: 'Search Mandal', iconName: 'search' },
        { name: 'BookMandal', label: 'Book New', iconName: 'plus-circle' },
        { name: 'MyBookings', label: 'My Bookings', iconName: 'book-open' },
    ];

    return (
        <View style={styles.bar}>
            {mainTabs.map((tab) => {
                // Find the index of this route in the actual navigator state
                const routeIndex = state.routes.findIndex(r => r.name === tab.name);
                if (routeIndex === -1) return null;

                const route = state.routes[routeIndex];
                const isActive = state.index === routeIndex;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isActive && !event.defaultPrevented) {
                        navigation.navigate({ name: route.name, merge: true });
                    }
                };

                return (
                    <TouchableOpacity
                        key={tab.name}
                        style={styles.tab}
                        onPress={onPress}
                        activeOpacity={0.7}
                    >
                        <Feather
                            name={tab.iconName}
                            size={22}
                            color={isActive ? Colors.primary : Colors.textMuted}
                        />
                        <Text style={[styles.label, isActive && styles.labelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.separator,
        paddingBottom: 20,
        paddingTop: 10,
        ...Shadow.sm,
    },
    tab: { flex: 1, alignItems: 'center', gap: 3 },
    label: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
    labelActive: { color: Colors.primary, fontWeight: '700' },
});
