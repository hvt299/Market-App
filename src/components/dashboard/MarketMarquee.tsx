import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing } from 'react-native';
import { TrendingUp, TrendingDown, Minus, Flame, Droplet, Coins, DollarSign, Activity } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../theme/typography';

export interface MarqueeItem {
    id: string;
    label: string;
    value: string;
    changeText?: string;
    isUp?: boolean;
    isDown?: boolean;
    category: 'gas' | 'gold' | 'silver' | 'currency';
    tickerTitle?: string;
}

interface MarketMarqueeProps {
    items: MarqueeItem[];
    onPressItem: (category: 'gas' | 'gold' | 'silver' | 'currency') => void;
}

interface LeadTitleConfig {
    category: 'gas' | 'gold' | 'silver' | 'currency';
    title: string;
    color: string;
    icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}

const LEAD_TITLES: LeadTitleConfig[] = [
    {
        category: 'gas',
        title: 'XĂNG DẦU 24H',
        color: '#EA580C',
        icon: Flame,
    },
    {
        category: 'gold',
        title: 'GIÁ VÀNG BẠC',
        color: '#D97706',
        icon: Coins,
    },
    {
        category: 'currency',
        title: 'TỶ GIÁ NGOẠI TỆ',
        color: '#059669',
        icon: DollarSign,
    },
    {
        category: 'gas',
        title: 'BIẾN ĐỘNG GIÁ',
        color: '#DC2626',
        icon: TrendingUp,
    },
    {
        category: 'gold',
        title: 'TIÊU ĐIỂM GIÁ',
        color: '#4F46E5',
        icon: Activity,
    },
];

const CARD_WIDTH = 375;
const CARD_GAP = 10;
const ITEM_STEP = CARD_WIDTH + CARD_GAP;

