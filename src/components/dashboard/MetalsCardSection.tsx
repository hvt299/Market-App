import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { Coins, ChevronRight, ArrowUpDown, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../theme/typography';
import { PressableCard } from '../common/PressableCard';
import { SegmentedSlider } from '../common/SegmentedSlider';
import { MetalDashboardGroup } from '../../services/metalService';
import { getLogo } from '../../utils/helpers';

interface MetalsCardSectionProps {
    activeMetal: 'gold' | 'silver';
    onChangeTab: (tab: 'gold' | 'silver') => void;
    currentData: MetalDashboardGroup;
    allGoldBrands?: MetalDashboardGroup[];
    allSilverGroups?: MetalDashboardGroup[];
    onSelectBrand?: (index: number) => void;
    currentBrandIndex?: number;
    fadeAnim: Animated.Value;
    onPressSeeAll: () => void;
}

export const MetalsCardSection: React.FC<MetalsCardSectionProps> = ({
    activeMetal,
    onChangeTab,
    currentData,
    allGoldBrands = [],
    allSilverGroups = [],
    onSelectBrand,
    currentBrandIndex = 0,
    fadeAnim,
    onPressSeeAll,
}) => {
    const { colors, isDarkMode } = useTheme();

    if (!currentData) return null;

    const brandName = currentData.brand || (activeMetal === 'silver' ? 'Bạc Phú Quý' : 'SJC');
    const logoUrl = getLogo(activeMetal === 'silver' ? 'Phú Quý' : (currentData.brandId === 'bac-phu-quy' ? 'Phú Quý' : brandName));

    // Calculate spread (Chênh lệch Mua - Bán) if both prices are numeric
    const calculateSpread = (buyStr: string, sellStr: string, unit: string) => {
        if (!buyStr || !sellStr || buyStr === '-' || sellStr === '-' || sellStr === '_') return null;
        const buy = parseFloat(buyStr.replace(/,/g, ''));
        const sell = parseFloat(sellStr.replace(/,/g, ''));
        if (!isNaN(buy) && !isNaN(sell) && sell > buy) {
            const spread = (sell - buy).toLocaleString('vi-VN');
            return `Chênh lệch: +${spread} ${unit}`;
        }
        return null;
    };

    const spread1 = calculateSpread(currentData.item1.buy, currentData.item1.sell, currentData.item1.unit);
    const spread2 = calculateSpread(currentData.item2.buy, currentData.item2.sell, currentData.item2.unit);

    const metalTabs = [
        { label: 'Vàng trong nước' },
        { label: 'Bạc Phú Quý' },
    ];

    const currentGroups = activeMetal === 'gold' ? allGoldBrands : allSilverGroups;

    return (
        <View style={styles.section}>
            {/* Header */}
            <View style={styles.sectionHeader}>
                <View style={styles.titleRow}>
                    <View style={[styles.sectionIconBadge, { backgroundColor: activeMetal === 'gold' ? `${colors.secondary}18` : `${colors.silver}18` }]}>
                        <Coins size={16} color={activeMetal === 'gold' ? colors.secondary : colors.silver} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Kim loại quý</Text>
                </View>

                <TouchableOpacity onPress={onPressSeeAll} style={styles.seeAllBtn} activeOpacity={0.7}>
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>Bảng giá</Text>
                    <ChevronRight size={14} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Mathematically Accurate Sliding Tab Switcher */}
            <View style={styles.tabContainer}>
                <SegmentedSlider
                    options={metalTabs}
                    selectedIndex={activeMetal === 'gold' ? 0 : 1}
                    onChange={(idx) => onChangeTab(idx === 0 ? 'gold' : 'silver')}
                    activeColor={activeMetal === 'gold' ? colors.secondary : colors.silver}
                    height={36}
                />
            </View>

            {/* Sub-groups / Brands Quick Pills */}
            {currentGroups.length > 1 && (
                <View style={styles.brandsRow}>
                    {currentGroups.map((b, idx) => {
                        const isActive = idx === currentBrandIndex;
                        const pillLabel = activeMetal === 'gold' ? b.brand : b.region;
                        const activeColor = activeMetal === 'gold' ? colors.secondary : colors.silver;

                        return (
                            <TouchableOpacity
                                key={`${b.brandId}-${idx}`}
                                onPress={() => onSelectBrand && onSelectBrand(idx)}
                                activeOpacity={0.7}
                                style={[
                                    styles.brandChip,
                                    {
                                        backgroundColor: isActive ? `${activeColor}20` : colors.surfaceSubtle,
                                        borderColor: isActive ? activeColor : colors.border,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.brandChipText,
                                        { color: isActive ? activeColor : colors.textSecondary },
                                    ]}
                                >
                                    {pillLabel}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* BULLION VAULT CARD */}
            <PressableCard
                onPress={onPressSeeAll}
                style={[
                    styles.vaultCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: isDarkMode
                            ? (activeMetal === 'gold' ? `${colors.secondary}40` : `${colors.silver}40`)
                            : (activeMetal === 'gold' ? `${colors.secondary}25` : `${colors.silver}25`),
                    },
                ]}
            >
                {/* Watermark Logo */}
                {logoUrl && (
                    <View style={styles.vaultWatermark} pointerEvents="none">
                        <Image
                            source={{ uri: logoUrl }}
                            style={{ width: 140, height: 140, opacity: 0.05 }}
                            resizeMode="contain"
                        />
                    </View>
                )}

                {/* Card Top: Brand & Region */}
                <View style={styles.vaultHeader}>
                    <View style={styles.vaultBrandRow}>
                        <View style={[styles.vaultIconBadge, { backgroundColor: activeMetal === 'gold' ? `${colors.secondary}20` : `${colors.silver}20` }]}>
                            <ShieldCheck size={16} color={activeMetal === 'gold' ? colors.secondary : colors.silver} strokeWidth={2.5} />
                        </View>
                        <View>
                            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>{brandName}</Text>
                            <Text style={[styles.regionSubtitle, { color: colors.textSecondary }]}>{currentData.region}</Text>
                        </View>
                    </View>

                    <View style={[styles.liveStatusTag, { backgroundColor: `${colors.upColor}15` }]}>
                        <View style={[styles.miniDot, { backgroundColor: colors.upColor }]} />
                        <Text style={[styles.liveStatusText, { color: colors.upColor }]}>Trực tiếp</Text>
                    </View>
                </View>

                {/* PRODUCT 1 */}
                <Animated.View style={[styles.productBlock, { opacity: fadeAnim }]}>
                    <View style={styles.productTitleRow}>
                        <Text style={[styles.productName, { color: colors.textPrimary }]}>
                            {currentData.item1.title}
                        </Text>
                        {spread1 && (
                            <View style={[styles.spreadPill, { backgroundColor: colors.surfaceSubtle }]}>
                                <ArrowUpDown size={10} color={colors.textSecondary} />
                                <Text style={[styles.spreadText, { color: colors.textSecondary }]}>{spread1}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.rateGrid}>
                        <View style={[styles.rateBox, { backgroundColor: colors.surfaceSubtle }]}>
                            <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>MUA VÀO</Text>
                            <View style={styles.rateValueRow}>
                                <Text style={[styles.rateValue, { color: colors.downColor }]}>
                                    {currentData.item1.buy}
                                </Text>
                                <Text style={[styles.rateUnit, { color: colors.textSecondary }]}>{currentData.item1.unit}</Text>
                            </View>
                        </View>

                        <View style={[styles.rateBox, { backgroundColor: colors.surfaceSubtle }]}>
                            <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>BÁN RA</Text>
                            <View style={styles.rateValueRow}>
                                <Text style={[styles.rateValue, { color: colors.upColor }]}>
                                    {currentData.item1.sell}
                                </Text>
                                <Text style={[styles.rateUnit, { color: colors.textSecondary }]}>{currentData.item1.unit}</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* DIVIDER */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* PRODUCT 2 */}
                <Animated.View style={[styles.productBlock, { opacity: fadeAnim }]}>
                    <View style={styles.productTitleRow}>
                        <Text style={[styles.productName, { color: colors.textPrimary }]}>
                            {currentData.item2.title}
                        </Text>
                        {spread2 && (
                            <View style={[styles.spreadPill, { backgroundColor: colors.surfaceSubtle }]}>
                                <ArrowUpDown size={10} color={colors.textSecondary} />
                                <Text style={[styles.spreadText, { color: colors.textSecondary }]}>{spread2}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.rateGrid}>
                        <View style={[styles.rateBox, { backgroundColor: colors.surfaceSubtle }]}>
                            <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>MUA VÀO</Text>
                            <View style={styles.rateValueRow}>
                                <Text style={[styles.rateValue, { color: colors.downColor }]}>
                                    {currentData.item2.buy}
                                </Text>
                                <Text style={[styles.rateUnit, { color: colors.textSecondary }]}>{currentData.item2.unit}</Text>
                            </View>
                        </View>

                        <View style={[styles.rateBox, { backgroundColor: colors.surfaceSubtle }]}>
                            <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>BÁN RA</Text>
                            <View style={styles.rateValueRow}>
                                <Text style={[styles.rateValue, { color: colors.upColor }]}>
                                    {currentData.item2.sell}
                                </Text>
                                <Text style={[styles.rateUnit, { color: colors.textSecondary }]}>{currentData.item2.unit}</Text>
                            </View>
                        </View>
                    </View>
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
    tabContainer: {
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    brandsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 12,
    },
    brandChip: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
    },
    brandChipText: {
        fontFamily: FONTS.bold,
        fontSize: 11,
    },
    vaultCard: {
        marginHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.2,
        padding: 16,
        overflow: 'hidden',
    },
    vaultWatermark: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    vaultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        zIndex: 1,
    },
    vaultBrandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    vaultIconBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: 16,
        letterSpacing: -0.3,
    },
    regionSubtitle: {
        fontFamily: FONTS.medium,
        fontSize: 11,
    },
    liveStatusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    miniDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    liveStatusText: {
        fontFamily: FONTS.bold,
        fontSize: 10,
    },
    productBlock: {
        zIndex: 1,
    },
    productTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    productName: {
        fontFamily: FONTS.bold,
        fontSize: 13,
    },
    spreadPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    spreadText: {
        fontFamily: FONTS.medium,
        fontSize: 10,
    },
    rateGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    rateBox: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    rateLabel: {
        fontFamily: FONTS.bold,
        fontSize: 10,
        marginBottom: 4,
        letterSpacing: 0.4,
    },
    rateValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    rateValue: {
        fontFamily: FONTS.extraBold,
        fontSize: 20,
        letterSpacing: -0.5,
    },
    rateUnit: {
        fontFamily: FONTS.medium,
        fontSize: 10,
    },
    divider: {
        height: 1,
        marginVertical: 12,
        zIndex: 1,
    },
});
