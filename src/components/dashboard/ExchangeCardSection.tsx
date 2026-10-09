import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Banknote, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../theme/typography';
import { PressableCard } from '../common/PressableCard';
import { SegmentedSlider } from '../common/SegmentedSlider';
import { DashboardExchangeRate, formatVNRate } from '../../services/exchangeService';
import { getLogo } from '../../utils/helpers';

interface ExchangeCardSectionProps {
    rates: DashboardExchangeRate[];
    exchangeStateIndex: number;
    onChangeModeIndex: (index: number) => void;
    fadeAnim: Animated.Value;
    onPressSeeAll: () => void;
}

const MODES = [
    { label: 'Mua TM' },
    { label: 'Bán TM' },
    { label: 'Mua CK' },
];

export const ExchangeCardSection: React.FC<ExchangeCardSectionProps> = ({
    rates,
    exchangeStateIndex,
    onChangeModeIndex,
    fadeAnim,
    onPressSeeAll,
}) => {
    const { colors, isDarkMode } = useTheme();

    if (!rates || rates.length === 0) return null;

    return (
        <View style={styles.section}>
            {/* Header */}
            <View style={styles.sectionHeader}>
                <View style={styles.titleRow}>
                    <View style={[styles.sectionIconBadge, { backgroundColor: `${colors.accent}18` }]}>
                        <Banknote size={16} color={colors.accent} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tỷ giá ngoại tệ (VCB)</Text>
                </View>

                <TouchableOpacity onPress={onPressSeeAll} style={styles.seeAllBtn} activeOpacity={0.7}>
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>Bảng tỷ giá</Text>
                    <ChevronRight size={14} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Mathematically Accurate Sliding Mode Segmented Selector */}
            <View style={styles.modeTrackWrapper}>
                <SegmentedSlider
                    options={MODES}
                    selectedIndex={exchangeStateIndex}
                    onChange={onChangeModeIndex}
                    activeColor={colors.primary}
                    height={36}
                />
            </View>

            {/* CURRENCY MATRIX CARD */}
            <PressableCard
                onPress={onPressSeeAll}
                style={[
                    styles.matrixCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: isDarkMode ? `${colors.accent}35` : `${colors.accent}20`,
                    },
                ]}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {rates.slice(0, 5).map((rate, index) => {
                        const cleanCode = rate.code.split('(')[0].trim();
                        const countryCode = cleanCode.length >= 2 ? cleanCode.substring(0, 2) : 'UN';
                        const flagUrl = getLogo(cleanCode) || `https://flagsapi.com/${countryCode}/flat/64.png`;
                        const isLast = index === Math.min(4, rates.length - 1);

                        let currentPrice = '';
                        let priceColor = colors.textPrimary;
                        let modeTag = '';

                        if (exchangeStateIndex === 0) {
                            currentPrice = formatVNRate(rate.buyCash);
                            priceColor = colors.downColor;
                            modeTag = 'Mua TM';
                        } else if (exchangeStateIndex === 1) {
                            currentPrice = formatVNRate(rate.sellCash);
                            priceColor = colors.upColor;
                            modeTag = 'Bán TM';
                        } else {
                            currentPrice = formatVNRate(rate.buyTransfer);
                            priceColor = colors.downColor;
                            modeTag = 'Mua CK';
                        }

                        return (
                            <View key={rate.code}>
                                <View style={styles.rateRow}>
                                    {/* Left: Flag Avatar & Currency Info */}
                                    <View style={styles.currencyInfoCol}>
                                        <View style={[styles.flagWrapper, { backgroundColor: colors.surfaceSubtle }]}>
                                            <Image source={{ uri: flagUrl }} style={styles.flagImage} resizeMode="cover" />
                                        </View>
                                        <View>
                                            <View style={styles.codeRow}>
                                                <Text style={[styles.currencyCode, { color: colors.textPrimary }]}>
                                                    {rate.code}
                                                </Text>
                                                <Text style={[styles.currencyPair, { color: colors.textSecondary }]}>/VND</Text>
                                            </View>
                                            <Text style={[styles.currencyName, { color: colors.textSecondary }]} numberOfLines={1}>
                                                {rate.name}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Right: Exchange Rate Value & Tag */}
                                    <View style={styles.priceCol}>
                                        <Text style={[styles.rateValueText, { color: priceColor }]}>
                                            {currentPrice}
                                        </Text>
                                        <View style={[styles.modeMiniTag, { backgroundColor: `${priceColor}15` }]}>
                                            <Text style={[styles.modeMiniText, { color: priceColor }]}>{modeTag}</Text>
                                        </View>
                                    </View>
                                </View>

                                {!isLast && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                            </View>
                        );
                    })}
                </Animated.View>
            </PressableCard>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 12,
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
    modeTrackWrapper: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    matrixCard: {
        marginHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.2,
        padding: 16,
    },
    rateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    currencyInfoCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    flagWrapper: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    flagImage: {
        width: 26,
        height: 26,
        borderRadius: 13,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currencyCode: {
        fontFamily: FONTS.extraBold,
        fontSize: 15,
        letterSpacing: -0.2,
    },
    currencyPair: {
        fontFamily: FONTS.medium,
        fontSize: 11,
    },
    currencyName: {
        fontFamily: FONTS.medium,
        fontSize: 11,
        maxWidth: 120,
    },
    priceCol: {
        alignItems: 'flex-end',
    },
    rateValueText: {
        fontFamily: FONTS.extraBold,
        fontSize: 15,
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    modeMiniTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    modeMiniText: {
        fontFamily: FONTS.bold,
        fontSize: 9,
    },
    divider: {
        height: 1,
        marginVertical: 4,
    },
});
