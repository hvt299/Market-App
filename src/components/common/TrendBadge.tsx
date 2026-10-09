import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../theme/typography';

interface TrendBadgeProps {
    value: number;
    prefix?: string;
    suffix?: string;
    size?: 'sm' | 'md';
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({
    value,
    prefix = '',
    suffix = '',
    size = 'sm'
}) => {
    const { colors } = useTheme();

    if (value === 0 || isNaN(value)) {
        return (
            <View style={[styles.badge, { backgroundColor: colors.surfaceSubtle }]}>
                <Minus size={size === 'sm' ? 12 : 14} color={colors.textTertiary} />
                <Text style={[styles.text, { color: colors.textTertiary, fontSize: size === 'sm' ? 11 : 12 }]}>
                    0
                </Text>
            </View>
        );
    }

    const isUp = value > 0;
    const color = isUp ? colors.upColor : colors.downColor;
    const bg = isUp ? colors.upMuted : colors.downMuted;
    const Icon = isUp ? TrendingUp : TrendingDown;
    const formatted = Math.abs(value).toLocaleString('vi-VN');

    return (
        <View style={[styles.badge, { backgroundColor: bg }]}>
            <Icon size={size === 'sm' ? 12 : 14} color={color} strokeWidth={2.5} />
            <Text style={[styles.text, { color, fontSize: size === 'sm' ? 11 : 12 }]}>
                {prefix}{isUp ? '+' : '-'}{formatted}{suffix}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 3,
    },
    text: {
        fontFamily: FONTS.bold,
        letterSpacing: -0.2,
    },
});
