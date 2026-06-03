import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Font, Spacing, Radius, Shadow } from '../theme';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Check Mandal Payment History',
        description: 'See past dues and avoid risky Mandals before booking your next investment.',
        Graphic: () => (
            <View style={styles.graphicContainer}>
                {/* Background circle blob */}
                <View style={[styles.blob, { backgroundColor: '#F0F7FF', width: 230, height: 230, left: 20, top: 20 }]} />

                {/* Journal Pill at Top Left */}
                <View style={[styles.mockCard, { position: 'absolute', top: 20, left: -10, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Feather name="book-open" size={14} color="#F97316" />
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#6B7280', letterSpacing: 1 }}>JOURNAL</Text>
                </View>

                {/* Center History Icon box in rounded white box */}
                <View style={[styles.mockCard, { width: 110, height: 110, borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }]}>
                    <Feather name="clock" size={42} color="#0891B2" />
                </View>

                {/* Risk Score overlapping box - now moved closer to center avoid title overlap */}
                <View style={[styles.mockCard, { position: 'absolute', top: 130, right: -10, backgroundColor: '#0B7A8B', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14 }]}>
                    <Text style={{ fontSize: 8, color: '#A5F3FC', fontWeight: '800', marginBottom: 2, letterSpacing: 1 }}>RISK SCORE</Text>
                    <Text style={{ fontSize: Font.lg, color: Colors.white, fontWeight: '700' }}>Low</Text>
                    {/* Tiny dots underneath Low */}
                    <View style={{ flexDirection: 'row', gap: 3, marginTop: 6 }}>
                        <View style={{ width: 10, height: 2, backgroundColor: Colors.white, borderRadius: 1 }} />
                        <View style={{ width: 10, height: 2, backgroundColor: Colors.white, borderRadius: 1, opacity: 0.3 }} />
                        <View style={{ width: 10, height: 2, backgroundColor: Colors.white, borderRadius: 1, opacity: 0.3 }} />
                    </View>
                </View>

                {/* Bottom verified badge - now placed absolute bottom relative to container */}
                <View style={{ position: 'absolute', bottom: -5, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0FDF4', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DCFCE7', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
                    <Feather name="shield" size={16} color="#16A34A" />
                    <View>
                        <Text style={{ fontSize: 8, fontWeight: '800', color: '#16A34A', letterSpacing: 0.5 }}>FINANCIAL SAFETY</Text>
                        <Text style={{ fontSize: 9, color: '#4B5563' }}>Data verified by banking partners.</Text>
                    </View>
                </View>
            </View>
        ),
    },
    {
        id: '2',
        title: 'Know Which Mandals Pay On Time',
        description: 'Color grades help you identify reliable Mandals instantly',
        Graphic: () => (
            <View style={styles.graphicContainer}>
                <View style={[styles.mockCard, { width: '100%', padding: Spacing.lg, gap: Spacing.md }]}>
                    {[
                        { grade: 'O', label: 'Over-payment', sub: 'Mandal has paid extra across accounts.', color: '#33ff00e7' },
                        { grade: 'A+', label: 'Fully Paid', sub: 'Exceptional reliability. Zero outstanding.', color: '#22C55E' },
                        { grade: 'B', label: 'Small Pending', sub: 'High probability of settlement.', color: '#FACC15' },
                        { grade: 'C', label: 'Medium Pending', sub: 'Caution advised for new transactions.', color: '#F97316' },
                        { grade: 'D', label: 'High Pending', sub: 'Direct follow-up required.', color: '#EF4444' },
                    ].map((item, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: item.color + '20', justifyContent: 'center', alignItems: 'center' }}>
                                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: item.color }} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: Font.sm, fontWeight: '700', color: Colors.textPrimary }}>{item.label}</Text>
                                    <Text style={{ fontSize: 9, fontWeight: '800', color: item.color }}>GRADE {item.grade}</Text>
                                </View>
                                <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 2 }}>{item.sub}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        ),
    },
    {
        id: '3',
        title: 'Never Miss Pending Payments',
        description: 'Know exactly how much each Mandal has paid and what is pending in real-time.',
        Graphic: () => (
            <View style={styles.graphicContainer}>
                <View style={[styles.blob, { backgroundColor: '#FFEDD5', width: 200, height: 200, right: 30, top: 0 }]} />
                <View style={[styles.mockCard, { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0F766E', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20 }]}>
                    <Feather name="bell" size={24} color={Colors.white} />
                </View>

                <View style={[styles.mockCard, { width: '100%', flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm }]}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' }}>
                        <Feather name="user" size={16} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: Colors.textMuted }}>ADC MITRA MANDAL</Text>
                        <Text style={{ fontSize: Font.md, fontWeight: '700', color: '#0F766E' }}>₹12,400 Pending</Text>
                    </View>
                    <Feather name="alert-circle" size={16} color="#EF4444" />
                </View>

                <View style={[styles.mockCard, { width: '100%', flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm, marginTop: Spacing.md }]}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center' }}>
                        <Feather name="user" size={16} color="#EA580C" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: Colors.textMuted }}>XYZ KRIDA MANDAL</Text>
                        <Text style={{ fontSize: Font.md, fontWeight: '700', color: '#0F766E' }}>₹8,500 Pending</Text>
                    </View>
                    <Feather name="alert-circle" size={16} color="#EF4444" />
                </View>
            </View>
        ),
    },
    {
        id: '4',
        title: 'Book Your Next Mandal in Seconds',
        description: 'Fill in the booking details, murti size, and price to secure your order effortlessly.',
        Graphic: () => (
            <View style={styles.graphicContainer}>
                <View style={[styles.mockCard, { width: '100%', padding: Spacing.lg }]}>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.md }}>
                        <View style={{ width: 30, height: 20, backgroundColor: '#F3F4F6', borderRadius: 4 }} />
                        <View style={{ width: 30, height: 20, backgroundColor: Colors.primary, borderRadius: 4 }} />
                        <View style={{ width: 30, height: 20, backgroundColor: '#F3F4F6', borderRadius: 4 }} />
                    </View>
                    <View style={{ width: '100%', height: 36, backgroundColor: '#F9FAFB', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.separator, marginBottom: 12 }} />
                    <View style={{ width: '100%', height: 36, backgroundColor: '#F9FAFB', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.separator, marginBottom: 12 }} />
                    <View style={{ width: '100%', height: 36, backgroundColor: '#F9FAFB', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.separator, marginBottom: Spacing.lg }} />
                    <View style={{ width: '100%', height: 44, backgroundColor: '#FFEDD5', borderRadius: Radius.sm }} />
                </View>
            </View>
        ),
    }
];