export const MarketMarquee: React.FC<MarketMarqueeProps> = ({ items, onPressItem }) => {
    const { colors } = useTheme();

    // 1. Dynamic Lead Title rotation state & animations
    const [titleIndex, setTitleIndex] = useState(0);
    const titleFade = useRef(new Animated.Value(1)).current;
    const titleTranslateY = useRef(new Animated.Value(0)).current;

    // 2. Marquee horizontal slide animation
    const animatedX = useRef(new Animated.Value(0)).current;
    const animRef = useRef<Animated.CompositeAnimation | null>(null);

    const singleBlockWidth = items.length * ITEM_STEP;

    // Cycle lead ticker title every 3.5 seconds with smooth native slide & fade
    useEffect(() => {
        const interval = setInterval(() => {
            Animated.parallel([
                Animated.timing(titleFade, {
                    toValue: 0,
                    duration: 220,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(titleTranslateY, {
                    toValue: -7,
                    duration: 220,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setTitleIndex((prev) => (prev + 1) % LEAD_TITLES.length);
                titleTranslateY.setValue(7);
                Animated.parallel([
                    Animated.timing(titleFade, {
                        toValue: 1,
                        duration: 240,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(titleTranslateY, {
                        toValue: 0,
                        duration: 240,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]).start();
            });
        }, 3400);

        return () => clearInterval(interval);
    }, [titleFade, titleTranslateY]);

    // Continuous marquee ticker loop
    useEffect(() => {
        if (!items || items.length === 0 || singleBlockWidth <= 0) return;

        if (animRef.current) {
            animRef.current.stop();
        }

        animatedX.setValue(0);

        // Broadcast news chyron speed (~36 px/s)
        const duration = (singleBlockWidth / 36) * 1000;

        animRef.current = Animated.loop(
            Animated.timing(animatedX, {
                toValue: -singleBlockWidth,
                duration: duration,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        animRef.current.start();

        return () => {
            if (animRef.current) {
                animRef.current.stop();
            }
        };
    }, [singleBlockWidth, animatedX, items.length]);

    if (!items || items.length === 0) return null;

    const currentLead = LEAD_TITLES[titleIndex];
    const LeadIcon = currentLead.icon;

    const getMeta = (item: MarqueeItem) => {
        const title = item.tickerTitle || '';

        if (title.includes('DẦU') || item.label.includes('Dầu')) {
            return {
                shortTag: 'DẦU DO',
                color: '#0284C7',
                icon: <Droplet size={11} color="#0284C7" strokeWidth={2.5} />,
            };
        }

        if (title.includes('GAS') || item.label.includes('Gas')) {
            return {
                shortTag: 'GAS',
                color: '#EA580C',
                icon: <Flame size={11} color="#EA580C" strokeWidth={2.5} />,
            };
        }

        if (item.category === 'gas' || title.includes('XĂNG')) {
            return {
                shortTag: 'XĂNG',
                color: '#EA580C',
                icon: <Flame size={11} color="#EA580C" strokeWidth={2.5} />,
            };
        }

        if (item.category === 'silver' || title.includes('BẠC') || item.label.includes('Bạc')) {
            return {
                shortTag: 'BẠC',
                color: '#64748B',
                icon: <Coins size={11} color="#64748B" strokeWidth={2.5} />,
            };
        }

        if (item.category === 'gold' || title.includes('VÀNG')) {
            return {
                shortTag: 'VÀNG',
                color: '#D97706',
                icon: <Coins size={11} color="#D97706" strokeWidth={2.5} />,
            };
        }

        // Currency default (extract currency code e.g. USD, EUR)
        const code = title.replace('TỶ GIÁ ', '').trim() || 'VCB';
        return {
            shortTag: code,
            color: '#059669',
            icon: <DollarSign size={11} color="#059669" strokeWidth={2.5} />,
        };
    };

    const renderItemCards = (prefix: string) => (
        <View style={styles.blockRow}>
            {items.map((item, index) => {
                const meta = getMeta(item);
                const trendColor = item.isUp
                    ? colors.upColor
                    : item.isDown
                    ? colors.downColor
                    : colors.textSecondary;

                return (
                    <TouchableOpacity
                        key={`${prefix}-${item.id}-${index}`}
                        onPress={() => onPressItem(item.category)}
                        activeOpacity={0.78}
                        style={[
                            styles.tickerCard,
                            {
                                width: CARD_WIDTH,
                                marginRight: CARD_GAP,
                                borderColor: colors.border,
                                backgroundColor: colors.surface,
                                borderLeftColor: meta.color,
                            },
                        ]}
                    >
                        {/* 1. Category Tag matching asymmetric silhouette */}
                        <View style={[styles.categoryTag, { backgroundColor: `${meta.color}18`, borderColor: `${meta.color}35` }]}>
                            {meta.icon}
                            <Text style={[styles.categoryLabel, { color: meta.color }]}>
                                {meta.shortTag}
                            </Text>
                        </View>

                        {/* 2. Full Commodity Label */}
                        <Text
                            style={[styles.itemLabel, { color: colors.textPrimary }]}
                            numberOfLines={1}
                        >
                            {item.label}
                        </Text>

                        {/* 3. Divider dot */}
                        <Text style={[styles.dotDivider, { color: colors.border }]}>•</Text>

                        {/* 4. Live Value */}
                        <Text style={[styles.itemValue, { color: colors.primary }]}>
                            {item.value}
                        </Text>

                        {/* 5. Trend Badge */}
                        {item.changeText && (
                            <View style={[styles.trendPill, { backgroundColor: `${trendColor}18` }]}>
                                {item.isUp ? (
                                    <TrendingUp size={9.5} color={trendColor} strokeWidth={2.5} />
                                ) : item.isDown ? (
                                    <TrendingDown size={9.5} color={trendColor} strokeWidth={2.5} />
                                ) : (
                                    <Minus size={9.5} color={trendColor} strokeWidth={2.5} />
                                )}
                                <Text style={[styles.trendText, { color: trendColor }]}>
                                    {item.changeText}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <View style={styles.wrapper}>
            {/* Dynamic Asymmetric Broadcast Lead Badge (Substitutes static 'Thị trường 24h') */}
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onPressItem(currentLead.category)}
                style={[
                    styles.leadBadge,
                    {
                        backgroundColor: currentLead.color,
                    },
                ]}
            >
                {/* Live pulsing dot */}
                <View style={styles.liveDot} />

                {/* Animated Rotating Lead Title & Icon */}
                <Animated.View
                    style={[
                        styles.leadContent,
                        {
                            opacity: titleFade,
                            transform: [{ translateY: titleTranslateY }],
                        },
                    ]}
                >
                    <LeadIcon size={12} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.leadTitleText}>
                        {currentLead.title}
                    </Text>
                </Animated.View>
            </TouchableOpacity>

            {/* Seamless Single-Line Ticker Tape with Matching Silhouette Cards */}
            <View style={styles.marqueeTrack}>
                <Animated.View
                    style={[
                        styles.animatedContainer,
                        { transform: [{ translateX: animatedX }] },
                    ]}
                >
                    {renderItemCards('block1')}
                    {renderItemCards('block2')}
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        height: 38,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 14,
    },
    // Distinctive asymmetric cyber-fintech shape for the Lead Badge
    leadBadge: {
        height: 38,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        marginRight: 8,
        borderTopLeftRadius: 13,
        borderBottomRightRadius: 13,
        borderTopRightRadius: 3,
        borderBottomLeftRadius: 3,
        borderLeftWidth: 3.5,
        borderLeftColor: '#FFFFFF',
        gap: 6,
        zIndex: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
    },
    leadContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    leadTitleText: {
        fontFamily: FONTS.extraBold,
        fontSize: 10,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    marqueeTrack: {
        flex: 1,
        height: 38,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    animatedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    blockRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Exact same height (38px) and matching distinctive asymmetric shape
    tickerCard: {
        height: 38,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderTopLeftRadius: 13,
        borderBottomRightRadius: 13,
        borderTopRightRadius: 3,
        borderBottomLeftRadius: 3,
        borderWidth: 1,
        borderLeftWidth: 3.5,
    },
    categoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2.5,
        borderTopLeftRadius: 6,
        borderBottomRightRadius: 6,
        borderTopRightRadius: 2,
        borderBottomLeftRadius: 2,
        borderWidth: 0.8,
        gap: 3.5,
    },
    categoryLabel: {
        fontFamily: FONTS.extraBold,
        fontSize: 9,
        letterSpacing: 0.3,
    },
    itemLabel: {
        fontFamily: FONTS.bold,
        fontSize: 11.5,
        marginLeft: 8,
        flexShrink: 1,
    },
    dotDivider: {
        fontSize: 12,
        marginHorizontal: 6,
    },
    itemValue: {
        fontFamily: FONTS.extraBold,
        fontSize: 12.5,
        letterSpacing: -0.2,
    },
    trendPill: {
        marginLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5.5,
        paddingVertical: 2.5,
        borderTopLeftRadius: 5,
        borderBottomRightRadius: 5,
        borderTopRightRadius: 2,
        borderBottomLeftRadius: 2,
        gap: 2.5,
    },
    trendText: {
        fontFamily: FONTS.bold,
        fontSize: 8.5,
    },
});

