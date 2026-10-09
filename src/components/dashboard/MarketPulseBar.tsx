import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Fuel, Coins, Banknote, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../theme/typography';

interface MarketPulseBarProps {
    onPressFuel: () => void;
    onPressMetal: () => void;
    onPressExchange: () => void;
}

export const MarketPulseBar: React.FC<MarketPulseBarProps> = ({
    onPressFuel,
    onPressMetal,
    onPressExchange,
}) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={onPressFuel}
                activeOpacity={0.7}
                style={[styles.pulsePill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
                <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}18` }]}>
                    <Fuel size={14} color={colors.primary} strokeWidth={2.2} />
                </View>
                <View>
                    <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>Nhiên liệu</Text>
                    <Text style={[styles.pillValue, { color: colors.textPrimary }]}>Petrolimex</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onPressMetal}
                activeOpacity={0.7}
                style={[styles.pulsePill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
                <View style={[styles.iconWrapper, { backgroundColor: `${colors.gold}18` }]}>
                    <Coins size={14} color={colors.gold} strokeWidth={2.2} />
                </View>
                <View>
                    <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>Vàng bạc</Text>
                    <Text style={[styles.pillValue, { color: colors.textPrimary }]}>SJC - DOJI</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onPressExchange}
                activeOpacity={0.7}
                style={[styles.pulsePill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
                <View style={[styles.iconWrapper, { backgroundColor: `${colors.accent}18` }]}>
                    <Banknote size={14} color={colors.accent} strokeWidth={2.2} />
                </View>
                <View>
                    <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>Ngoại tệ</Text>
                    <Text style={[styles.pillValue, { color: colors.textPrimary }]}>Vietcombank</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 20,
    },
    pulsePill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 16,
        borderWidth: 1,
        gap: 8,
    },
    iconWrapper: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pillLabel: {
        fontFamily: FONTS.medium,
        fontSize: 10,
    },
    pillValue: {
        fontFamily: FONTS.bold,
        fontSize: 11,
        letterSpacing: -0.2,
    },
});
