import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Droplet, Flame } from 'lucide-react-native';
import { formatCurrency, getFuelColor, getLogo, getCleanFuelDisplayTitle } from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/typography';
import { TrendBadge } from './common/TrendBadge';

interface GasItemCardProps {
    item: any;
    providerId: string;
    onPress: () => void;
}

export const GasItemCard: React.FC<GasItemCardProps> = ({ item, providerId, onPress }) => {
    const { colors, isDarkMode } = useTheme();
    const logoUrl = getLogo(providerId);

    const isPvoil = providerId.toLowerCase() === 'pvoil';
    const displayTitle = getCleanFuelDisplayTitle(item.title);
    const isGas = !!item.isGas;

    const fuelColor = getFuelColor(item.title, colors.primary);

    const gasRegion = isGas
        ? (item.cleanTitle
            ? item.cleanTitle.replace(/^Gas\s*[•\-]\s*/i, '').replace(/^Gas\s+/i, '')
            : displayTitle.replace(/^Gas\s*[•\-]\s*/i, ''))
        : '';

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowOpacity: isDarkMode ? 0 : 0.04,
                },
            ]}
        >
            {/* Background watermark */}
            <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', zIndex: 0 }]} pointerEvents="none">
                {logoUrl && (
                    <Image
                        source={{ uri: logoUrl }}
                        style={{ width: 100, height: 100, opacity: isDarkMode ? 0.03 : 0.04 }}
                        resizeMode="contain"
                    />
                )}
            </View>

            {/* Left Content */}
            <View style={[styles.leftContent, { zIndex: 1 }]}>
                <View style={[styles.iconBox, { backgroundColor: `${fuelColor}15` }]}>
                    {isGas ? (
                        <Flame size={18} color={fuelColor} strokeWidth={2.2} />
                    ) : (
                        <Droplet size={18} color={fuelColor} strokeWidth={2.5} />
                    )}
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={3}>
                        {displayTitle}
                    </Text>
                    {isGas && gasRegion ? (
                        <View style={[styles.gasRegionBadge, { backgroundColor: `${fuelColor}18` }]}>
                            <Text style={[styles.gasRegionText, { color: fuelColor }]}>
                                {gasRegion}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </View>

            <View style={[styles.verticalDivider, { backgroundColor: colors.border, zIndex: 1 }]} />

            {/* Right Content */}
            <View style={[styles.rightContent, { zIndex: 1 }]}>
                {isPvoil ? (
                    <View style={styles.priceRow}>
                        <TrendBadge value={item.change1} />
                        <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                            {formatCurrency(item.zone1_price)} <Text style={[styles.unit, { color: colors.textSecondary }]}>đ</Text>
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Zone 1 / 12kg */}
                        <View style={styles.priceRow}>
                            <TrendBadge value={item.change1} />
                            {isGas && <Text style={[styles.unitLabel, { color: colors.textSecondary }]}>12k:</Text>}
                            <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                                {formatCurrency(item.zone1_price)} <Text style={[styles.unit, { color: colors.textSecondary }]}>đ</Text>
                            </Text>
                        </View>

                        {/* Zone 2 / 48kg */}
                        <View style={[styles.priceRow, { marginTop: 6 }]}>
                            <TrendBadge value={item.change2} />
                            {isGas && <Text style={[styles.unitLabel, { color: colors.textSecondary }]}>48k:</Text>}
                            <Text style={[styles.priceTextSub, { color: colors.textSecondary }]}>
                                {formatCurrency(item.zone2_price)} <Text style={[styles.unit, { color: colors.textTertiary }]}>đ</Text>
                            </Text>
                        </View>
                    </>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        overflow: 'hidden',
    },
    leftContent: {
        flex: 1.25,
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    gasRegionBadge: {
        alignSelf: 'flex-start',
        marginTop: 4,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    gasRegionText: {
        fontFamily: FONTS.bold,
        fontSize: 10.5,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    itemName: {
        fontFamily: FONTS.bold,
        fontSize: 14.5,
        lineHeight: 20,
    },
    verticalDivider: {
        width: 1,
        height: '75%',
        marginHorizontal: 10,
    },
    rightContent: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        minWidth: 80,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
    },
    priceText: {
        fontFamily: FONTS.black,
        fontSize: 16,
        letterSpacing: -0.4,
    },
    priceTextSub: {
        fontFamily: FONTS.bold,
        fontSize: 14,
        letterSpacing: -0.3,
    },
    unit: {
        fontFamily: FONTS.medium,
        fontSize: 11,
    },
    unitLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: 11,
        marginRight: 2,
    },
});