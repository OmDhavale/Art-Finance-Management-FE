import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow, Radius, Spacing } from '../theme';

const { width } = Dimensions.get('window');
const BASE_BAR_HEIGHT = Platform.OS === 'ios' ? 65 : 70;
const HIGHLIGHT_HEIGHT = 52;

export default function BottomTab({ state, descriptors, navigation }) {
    const insets = useSafeAreaInsets();
    const bottomInset = insets.bottom;
    const barHeight = BASE_BAR_HEIGHT + bottomInset;

    // These are the main tabs we want to show in the UI
    const mainTabs = [
        { name: 'Dashboard', label: 'Home', iconName: 'home' },
        //{ name: 'SearchMandal', label: 'Search', iconName: 'search' },
        { name: 'BookMandal', label: 'Book', iconName: 'plus-circle' },
        { name: 'MyBookings', label: 'My All', iconName: 'book-open' },
        { name: 'WorkshopDetails', label: 'Workshop', iconName: 'briefcase' },
    ];

    const tabWidth = width / mainTabs.length;
    const translateX = useRef(new Animated.Value(0)).current;

    const activeVisualIndex = mainTabs.findIndex(t => {
        const rIndex = state.routes.findIndex(r => r.name === t.name);
        return rIndex === state.index;
    });

    useEffect(() => {
        if (activeVisualIndex !== -1) {
            Animated.spring(translateX, {
                toValue: activeVisualIndex * tabWidth,
                useNativeDriver: true,
                bounciness: 3,
            }).start();
        }
    }, [activeVisualIndex, tabWidth]);

    const highlightTop = (BASE_BAR_HEIGHT - HIGHLIGHT_HEIGHT) / 2;

    return (
        <View style={[styles.bar, { height: barHeight, paddingBottom: bottomInset }]}>
            {/* Sliding Background Highlight */}
            <Animated.View
                style={[
                    styles.slidingHighlight,
                    {
                        top: highlightTop,
                        height: HIGHLIGHT_HEIGHT,
                        width: tabWidth - Spacing.lg,
                        transform: [{ translateX: Animated.add(translateX, Spacing.lg / 2) }],
                    }
                ]}
            />

            {mainTabs.map((tab, index) => {
                const routeIndex = state.routes.findIndex(r => r.name === tab.name);
                if (routeIndex === -1) return null;

                const route = state.routes[routeIndex];
                const isActive = state.index === routeIndex;

                return (
                    <TabItem
                        key={tab.name}
                        tab={tab}
                        isActive={isActive}
                        onPress={() => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!isActive && !event.defaultPrevented) {
                                navigation.navigate({ name: route.name, merge: true });
                            }
                        }}
                    />
                );
            })}
        </View>
    );
}

function TabItem({ tab, isActive, onPress }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: isActive ? 1.2 : 1,
            friction: 4,
            useNativeDriver: true,
        }).start();
    }, [isActive]);

    return (
        <TouchableOpacity
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Feather
                    name={tab.iconName}
                    size={20}
                    color={isActive ? Colors.primary : Colors.textMuted}
                />
            </Animated.View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        ...Shadow.md,
        position: 'relative',
        alignItems: 'center',
    },
    slidingHighlight: {
        position: 'absolute',
        backgroundColor: Colors.primaryMuted,
        borderRadius: Radius.md,
        zIndex: 0,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1, gap: 1 },
    label: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.1 },
    labelActive: { color: Colors.primary, fontWeight: '800' },
});