export default function OnboardingScreen({ onFinish, navigation }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    const finishFlow = () => {
        if (onFinish) {
            onFinish();
        } else if (navigation) {
            navigation.goBack();
        }
    };

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            finishFlow();
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            flatListRef.current.scrollToIndex({ index: currentIndex - 1 });
        } else {
            finishFlow();
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Top Navigation */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0 : 1 }}>
                    <Feather name="arrow-left" size={24} color="#0F766E" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => finishFlow()}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            {/* Carousel */}
            <FlatList
                ref={flatListRef}
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                keyExtractor={item => item.id}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                renderItem={({ item }) => (
                    <View style={{ width, alignItems: 'center', paddingHorizontal: Spacing.xl }}>
                        <View style={{ height: height * 0.45, width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                            <item.Graphic />
                        </View>
                        <View style={{ marginTop: 40, alignItems: 'center' }}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
                    </View>
                )}
            />

            {/* Bottom Controls */}
            <View style={styles.footer}>
                {/* Dots */}
                <View style={styles.dotsContainer}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: currentIndex === index ? Colors.primary : '#E5E7EB',
                                    width: currentIndex === index ? 24 : 8
                                }
                            ]}
                        />
                    ))}
                </View>

                {/* Right Button */}
                <TouchableOpacity activeOpacity={0.8} style={styles.btn} onPress={handleNext}>
                    <Text style={styles.btnText}>
                        {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                    <Feather name="arrow-right" size={18} color={Colors.white} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.white, paddingTop: Platform.OS === 'android' ? 40 : 0 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
    skipText: { fontSize: Font.sm, fontWeight: '700', color: '#0F766E' },

    title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.md, lineHeight: 32 },
    description: { fontSize: Font.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingBottom: 40, paddingTop: 20 },
    dotsContainer: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    dot: { height: 8, borderRadius: 4 },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.full, ...Shadow.md },
    btnText: { color: Colors.white, fontWeight: '700', fontSize: Font.md },

    graphicContainer: { width: 280, height: 280, justifyContent: 'center', alignItems: 'center' },
    mockCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, ...Shadow.lg, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10, padding: 10 },
    blob: { position: 'absolute', borderRadius: 200 }
});
