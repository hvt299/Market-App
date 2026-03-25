import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar, Image, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Fuel, CalendarDays, TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react-native';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { getPreviousDay, formatCurrency, getLogo } from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';

export default function GasDetailScreen({ route, navigation }: any) {
    const { gasItem, provider } = route.params;
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    const logoUrl = getLogo(provider);
    const isPetrolimex = provider === 'Petrolimex';

    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [displayLimit, setDisplayLimit] = useState(5);
    const [animatedValues, setAnimatedValues] = useState<Animated.Value[]>([]);

    useEffect(() => {
        if (historyData.length === 0) return;

        const visible = historyData.slice(0, displayLimit).reverse();
        const values = visible.map(() => new Animated.Value(0));
        setAnimatedValues(values);

        const prices = visible.map(d => d.zone1_price);
        const max = Math.max(...prices);
        const min = Math.min(...prices) - 500;
        const range = max - min || 1;

        const animations = values.map((val, i) =>
            Animated.timing(val, {
                toValue: (visible[i].zone1_price - min) / range,
                duration: 600,
                delay: i * 80,
                useNativeDriver: false
            })
        );

        Animated.stagger(60, animations).start();

        return () => {
            setAnimatedValues([]);
        };
    }, [historyData, displayLimit]);

    useEffect(() => {
        fetchTrueHistory();
    }, []);

    const fetchTrueHistory = async () => {
        setLoading(true);
        const history: any[] = [];

        let currentKnownPrice1 = isPetrolimex ? gasItem.zone1_price : gasItem.price;
        let currentKnownPrice2 = isPetrolimex ? gasItem.zone2_price : 0;

        let searchDate = new Date().toISOString().substring(0, 10);
        let effectiveDate = searchDate;

        let attempts = 0;
        const MAX_HISTORY = 15;
        const MAX_ATTEMPTS = 180;

        while (history.length < MAX_HISTORY && attempts < MAX_ATTEMPTS) {
            let prevDate = getPreviousDay(searchDate);
            try {
                const response = await axios.get(`https://giaxanghomnay.com/api/pvdate/${prevDate}`);
                let prevData = isPetrolimex ? (response.data[0] || []) : (response.data[1] || []);
                let prevItem = prevData.find((y: any) => y.title === gasItem.title);

                if (prevItem) {
                    let p1 = isPetrolimex ? prevItem.zone1_price : prevItem.price;
                    let p2 = isPetrolimex ? prevItem.zone2_price : 0;

                    if (p1 !== currentKnownPrice1) {
                        history.push({
                            date: effectiveDate,
                            zone1_price: currentKnownPrice1,
                            zone2_price: currentKnownPrice2,
                            change1: currentKnownPrice1 - p1,
                            change2: currentKnownPrice2 - p2
                        });
                        currentKnownPrice1 = p1;
                        currentKnownPrice2 = p2;
                        effectiveDate = prevDate;
                    } else {
                        effectiveDate = prevDate;
                    }
                }
            } catch (error) {}
            await new Promise(resolve => setTimeout(resolve, 100));
            searchDate = prevDate;
            attempts++;
        }

        if (history.length < MAX_HISTORY) {
            history.push({
                date: effectiveDate,
                zone1_price: currentKnownPrice1,
                zone2_price: currentKnownPrice2,
                change1: 0, change2: 0
            });
        }

        setHistoryData(history);
        setLoading(false);
    };

    const handleLoadMore = () => {
        if (displayLimit < 15) {
            setDisplayLimit(prev => Math.min(prev + 5, 15));
        }
    };

    const displayTitle = gasItem.title.replace(/^Xăng\s+/i, '');

    const renderTrend = (change: number, size = 14) => {
        if (change > 0) return <TrendingUp size={size} color={colors.upColor} />;
        if (change < 0) return <TrendingDown size={size} color={colors.downColor} />;
        return <Minus size={size} color={colors.textSecondary} />;
    };

    const scrollRef = useRef<ScrollView>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const renderChart = () => {
        const visibleHistory = historyData.slice(0, displayLimit);
        if (visibleHistory.length < 2) return null;

        const chartData = [...visibleHistory].reverse();

        return (
            <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.chartHeaderRow}>
                    <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
                        Biểu đồ biến động
                    </Text>
                    {isPetrolimex && (
                        <View style={styles.chartLegend}>
                            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Vùng 1</Text>
                            <View style={[styles.legendDot, { backgroundColor: '#e74c3c', marginLeft: 12 }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Vùng 2</Text>
                        </View>
                    )}
                </View>

                {/* FIX LỆCH TRÁI: Dùng contentContainerStyle với flexGrow và justifyContent center */}
                <ScrollView
                    horizontal
                    ref={scrollRef}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                >
                    <View style={styles.barsWrapper}>
                        {chartData.map((item, index) => {
                            const isLatest = index === chartData.length - 1;
                            const val = animatedValues[index] || new Animated.Value(0);

                            const zone1Height = val.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 100]
                            });

                            const zone2Height = isPetrolimex ? val.interpolate({
                                inputRange: [0, 1],
                                outputRange: [6, 106]
                            }) : new Animated.Value(0);

                            return (
                                <View key={index} style={styles.barCol}>
                                    <Text style={[
                                        styles.barValue,
                                        { color: isLatest ? colors.primary : colors.textSecondary }
                                    ]}>
                                        {Math.round(item.zone1_price / 1000)}
                                    </Text>

                                    <Pressable onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}>
                                        <View style={styles.barGroup}>
                                            {/* Cột Vùng 2 (Nằm phía sau, nhô cao hơn 6px) */}
                                            {isPetrolimex && (
                                                <Animated.View
                                                    style={[
                                                        styles.barFill,
                                                        {
                                                            height: zone2Height,
                                                            backgroundColor: isLatest ? '#e74c3c' : colors.border,
                                                            position: 'absolute',
                                                            bottom: 0,
                                                        }
                                                    ]}
                                                />
                                            )}
                                            {/* Cột Vùng 1 (Nằm đè lên trước) */}
                                            <Animated.View
                                                style={[
                                                    styles.barFill,
                                                    {
                                                        height: zone1Height,
                                                        backgroundColor: isLatest ? colors.primary : colors.textSecondary,
                                                        position: 'absolute',
                                                        bottom: 0,
                                                    }
                                                ]}
                                            />
                                        </View>
                                    </Pressable>

                                    {/* Tooltip khi bấm vào cột */}
                                    {selectedIndex === index && (
                                        <View style={[styles.tooltip, { backgroundColor: isDarkMode ? '#333' : '#FFF', borderColor: colors.border }]}>
                                            <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: 'bold' }}>
                                                V1: {formatCurrency(item.zone1_price)}
                                            </Text>
                                            {isPetrolimex && (
                                                <Text style={{ color: '#e74c3c', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>
                                                    V2: {formatCurrency(item.zone2_price)}
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        );
    };

    const visibleHistory = historyData.slice(0, displayLimit);
    const hasMoreData = historyData.length > displayLimit;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <ScrollView contentContainerStyle={{ paddingBottom: 60, paddingTop: insets.top + 60 }} showsVerticalScrollIndicator={false}>

                <View style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
                        {logoUrl ? (
                            <Image source={{ uri: logoUrl }} style={{ width: 40, height: 40 }} resizeMode="contain" />
                        ) : (
                            <Fuel size={32} color={colors.primary} />
                        )}
                    </View>
                    <Text style={[styles.gasName, { color: colors.textPrimary }]}>{displayTitle}</Text>
                    <Text style={[styles.providerName, { color: colors.textSecondary }]}>{provider}</Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.priceOverviewRow}>
                        <View style={styles.priceBlock}>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>VÙNG 1</Text>
                            <Text style={[styles.bigPrice, { color: colors.textPrimary }]}>{formatCurrency(isPetrolimex ? gasItem.zone1_price : gasItem.price)} đ</Text>
                        </View>
                        {isPetrolimex && (
                            <View style={styles.priceBlock}>
                                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>VÙNG 2 (+2%)</Text>
                                <Text style={[styles.bigPrice, { color: colors.textPrimary }]}>{formatCurrency(gasItem.zone2_price)} đ</Text>
                            </View>
                        )}
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {renderChart()}

                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Lịch sử thay đổi</Text>
                        <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            {visibleHistory.map((item, index) => {
                                const isFirst = index === 0;
                                const isLast = index === visibleHistory.length - 1 && historyData.length === visibleHistory.length;
                                const dateStr = item.date.split('-').reverse().join('/');

                                return (
                                    <View key={index} style={styles.timelineRow}>
                                        <View style={styles.timelineLineCol}>
                                            {!isFirst && <View style={[styles.lineTop, { backgroundColor: colors.border }]} />}
                                            <View style={[styles.dot, { backgroundColor: isFirst ? colors.primary : colors.border }]} />
                                            {!isLast && <View style={[styles.lineBottom, { backgroundColor: colors.border }]} />}
                                        </View>

                                        <View style={styles.timelineContent}>
                                            <View style={styles.timeRow}>
                                                <CalendarDays size={14} color={colors.textSecondary} />
                                                <Text style={[styles.dateText, { color: isFirst ? colors.primary : colors.textSecondary }]}>
                                                    Ngày hiệu lực: {dateStr}
                                                </Text>
                                            </View>

                                            <View style={styles.historyPriceBlock}>
                                                <View style={styles.priceChangeRow}>
                                                    <Text style={[styles.hPrice, { color: colors.textPrimary }]}>
                                                        {formatCurrency(item.zone1_price)} đ
                                                    </Text>
                                                    {item.change1 !== 0 && (
                                                        <View style={[styles.changeBadge, { backgroundColor: item.change1 > 0 ? `${colors.upColor}15` : `${colors.downColor}15` }]}>
                                                            {renderTrend(item.change1)}
                                                            <Text style={[styles.changeText, { color: item.change1 > 0 ? colors.upColor : colors.downColor }]}>
                                                                {Math.abs(item.change1)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {isPetrolimex && (
                                                    <View style={[styles.priceChangeRow, { marginTop: 4 }]}>
                                                        <Text style={[styles.hPriceSub, { color: colors.textSecondary }]}>
                                                            V2: {formatCurrency(item.zone2_price)} đ
                                                        </Text>
                                                        {item.change2 !== 0 && (
                                                            <View style={[styles.changeBadge, { paddingVertical: 2, paddingHorizontal: 6, backgroundColor: item.change2 > 0 ? `${colors.upColor}15` : `${colors.downColor}15` }]}>
                                                                {renderTrend(item.change2, 12)}
                                                                <Text style={[styles.changeText, { fontSize: 11, color: item.change2 > 0 ? colors.upColor : colors.downColor }]}>
                                                                    {Math.abs(item.change2)}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}

                            {hasMoreData && (
                                <TouchableOpacity
                                    onPress={handleLoadMore}
                                    style={[
                                        styles.loadMoreBtn,
                                        { borderColor: colors.border }
                                    ]}
                                >
                                    <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                                        Xem thêm 5 lần điều chỉnh
                                    </Text>
                                    <ChevronDown size={16} color={colors.primary} style={{ marginTop: 2 }} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            <BlurView intensity={100} tint={isDarkMode ? 'dark' : 'light'} style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)' }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#2c2c2e' : '#f0f0f0' }]}>
                        <ChevronLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Chi tiết giá</Text>
                    <View style={{ width: 40 }} />
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 15, paddingTop: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },

    overviewCard: { marginHorizontal: 16, marginTop: 16, padding: 24, borderRadius: 24, borderWidth: 1, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    iconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12, padding: 10 },
    gasName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4, textAlign: 'center' },
    providerName: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    divider: { height: 1, width: '100%', marginVertical: 20 },
    priceOverviewRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
    priceBlock: { alignItems: 'center' },
    priceLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
    bigPrice: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },

    chartContainer: { marginHorizontal: 16, marginTop: 24, padding: 20, paddingBottom: 10, borderRadius: 24, borderWidth: 1 },
    chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    chartTitle: { fontSize: 15, fontWeight: '700' },
    chartLegend: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
    legendText: { fontSize: 11, fontWeight: '600' },

    barsWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 140,
        gap: 16,
        paddingHorizontal: 10
    },
    barCol: {
        alignItems: 'center',
        width: 32
    },
    barGroup: {
        height: 110,
        justifyContent: 'flex-end',
        width: 20,
    },
    barValue: { fontSize: 11, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
    barFill: {
        width: 20,
        borderRadius: 6
    },
    tooltip: {
        position: 'absolute',
        bottom: 135,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        zIndex: 20,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minWidth: 75
    },

    sectionTitle: { fontSize: 18, fontWeight: '800', marginHorizontal: 20, marginTop: 32, marginBottom: 16 },
    timelineCard: { marginHorizontal: 16, padding: 20, borderRadius: 24, borderWidth: 1 },
    timelineRow: { flexDirection: 'row' },
    timelineLineCol: { width: 24, alignItems: 'center' },
    lineTop: { width: 2, flex: 1 },
    lineBottom: { width: 2, flex: 1 },
    dot: { width: 12, height: 12, borderRadius: 6, marginVertical: 4 },

    timelineContent: { flex: 1, paddingBottom: 24, paddingLeft: 12 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    dateText: { fontSize: 13, fontWeight: '700' },

    historyPriceBlock: { flexDirection: 'column' },
    priceChangeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hPrice: { fontSize: 17, fontWeight: '800' },
    hPriceSub: { fontSize: 14, fontWeight: '600' },
    changeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    changeText: { fontSize: 13, fontWeight: '700' },

    loadMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderTopWidth: 1, marginTop: 10, gap: 4 },
    loadMoreText: { fontSize: 14, fontWeight: '700' }
});