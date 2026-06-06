import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Fuel, TrendingUp, TrendingDown, Minus, Droplet } from 'lucide-react-native';
import { formatCurrency, getFuelColor, getLogo } from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';

interface GasItemCardProps {
    item: any;
    providerId: string;
    onPress: () => void;
}

export const GasItemCard: React.FC<GasItemCardProps> = ({ item, providerId, onPress }) => {
    const { colors, isDarkMode } = useTheme();
    const logoUrl = getLogo(providerId);

    const isPvoil = providerId.toLowerCase() === 'pvoil';
    const displayTitle = item.title.replace(/^Xăng\s+/i, '');
    const isGas = !!item.isGas;

    const fuelColor = getFuelColor(item.title, colors.primary);

    const renderTrendBadge = (change: number) => {
        if (!change) return null;

        const isUp = change > 0;
        const color = isUp ? colors.upColor : colors.downColor;
        const Icon = isUp ? TrendingUp : TrendingDown;

        return (
            <View style={[styles.trendBadge, { backgroundColor: `${color}15`, paddingVertical: 4, paddingHorizontal: 8 }]}>
                <Icon size={14} color={color} />
                <Text style={[styles.trendText, { color, fontSize: 13 }]}>{Math.abs(change)}</Text>
            </View>
        );
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowOpacity: isDarkMode ? 0 : 0.05,
                    overflow: 'hidden'
                }
            ]}
        >
            <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', zIndex: 0 }]}>
                {logoUrl && <Image source={{ uri: logoUrl }} style={{ width: 120, height: 120, opacity: 0.05 }} resizeMode="contain" blurRadius={1.5} />}
            </View>

            <View style={[styles.leftContent, { zIndex: 1 }]}>
                <View style={[styles.iconBox, { backgroundColor: `${fuelColor}15` }]}>
                    <Droplet size={20} color={fuelColor} />
                </View>
                <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {displayTitle}
                </Text>
            </View>

            <View style={[styles.verticalDivider, { backgroundColor: colors.border, zIndex: 1 }]} />

            <View style={[styles.rightContent, { zIndex: 1 }]}>
                {isPvoil ? (
                    <View style={styles.priceRow}>
                        {renderTrendBadge(item.change1)}
                        <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                            {formatCurrency(item.zone1_price)} <Text style={styles.unit}>đ</Text>
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.priceRow}>
                            {renderTrendBadge(item.change1)}
                            {isGas && <Text style={[styles.unit, { color: colors.textSecondary, marginRight: 2 }]}>12kg:</Text>}
                            <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                                {formatCurrency(item.zone1_price)} <Text style={styles.unit}>đ</Text>
                            </Text>
                        </View>
                        <View style={[styles.priceRow, { marginTop: 6 }]}>
                            {renderTrendBadge(item.change2)}
                            {isGas && <Text style={[styles.unit, { color: colors.textSecondary, marginRight: 2 }]}>48kg:</Text>}
                            <Text style={[styles.priceText, { color: colors.textSecondary }]}>
                                {formatCurrency(item.zone2_price)} <Text style={styles.unit}>đ</Text>
                            </Text>
                        </View>
                    </>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
    leftContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    itemName: { fontSize: 16, fontWeight: '700', flex: 1, lineHeight: 22 },
    verticalDivider: { width: 1, height: '80%', marginHorizontal: 16 },
    rightContent: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 85 },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
    priceText: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
    unit: { fontSize: 12, fontWeight: '600' },
    trendBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 6 },
    trendText: { fontWeight: '700', marginLeft: 2 }
});