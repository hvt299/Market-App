import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Animated, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { MarketHeader } from '../components/dashboard/MarketHeader';
import { MarketMarquee, MarqueeItem } from '../components/dashboard/MarketMarquee';
import { GasWidgetSection } from '../components/dashboard/GasWidgetSection';
import { MetalsCardSection } from '../components/dashboard/MetalsCardSection';
import { ExchangeCardSection } from '../components/dashboard/ExchangeCardSection';
import { fetchFullGasData, extractDashboardFuels, DashboardFuelItem } from '../services/gasService';
import { fetchDashboardMetalsData, MetalDashboardGroup } from '../services/metalService';
import { fetchDashboardExchangeData, DashboardExchangeRate, formatVNRate } from '../services/exchangeService';

export default function DashboardScreen({ navigation }: any) {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    const todayStr = new Date().toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    // Cross-fade animation for auto-rotating tabs/zones
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Data States
    const [gasList, setGasList] = useState<DashboardFuelItem[]>([]);
    const [isZone1, setIsZone1] = useState(true);

    const [activeMetal, setActiveMetal] = useState<'gold' | 'silver'>('gold');
    const [metalIndex, setMetalIndex] = useState(0);
    const [dashboardGold, setDashboardGold] = useState<MetalDashboardGroup[]>([]);
    const [dashboardSilver, setDashboardSilver] = useState<MetalDashboardGroup[]>([]);

    const [exchangeRates, setExchangeRates] = useState<DashboardExchangeRate[]>([]);
    const [exchangeStateIndex, setExchangeStateIndex] = useState(0);

    const [refreshing, setRefreshing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Load initial data with cache fallback
    const loadAllData = useCallback(async () => {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            setIsOffline(true);
            try {
                const cachedGas = await AsyncStorage.getItem('cache_dashboard_gas');
                const cachedGold = await AsyncStorage.getItem('cache_dashboard_gold');
                const cachedSilver = await AsyncStorage.getItem('cache_dashboard_silver');
                const cachedEx = await AsyncStorage.getItem('cache_dashboard_exchange');

                if (cachedGas) setGasList(JSON.parse(cachedGas));
                if (cachedGold) setDashboardGold(JSON.parse(cachedGold));
                if (cachedSilver) setDashboardSilver(JSON.parse(cachedSilver));
                if (cachedEx) setExchangeRates(JSON.parse(cachedEx));
            } catch (err) {
                console.log('Lỗi đọc cache dashboard:', err);
            }
            setIsInitialLoading(false);
            setRefreshing(false);
            return;
        }

        setIsOffline(false);
        try {
            const [gasRaw, metals, exRates] = await Promise.all([
                fetchFullGasData().catch(() => null),
                fetchDashboardMetalsData().catch(() => ({ gold: [], silver: [] })),
                fetchDashboardExchangeData().catch(() => []),
            ]);

            if (gasRaw) {
                const fuels = extractDashboardFuels(gasRaw, colors.primary);
                setGasList(fuels);
                await AsyncStorage.setItem('cache_dashboard_gas', JSON.stringify(fuels));
            }

            if (metals) {
                setDashboardGold(metals.gold);
                setDashboardSilver(metals.silver);
            }

            if (exRates && exRates.length > 0) {
                setExchangeRates(exRates);
            }
        } catch (error) {
            console.log('Lỗi tải dữ liệu dashboard:', error);
        } finally {
            setIsInitialLoading(false);
            setRefreshing(false);
        }
    }, [colors.primary]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadAllData();
    }, [loadAllData]);

    // Auto-cycle through metal items and FX display every 5.5s
    useEffect(() => {
        const currentList = activeMetal === 'gold' ? dashboardGold : dashboardSilver;
        const len = Math.max(1, currentList.length);

        const interval = setInterval(() => {
            Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
                setMetalIndex(prev => (prev + 1) % len);
                setExchangeStateIndex(prev => (prev + 1) % 3);

                Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
            });
        }, 5500);

        return () => clearInterval(interval);
    }, [activeMetal, dashboardGold.length, dashboardSilver.length, fadeAnim]);

    const handleToggleZone = () => {
        setIsZone1(prev => !prev);
    };

    const handleMetalTabChange = (tab: 'gold' | 'silver') => {
        if (tab !== activeMetal) {
            setActiveMetal(tab);
            setMetalIndex(0);
        }
    };

    // Calculate Market Breadth Sentiment
    let upCount = 0;
    let downCount = 0;

    gasList.forEach(g => {
        const trend = isZone1 ? g.trendValue1 : g.trendValue2;
        if (trend > 0) upCount++;
        else if (trend < 0) downCount++;
    });

    // Stable Memoized Marquee Items (Full names, clearly indicating Zone / Brand / Bank)
    const marqueeItems = useMemo<MarqueeItem[]>(() => {
        const items: MarqueeItem[] = [];

        // Fuels: Use full title and clearly specify zones
        if (gasList.length > 0) {
            gasList.forEach((fuel, idx) => {
                items.push({
                    id: `gas_${idx}_v1`,
                    label: `${fuel.title} (Vùng 1)`,
                    value: `${fuel.price1} đ`,
                    changeText: fuel.trendValue1 !== 0 ? `${fuel.trendValue1 > 0 ? '+' : ''}${fuel.trendValue1} đ` : 'Vùng 1',
                    isUp: fuel.trendValue1 > 0,
                    isDown: fuel.trendValue1 < 0,
                    category: 'gas',
                    tickerTitle: fuel.isGas ? 'GAS' : (fuel.title.includes('Dầu') ? 'DẦU DO' : 'XĂNG'),
                });

                if (fuel.price2 && fuel.price2 !== fuel.price1 && idx < 2) {
                    items.push({
                        id: `gas_${idx}_v2`,
                        label: `${fuel.title} (Vùng 2)`,
                        value: `${fuel.price2} đ`,
                        changeText: fuel.trendValue2 !== 0 ? `${fuel.trendValue2 > 0 ? '+' : ''}${fuel.trendValue2} đ` : 'Vùng 2',
                        isUp: fuel.trendValue2 > 0,
                        isDown: fuel.trendValue2 < 0,
                        category: 'gas',
                        tickerTitle: fuel.isGas ? 'GAS' : (fuel.title.includes('Dầu') ? 'DẦU DO' : 'XĂNG'),
                    });
                }
            });
        }

        // Metals: SJC, DOJI, Phú Quý Silver
        if (dashboardGold.length > 0) {
            const sjc = dashboardGold[0];
            items.push({
                id: 'gold_sjc',
                label: `${sjc.brand} 1L - 10L (Bán)`,
                value: `${sjc.item1.sell} k`,
                changeText: sjc.region || 'TP.HCM',
                isUp: true,
                category: 'gold',
                tickerTitle: 'GIÁ VÀNG',
            });
        }

        if (dashboardGold.length > 1) {
            const doji = dashboardGold[1];
            items.push({
                id: 'gold_doji',
                label: `${doji.brand} AVPL (Bán)`,
                value: `${doji.item1.sell} k`,
                changeText: doji.region || 'Hà Nội',
                isUp: true,
                category: 'gold',
                tickerTitle: 'GIÁ VÀNG',
            });
        }

        if (dashboardSilver.length > 0 && dashboardSilver[0].item1.sell !== '-') {
            const pq = dashboardSilver[0];
            items.push({
                id: 'silver_pq',
                label: `${pq.brand} 999 (1 Lượng)`,
                value: `${pq.item1.sell} đ`,
                changeText: 'Bán ra',
                isUp: true,
                category: 'silver',
                tickerTitle: 'GIÁ BẠC',
            });
        }

        // Foreign Exchange: USD, EUR, GBP, JPY
        const currencies = ['USD', 'EUR', 'GBP', 'JPY'];
        currencies.forEach((code) => {
            const rate = exchangeRates.find((r) => r.code === code);
            if (rate) {
                items.push({
                    id: `rate_${code}`,
                    label: `${rate.code} / VND (Vietcombank)`,
                    value: formatVNRate(rate.buyCash),
                    changeText: 'Mua TM',
                    category: 'currency',
                    tickerTitle: `TỶ GIÁ ${code}`,
                });
            }
        });

        return items;
    }, [gasList, dashboardGold, dashboardSilver, exchangeRates]);

    const currentMetalData = activeMetal === 'gold'
        ? (dashboardGold[metalIndex] || dashboardGold[0])
        : (dashboardSilver[metalIndex] || dashboardSilver[0]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* Fixed Top Header & Ticker Tape (Sticky like Gas, Gold & Exchange screens) */}
            <SafeAreaView
                style={[styles.fixedHeaderContainer, { backgroundColor: colors.background }]}
                edges={['top', 'left', 'right']}
            >
                {/* Section 0: Clean, Compact Market Header */}
                <MarketHeader
                    isOffline={isOffline}
                    todayStr={todayStr}
                    upCount={upCount}
                    downCount={downCount}
                />

                {/* Section 1: Continuous Smooth Right-to-Left Ticker Tape (Seamless Infinite Loop) */}
                {marqueeItems.length > 0 && (
                    <MarketMarquee
                        items={marqueeItems}
                        onPressItem={(cat) => {
                            if (cat === 'gas') navigation.navigate('Gas');
                            else if (cat === 'silver') navigation.navigate('Gold', { activeBrand: 'bac-phu-quy' });
                            else if (cat === 'gold') navigation.navigate('Gold', { activeBrand: activeMetal === 'silver' ? 'bac-phu-quy' : 'sjc' });
                            else navigation.navigate('Exchange');
                        }}
                    />
                )}
            </SafeAreaView>

            {/* Scrollable Content starting from Gas & Fuels downwards */}
            <ScrollView
                nestedScrollEnabled={true}
                scrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                {isInitialLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <>
                        {/* Section 2: Xăng dầu & Gas (Compact Zone Slider & Auto-Alternating Featured Card) */}
                        <GasWidgetSection
                            gasList={gasList}
                            isZone1={isZone1}
                            onToggleZone={handleToggleZone}
                            fadeAnim={fadeAnim}
                            onPressSeeAll={() => navigation.navigate('Gas')}
                            onPressItem={(rawItem) =>
                                navigation.navigate('GasDetail', { gasItem: rawItem, provider: 'Petrolimex' })
                            }
                        />

                        {/* Section 3: Vàng bạc kim loại quý (Fully functional Gold & Phú Quý Silver) */}
                        <MetalsCardSection
                            activeMetal={activeMetal}
                            onChangeTab={handleMetalTabChange}
                            currentData={currentMetalData}
                            allGoldBrands={dashboardGold}
                            allSilverGroups={dashboardSilver}
                            onSelectBrand={(idx) => setMetalIndex(idx)}
                            currentBrandIndex={metalIndex}
                            fadeAnim={fadeAnim}
                            onPressSeeAll={() =>
                                navigation.navigate('Gold', {
                                    activeBrand: activeMetal === 'silver' ? 'bac-phu-quy' : (currentMetalData?.brandId || 'sjc')
                                })
                            }
                        />

                        {/* Section 4: Tỷ giá ngoại tệ (Segmented Slider & Currency Matrix) */}
                        <ExchangeCardSection
                            rates={exchangeRates}
                            exchangeStateIndex={exchangeStateIndex}
                            onChangeModeIndex={setExchangeStateIndex}
                            fadeAnim={fadeAnim}
                            onPressSeeAll={() =>
                                navigation.navigate('Exchange', { activeBank: 'vcb' })
                            }
                        />
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fixedHeaderContainer: {
        paddingBottom: 6,
        zIndex: 20,
        elevation: 4,
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 20,
    },
    loadingContainer: {
        paddingTop: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
});