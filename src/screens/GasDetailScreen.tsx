import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Image,
    Animated,
    Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CalendarDays, ChevronDown, Droplet, Flame } from 'lucide-react-native';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import {
    getPreviousDay,
    formatCurrency,
    getLogo,
    getFuelColor,
    formatDate,
    isFuelTitleMatch,
    getCleanFuelDisplayTitle,
} from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/typography';
import { TrendBadge } from '../components/common/TrendBadge';

export default function GasDetailScreen({ route, navigation }: any) {
    const { gasItem, provider } = route.params;
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    const logoUrl = getLogo(provider);
    const isPetrolimex = provider === 'Petrolimex';
    const isGas = !!gasItem.isGas;

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
                useNativeDriver: false,
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
        let effectiveDate = gasItem.date || new Date().toISOString().substring(0, 10);

        if (isGas) {
            history.push({
                date: effectiveDate,
                zone1_price: currentKnownPrice1,
                zone2_price: currentKnownPrice2,
                change1: 0,
                change2: 0,
            });
            setHistoryData(history);
            setLoading(false);
            return;
        }

        let searchDate = effectiveDate;
        let attempts = 0;
        const MAX_HISTORY = 15;
        const MAX_ATTEMPTS = 180;

        while (history.length < MAX_HISTORY && attempts < MAX_ATTEMPTS) {
            let prevDate = getPreviousDay(searchDate);
            try {
                const response = await axios.get(`https://giaxanghomnay.com/api/pvdate/${prevDate}`);
                let prevData = isPetrolimex ? (response.data[0] || []) : (response.data[1] || []);
                let prevItem = prevData.find((y: any) => isFuelTitleMatch(y.title, gasItem.title));

                if (prevItem) {
                    let p1 = isPetrolimex ? prevItem.zone1_price : prevItem.price;
                    let p2 = isPetrolimex ? prevItem.zone2_price : 0;

                    if (p1 !== currentKnownPrice1) {
                        history.push({
                            date: effectiveDate,
                            zone1_price: currentKnownPrice1,
                            zone2_price: currentKnownPrice2,
                            change1: currentKnownPrice1 - p1,
                            change2: currentKnownPrice2 - p2,
                        });
                        currentKnownPrice1 = p1;
                        currentKnownPrice2 = p2;
                        effectiveDate = prevDate;
                    } else {
                        effectiveDate = prevDate;
                    }
                }
            } catch (error) { }
            await new Promise(resolve => setTimeout(resolve, 80));
            searchDate = prevDate;
            attempts++;
        }

        if (history.length < MAX_HISTORY) {
            history.push({
                date: effectiveDate,
                zone1_price: currentKnownPrice1,
                zone2_price: currentKnownPrice2,
                change1: 0,
                change2: 0,
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

    const displayTitle = getCleanFuelDisplayTitle(gasItem.title);
    const fuelColor = getFuelColor(gasItem.title, colors.primary);

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
                        Biểu đồ biến động giá
                    </Text>
                    {isPetrolimex && (
                        <View style={styles.chartLegend}>
                            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{isGas ? '12kg' : 'Vùng 1'}</Text>
                            <View style={[styles.legendDot, { backgroundColor: colors.secondary, marginLeft: 12 }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{isGas ? '48kg' : 'Vùng 2'}</Text>
                        </View>
                    )}
                </View>

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
                                outputRange: [0, 100],
                            });

                            const zone2Height = isPetrolimex ? val.interpolate({
                                inputRange: [0, 1],
                                outputRange: [6, 106],
                            }) : new Animated.Value(0);

                            return (
                                <View key={index} style={styles.barCol}>
                                    <Text style={[
                                        styles.barValue,
                                        { color: isLatest ? colors.primary : colors.textSecondary },
                                    ]}>
                                        {Math.round(item.zone1_price / 1000)}k
                                    </Text>

                                    <Pressable onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}>
                                        <View style={styles.barGroup}>
                                            {isPetrolimex && (
                                                <Animated.View
                                                    style={[
                                                        styles.barFill,
                                                        {
                                                            height: zone2Height,
                                                            backgroundColor: isLatest ? colors.secondary : colors.border,
                                                            position: 'absolute',
                                                            bottom: 0,
                                                        },
                                                    ]}
                                                />
                                            )}
                                            <Animated.View
                                                style={[
                                                    styles.barFill,
                                                    {
                                                        height: zone1Height,
                                                        backgroundColor: isLatest ? colors.primary : colors.textSecondary,
                                                        position: 'absolute',
                                                        bottom: 0,
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </Pressable>

                                    {selectedIndex === index && (
                                        <View style={[styles.tooltip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                                            <Text style={{ color: colors.textPrimary, fontSize: 11, fontFamily: FONTS.bold }}>
                                                {isGas ? '12kg' : 'V1'}: {formatCurrency(item.zone1_price)}
                                            </Text>
                                            {isPetrolimex && (
                                                <Text style={{ color: colors.secondary, fontSize: 10, fontFamily: FONTS.bold, marginTop: 2 }}>
                                                    {isGas ? '48kg' : 'V2'}: {formatCurrency(item.zone2_price)}
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
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingTop: insets.top + 60 }} showsVerticalScrollIndicator={false}>

                {/* Overview Card */}
                <View style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', zIndex: 0 }]}>
                        {logoUrl && (
                            <Image
                                source={{ uri: logoUrl }}
                                style={{ width: 140, height: 140, opacity: isDarkMode ? 0.03 : 0.04 }}
                                resizeMode="contain"
                            />
                        )}
                    </View>

                    <View style={[styles.iconBox, { backgroundColor: `${fuelColor}15`, zIndex: 1 }]}>
                        {isGas ? (
                            <Flame size={30} color={fuelColor} strokeWidth={2.2} />
                        ) : (
                            <Droplet size={30} color={fuelColor} strokeWidth={2.5} />
                        )}
                    </View>
                    <Text style={[styles.gasName, { color: colors.textPrimary, zIndex: 1 }]}>{displayTitle}</Text>
                    <Text style={[styles.providerName, { color: colors.textSecondary, zIndex: 1 }]}>{provider}</Text>

                    <View style={[styles.divider, { backgroundColor: colors.border, zIndex: 1 }]} />

                    <View style={[styles.priceOverviewRow, { zIndex: 1 }]}>
                        <View style={styles.priceBlock}>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{isGas ? '12 KG' : 'VÙNG 1'}</Text>
                            <Text style={[styles.bigPrice, { color: colors.textPrimary }]}>
                                {formatCurrency(isPetrolimex ? gasItem.zone1_price : gasItem.price)} đ
                            </Text>
                        </View>
                        {isPetrolimex && (
                            <View style={styles.priceBlock}>
                                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{isGas ? '48 KG' : 'VÙNG 2 (+2%)'}</Text>
                                <Text style={[styles.bigPrice, { color: colors.textPrimary }]}>
                                    {formatCurrency(gasItem.zone2_price)} đ
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {renderChart()}

                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Lịch sử điều chỉnh giá</Text>
                        <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            {visibleHistory.map((item, index) => {
                                const isFirst = index === 0;
                                const isLast = index === visibleHistory.length - 1 && historyData.length === visibleHistory.length;
                                const dateStr = formatDate(item.date);

                                return (
                                    <View key={index} style={styles.timelineRow}>
                                        <View style={styles.timelineLineCol}>
                                            {!isFirst && <View style={[styles.lineTop, { backgroundColor: colors.border }]} />}
                                            <View style={[styles.dot, { backgroundColor: isFirst ? colors.primary : colors.border }]} />
                                            {!isLast && <View style={[styles.lineBottom, { backgroundColor: colors.border }]} />}
                                        </View>

                                        <View style={styles.timelineContent}>
                                            <View style={styles.timeRow}>
                                                <CalendarDays size={13} color={colors.textSecondary} />
                                                <Text style={[styles.dateText, { color: isFirst ? colors.primary : colors.textSecondary }]}>
                                                    Ngày hiệu lực: {dateStr}
                                                </Text>
                                            </View>

                                            <View style={styles.historyPriceBlock}>
                                                <View style={styles.priceChangeRow}>
                                                    <Text style={[styles.hPrice, { color: colors.textPrimary }]}>
                                                        {formatCurrency(item.zone1_price)} đ
                                                    </Text>
                                                    <TrendBadge value={item.change1} />
                                                </View>

                                                {isPetrolimex && (
                                                    <View style={[styles.priceChangeRow, { marginTop: 6 }]}>
                                                        <Text style={[styles.hPriceSub, { color: colors.textSecondary }]}>
                                                            {isGas ? '48kg' : 'V2'}: {formatCurrency(item.zone2_price)} đ
                                                        </Text>
                                                        <TrendBadge value={item.change2} size="sm" />
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
                                    style={[styles.loadMoreBtn, { borderColor: colors.border }]}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                                        Xem thêm 5 kỳ điều chỉnh trước
                                    </Text>
                                    <ChevronDown size={15} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Fixed Header */}
            <BlurView
                intensity={80}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                    styles.fixedHeader,
                    {
                        paddingTop: insets.top,
                        backgroundColor: isDarkMode ? 'rgba(11,15,25,0.85)' : 'rgba(248,250,252,0.85)',
                    },
                ]}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backBtn, { backgroundColor: colors.surfaceSubtle }]}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Chi tiết nhiên liệu</Text>
                    <View style={{ width: 40 }} />
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 14,
        paddingTop: 8,
    },
    backBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 17 },

    overviewCard: {
        marginHorizontal: 20,
        marginTop: 16,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        overflow: 'hidden',
    },
    iconBox: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    gasName: { fontFamily: FONTS.black, fontSize: 22, letterSpacing: -0.4, marginBottom: 4, textAlign: 'center' },
    providerName: { fontFamily: FONTS.bold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    divider: { height: 1, width: '100%', marginVertical: 18 },
    priceOverviewRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
    priceBlock: { alignItems: 'center' },
    priceLabel: { fontFamily: FONTS.bold, fontSize: 11, marginBottom: 4, textTransform: 'uppercase' },
    bigPrice: { fontFamily: FONTS.black, fontSize: 20, letterSpacing: -0.5 },

    chartContainer: { marginHorizontal: 20, marginTop: 24, padding: 20, paddingBottom: 10, borderRadius: 24, borderWidth: 1 },
    chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    chartTitle: { fontFamily: FONTS.bold, fontSize: 15 },
    chartLegend: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
    legendText: { fontFamily: FONTS.medium, fontSize: 11 },

    barsWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 140,
        gap: 16,
        paddingHorizontal: 10,
    },
    barCol: {
        alignItems: 'center',
        width: 32,
    },
    barGroup: {
        height: 110,
        justifyContent: 'flex-end',
        width: 20,
    },
    barValue: { fontFamily: FONTS.bold, fontSize: 11, marginBottom: 6, textAlign: 'center' },
    barFill: {
        width: 20,
        borderRadius: 6,
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
        minWidth: 75,
    },

    sectionTitle: { fontFamily: FONTS.extraBold, fontSize: 17, marginHorizontal: 20, marginTop: 28, marginBottom: 14 },
    timelineCard: { marginHorizontal: 20, padding: 20, borderRadius: 24, borderWidth: 1 },
    timelineRow: { flexDirection: 'row' },
    timelineLineCol: { width: 20, alignItems: 'center' },
    lineTop: { width: 2, flex: 1 },
    lineBottom: { width: 2, flex: 1 },
    dot: { width: 10, height: 10, borderRadius: 5, marginVertical: 4 },

    timelineContent: { flex: 1, paddingBottom: 22, paddingLeft: 12 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    dateText: { fontFamily: FONTS.semiBold, fontSize: 12 },

    historyPriceBlock: { flexDirection: 'column' },
    priceChangeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hPrice: { fontFamily: FONTS.extraBold, fontSize: 16, letterSpacing: -0.3 },
    hPriceSub: { fontFamily: FONTS.semiBold, fontSize: 13 },

    loadMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderTopWidth: 1, marginTop: 10, gap: 4 },
    loadMoreText: { fontFamily: FONTS.bold, fontSize: 13 },
});