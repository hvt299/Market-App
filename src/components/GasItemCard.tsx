import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Fuel, TrendingUp, TrendingDown } from 'lucide-react-native';
import { formatCurrency, getLogo } from '../utils/helpers';
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

    const renderTrendBadge = (change: number) => {
        if (!change || change === 0) return null;

        const isUp = change > 0;
        const color = isUp ? colors.upColor : colors.downColor;
        const Icon = isUp ? TrendingUp : TrendingDown;

        return (
            <View style={[styles.trendBadge, { backgroundColor: `${color}15` }]}>
                <Icon size={12} color={color} />
                <Text style={[styles.trendText, { color }]}>{Math.abs(change)}</Text>
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
                    shadowOpacity: isDarkMode ? 0 : 0.05
                }
            ]}
        >
            <View style={styles.leftContent}>
                {logoUrl ? (
                    <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
                ) : (
                    <View style={[styles.logoPlaceholder, { backgroundColor: colors.border }]}>
                        <Fuel size={20} color={colors.textPrimary} />
                    </View>
                )}
                <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {displayTitle}
                </Text>
            </View>

            <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

            <View style={styles.rightContent}>
                {isPvoil ? (
                    <View style={styles.priceRow}>
                        {renderTrendBadge(item.change1)}
                        <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                            {formatCurrency(item.price)} <Text style={styles.unit}>đ</Text>
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.priceRow}>
                            {renderTrendBadge(item.change1)}
                            <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                                {formatCurrency(item.zone1_price)} <Text style={styles.unit}>đ</Text>
                            </Text>
                        </View>
                        <View style={[styles.priceRow, { marginTop: 6 }]}>
                            {renderTrendBadge(item.change2)}
                            <Text style={[styles.priceTextSub, { color: colors.textSecondary }]}>
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
    logo: { width: 36, height: 36, marginRight: 12 },
    logoPlaceholder: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    itemName: { fontSize: 16, fontWeight: '700', flex: 1, lineHeight: 22 },
    verticalDivider: { width: 1, height: '80%', marginHorizontal: 16 },
    rightContent: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 85 },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
    priceText: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
    priceTextSub: { fontSize: 15, fontWeight: '600', letterSpacing: -0.5 },
    unit: { fontSize: 12, fontWeight: '600' },
    trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6 },
    trendText: { fontSize: 11, fontWeight: '700', marginLeft: 2 }
});