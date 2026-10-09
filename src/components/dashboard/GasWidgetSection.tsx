import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image } from 'react-native';
import { Droplet, ChevronRight, Flame, Sparkles, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../theme/typography';
import { PressableCard } from '../common/PressableCard';
import { TrendBadge } from '../common/TrendBadge';
import { SegmentedSlider } from '../common/SegmentedSlider';
import { DashboardFuelItem } from '../../services/gasService';
import { getCleanFuelDisplayTitle, getLogo } from '../../utils/helpers';

interface GasWidgetSectionProps {
    gasList: DashboardFuelItem[];
    isZone1: boolean;
    onToggleZone: () => void;
    fadeAnim: Animated.Value;
    onPressSeeAll: () => void;
    onPressItem: (gasItem: any) => void;
}

export const GasWidgetSection: React.FC<GasWidgetSectionProps> = ({
    gasList,
    isZone1,
    onToggleZone,
    onPressSeeAll,
    onPressItem,
}) => {
    const { colors, isDarkMode } = useTheme();
    const [featuredIndex, setFeaturedIndex] = useState(0);

    // Cross-fade animation specifically for rotating the featured card
    const cardFadeAnim = useRef(new Animated.Value(1)).current;
    const cardSlideAnim = useRef(new Animated.Value(0)).current;

    // Auto-rotate featured item across fuels and gas every 4.5 seconds
    useEffect(() => {
        if (!gasList || gasList.length <= 1) return;

        const interval = setInterval(() => {
            // Animate out
            Animated.parallel([
                Animated.timing(cardFadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
                Animated.timing(cardSlideAnim, { toValue: -10, duration: 220, useNativeDriver: true }),
            ]).start(() => {
                setFeaturedIndex(prev => (prev + 1) % gasList.length);
                cardSlideAnim.setValue(10);
                // Animate in
                Animated.parallel([
                    Animated.timing(cardFadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
                    Animated.timing(cardSlideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
                ]).start();
            });
        }, 4500);

        return () => clearInterval(interval);
    }, [gasList, cardFadeAnim, cardSlideAnim]);

    if (!gasList || gasList.length === 0) return null;

    const safeIdx = featuredIndex % gasList.length;
    const currentFeatured = gasList[safeIdx];
    const petrolimexLogo = getLogo('Petrolimex');

    const featuredPrice = isZone1 ? currentFeatured.price1 : currentFeatured.price2;
    const featuredTrend = isZone1 ? currentFeatured.trendValue1 : currentFeatured.trendValue2;

    const zoneOptions = [
        { label: 'Vùng 1' },
        { label: 'Vùng 2 (+2%)' },
    ];

    const handleSelectManual = (idx: number) => {
        if (idx !== safeIdx) {
            Animated.sequence([
                Animated.timing(cardFadeAnim, { toValue: 0.3, duration: 120, useNativeDriver: true }),
                Animated.timing(cardFadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
            ]).start();
            setFeaturedIndex(idx);
        }
    };

    return (
        <View style={styles.section}>
            {/* Header Row: Title & See All */}
            <View style={styles.sectionHeaderRow}>
                <View style={styles.titleRow}>
                    <View style={[styles.sectionIconBadge, { backgroundColor: `${colors.primary}18` }]}>
                        <Droplet size={16} color={colors.primary} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Xăng dầu & Gas</Text>
                </View>

                <TouchableOpacity onPress={onPressSeeAll} style={styles.seeAllBtn} activeOpacity={0.7}>
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>Chi tiết</Text>
                    <ChevronRight size={14} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Dedicated Row for Zone 1 vs Zone 2 Segmented Slider (No Overflow!) */}
            <View style={styles.sliderContainer}>
                <SegmentedSlider
                    options={zoneOptions}
                    selectedIndex={isZone1 ? 0 : 1}
                    onChange={(idx) => {
                        if ((idx === 0 && !isZone1) || (idx === 1 && isZone1)) {
                            onToggleZone();
                        }
                    }}
                    activeColor={isZone1 ? colors.primary : colors.secondary}
                    height={36}
                />
            </View>

            {/* HERO FEATURED CARD (Auto-alternates across Fuels and Gas) */}
            <PressableCard
                onPress={() => onPressItem(currentFeatured.rawItem)}
                style={[
                    styles.heroCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: isDarkMode ? `${currentFeatured.color}40` : `${currentFeatured.color}25`,
                    },
                ]}
            >
                {/* Watermark Logo */}
                {petrolimexLogo && (
                    <View style={styles.heroWatermark} pointerEvents="none">
                        <Image
                            source={{ uri: petrolimexLogo }}
                            style={{ width: 130, height: 130, opacity: 0.05 }}
                            resizeMode="contain"
                        />
                    </View>
                )}

                <View style={styles.heroTop}>
                    <View style={[styles.heroBadge, { backgroundColor: `${currentFeatured.color}15` }]}>
                        {currentFeatured.isGas ? (
                            <Flame size={12} color={currentFeatured.color} strokeWidth={2.5} />
                        ) : (
                            <Sparkles size={12} color={currentFeatured.color} strokeWidth={2.5} />
                        )}
                        <Text style={[styles.heroBadgeText, { color: currentFeatured.color }]}>
                            {currentFeatured.isGas ? 'TIÊU ĐIỂM GAS' : 'TIÊU ĐIỂM XĂNG DẦU'}
                        </Text>
                    </View>

                    {/* Pagination Indicator Dots */}
                    <View style={styles.dotsRow}>
                        {gasList.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: i === safeIdx ? currentFeatured.color : colors.border,
                                        width: i === safeIdx ? 14 : 5,
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Animated Rotating Content */}
                <Animated.View
                    style={{
                        opacity: cardFadeAnim,
                        transform: [{ translateY: cardSlideAnim }],
                    }}
                >
                    <Text style={[styles.heroTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {getCleanFuelDisplayTitle(currentFeatured.title)}
                    </Text>

                    <View style={styles.heroPriceRow}>
                        <View style={styles.priceWithUnit}>
                            <Text style={[styles.heroPriceValue, { color: colors.textPrimary }]}>
                                {featuredPrice}
                            </Text>
                            <Text style={[styles.heroPriceUnit, { color: colors.textSecondary }]}>
                                {currentFeatured.isGas ? 'đ/bình' : 'đ/lít'}
                            </Text>
                        </View>
                        <TrendBadge
                            value={featuredTrend}
                            size="md"
                        />
                    </View>

                    {/* Dual Zone Comparison Bar */}
                    <View style={[styles.compareBarWrapper, { backgroundColor: colors.surfaceSubtle }]}>
                        <View style={styles.compareItem}>
                            <Text style={[styles.compareLabel, { color: colors.textSecondary }]}>
                                {currentFeatured.isGas ? 'Bình 12KG' : 'Vùng 1'}
                            </Text>
                            <Text style={[styles.compareVal, { color: colors.textPrimary }]}>
                                {currentFeatured.price1} đ
                            </Text>
                        </View>
                        <ArrowRight size={13} color={colors.textSecondary} />
                        <View style={styles.compareItem}>
                            <Text style={[styles.compareLabel, { color: colors.textSecondary }]}>
                                {currentFeatured.isGas ? 'Bình 48KG' : 'Vùng 2 (+2%)'}
                            </Text>
                            <Text style={[styles.compareVal, { color: colors.secondary }]}>
                                {currentFeatured.price2} đ
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </PressableCard>

            {/* HORIZONTAL CAROUSEL (Tap any card to preview as Featured) */}
            <ScrollView
                horizontal
                nestedScrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContainer}
            >
                {gasList.map((gas, index) => {
                    const price = isZone1 ? gas.price1 : gas.price2;
                    const trendValue = isZone1 ? gas.trendValue1 : gas.trendValue2;
                    const cleanName = getCleanFuelDisplayTitle(gas.title);
                    const isSelected = index === safeIdx;

                    return (
                        <PressableCard
                            key={index}
                            onPress={() => handleSelectManual(index)}
                            style={[
                                styles.carouselCard,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: isSelected ? gas.color : colors.border,
                                    borderWidth: isSelected ? 1.5 : 1,
                                },
                            ]}
                        >
                            {/* Color Accent Indicator Strip */}
                            <View style={[styles.accentStrip, { backgroundColor: gas.color }]} />

                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBox, { backgroundColor: `${gas.color}15` }]}>
                                    {gas.isGas ? (
                                        <Flame size={14} color={gas.color} strokeWidth={2.2} />
                                    ) : (
                                        <Droplet size={14} color={gas.color} strokeWidth={2.5} />
                                    )}
                                </View>
                                <View style={[styles.tagZone, { backgroundColor: colors.surfaceSubtle }]}>
                                    <Text style={[styles.tagZoneText, { color: colors.textSecondary }]}>
                                        {gas.isGas ? (isZone1 ? '12KG' : '48KG') : (isZone1 ? 'V1' : 'V2')}
                                    </Text>
                                </View>
                            </View>

                            <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                                {cleanName}
                            </Text>

                            <View style={styles.priceContainer}>
                                <Text style={[styles.cardPrice, { color: colors.textPrimary }]} numberOfLines={1}>
                                    {price}
                                </Text>
                                <Text style={[styles.cardUnit, { color: colors.textSecondary }]}>
                                    {gas.isGas ? 'đ' : 'đ/l'}
                                </Text>
                            </View>

                            <View style={styles.cardFooter}>
                                <TrendBadge
                                    value={trendValue}
                                    size="sm"
                                />
                            </View>
                        </PressableCard>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionIconBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        letterSpacing: -0.3,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    seeAllText: {
        fontFamily: FONTS.semiBold,
        fontSize: 12,
    },
    sliderContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    heroCard: {
        marginHorizontal: 16,
        marginBottom: 14,
        borderRadius: 20,
        borderWidth: 1.2,
        padding: 16,
        overflow: 'hidden',
    },
    heroWatermark: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 10,
        zIndex: 0,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        zIndex: 1,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
    },
    heroBadgeText: {
        fontFamily: FONTS.bold,
        fontSize: 10,
        letterSpacing: 0.4,
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dot: {
        height: 5,
        borderRadius: 2.5,
    },
    heroTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: 18,
        letterSpacing: -0.4,
        marginBottom: 8,
        zIndex: 1,
    },
    heroPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 14,
        zIndex: 1,
    },
    priceWithUnit: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    heroPriceValue: {
        fontFamily: FONTS.extraBold,
        fontSize: 32,
        letterSpacing: -1,
    },
    heroPriceUnit: {
        fontFamily: FONTS.semiBold,
        fontSize: 14,
    },
    compareBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        zIndex: 1,
    },
    compareItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    compareLabel: {
        fontFamily: FONTS.medium,
        fontSize: 11,
    },
    compareVal: {
        fontFamily: FONTS.bold,
        fontSize: 12,
    },
    carouselContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    carouselCard: {
        width: 146,
        borderRadius: 16,
        padding: 12,
        overflow: 'hidden',
    },
    accentStrip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 2,
    },
    iconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagZone: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tagZoneText: {
        fontFamily: FONTS.bold,
        fontSize: 9,
    },
    cardTitle: {
        fontFamily: FONTS.bold,
        fontSize: 13,
        height: 36,
        lineHeight: 18,
        marginBottom: 6,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
        marginBottom: 8,
    },
    cardPrice: {
        fontFamily: FONTS.extraBold,
        fontSize: 16,
        letterSpacing: -0.3,
    },
    cardUnit: {
        fontFamily: FONTS.medium,
        fontSize: 10,
    },
    cardFooter: {
        alignItems: 'flex-start',
    },
});
