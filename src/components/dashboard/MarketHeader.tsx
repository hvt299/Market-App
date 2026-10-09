import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { WifiOff, Activity } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../theme/typography';

interface MarketHeaderProps {
    isOffline: boolean;
    todayStr: string;
    upCount?: number;
    downCount?: number;
}

export const MarketHeader: React.FC<MarketHeaderProps> = ({
    isOffline,
    todayStr,
    upCount = 0,
    downCount = 0,
}) => {
    const { colors } = useTheme();

    // Smooth Live Radar Pulse Animation (Deadlock-free, zero thread load)
    const pulseScale = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.7)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(pulseScale, {
                        toValue: 2.2,
                        duration: 1600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseOpacity, {
                        toValue: 0,
                        duration: 1600,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(pulseScale, {
                        toValue: 1,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseOpacity, {
                        toValue: 0.7,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        pulse.start();

        return () => {
            pulse.stop();
        };
    }, [pulseScale, pulseOpacity]);

    let sentimentLabel = 'Thị trường ổn định';
    let sentimentColor = colors.primary;
    if (upCount > downCount && upCount >= 2) {
        sentimentLabel = `${upCount} mặt hàng tăng giá`;
        sentimentColor = colors.upColor;
    } else if (downCount > upCount && downCount >= 2) {
        sentimentLabel = `${downCount} mặt hàng giảm giá`;
        sentimentColor = colors.downColor;
    }

    return (
        <View style={styles.container}>
            {/* Offline Alert */}
            {isOffline && (
                <View style={[styles.offlineBanner, { backgroundColor: colors.downColor }]}>
                    <WifiOff size={14} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.offlineText}>Chế độ ngoại tuyến. Đang dùng dữ liệu lưu tạm.</Text>
                </View>
            )}

            {/* Top Row: Live Radar Tag & Date */}
            <View style={styles.topRow}>
                <View style={[styles.liveTag, { backgroundColor: `${colors.upColor}15`, borderColor: `${colors.upColor}30` }]}>
                    <View style={styles.radarWrapper}>
                        <Animated.View
                            style={[
                                styles.radarRing,
                                {
                                    backgroundColor: colors.upColor,
                                    transform: [{ scale: pulseScale }],
                                    opacity: pulseOpacity,
                                },
                            ]}
                        />
                        <View style={[styles.centerDot, { backgroundColor: colors.upColor }]} />
                    </View>
                    <Text style={[styles.liveText, { color: colors.upColor }]}>TRỰC TIẾP</Text>
                </View>

                <View style={[styles.dateBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>{todayStr}</Text>
                </View>
            </View>

            {/* Title & Market Mood Tag */}
            <View style={styles.titleRow}>
                <View>
                    <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>
                        Thị trường
                    </Text>
                    <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                        Nhiên liệu • Kim loại quý • Tỷ giá
                    </Text>
                </View>

                <View style={[styles.moodBadge, { backgroundColor: `${sentimentColor}15`, borderColor: `${sentimentColor}30` }]}>
                    <Activity size={12} color={sentimentColor} strokeWidth={2.5} />
                    <Text style={[styles.moodText, { color: sentimentColor }]}>{sentimentLabel}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    offlineText: {
        color: '#FFFFFF',
        fontFamily: FONTS.semiBold,
        fontSize: 12,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
        gap: 7,
    },
    radarWrapper: {
        width: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radarRing: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    centerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    liveText: {
        fontFamily: FONTS.bold,
        fontSize: 10,
        letterSpacing: 0.6,
    },
    dateBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    dateText: {
        fontFamily: FONTS.medium,
        fontSize: 11,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    mainTitle: {
        fontFamily: FONTS.extraBold,
        fontSize: 28,
        letterSpacing: -0.8,
        lineHeight: 34,
    },
    subTitle: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        marginTop: 2,
    },
    moodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        gap: 5,
        marginBottom: 2,
    },
    moodText: {
        fontFamily: FONTS.bold,
        fontSize: 11,
    },
});
