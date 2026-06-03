import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Keep track of the last focused index globally to determine direction
let lastIndex = 0;

/**
 * A wrapper component that provides a smooth "sliding window" transition.
 * Screens slide in from the right if moving forward, and from the left if moving back.
 */
export default function AnimatedWrapper({ children, index = 0, style }) {
    const isFocused = useIsFocused();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Initial position depends on the direction of movement
    // We can't determine direction perfectly without the previous state, 
    // but we can guess based on comparing index with lastIndex.
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isFocused) {
            const direction = index >= lastIndex ? 1 : -1;
            const startPos = direction * 50; // Slide from 50px away

            // Set initial position for the entering screen
            slideAnim.setValue(startPos);
            fadeAnim.setValue(0);

            // Animate in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            // Update the global lastIndex tracker
            lastIndex = index;
        } else {
            // Fade out slightly when losing focus
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isFocused, index]);

    return (
        <Animated.View
            style={[
                styles.container,
                style,
                {
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
