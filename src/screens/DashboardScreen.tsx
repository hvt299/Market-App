import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { useTheme } from '../theme/ThemeContext';
import { Droplet, Coins, Banknote, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { getPreviousDay, formatCurrency, getLogo } from '../utils/helpers';

export default function DashboardScreen({ navigation }: any) {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    const todayStr = new Date().toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const [isZone1, setIsZone1] = useState(true);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const [gasList, setGasList] = useState<any[]>([]);
    const [loadingGas, setLoadingGas] = useState(true);

    const [activeMetal, setActiveMetal] = useState<'gold' | 'silver'>('gold');
    const [metalIndex, setMetalIndex] = useState(0);
    const [loadingMetal, setLoadingMetal] = useState(true);

    const [dashboardGold, setDashboardGold] = useState<any[]>([
        { brandId: 'sjc', brand: 'SJC', region: 'TP. Hồ Chí Minh', item1: { buy: '...', sell: '...' }, item2: { buy: '...', sell: '...' } },
    ]);
    const [dashboardSilver, setDashboardSilver] = useState<any[]>([
        { brandId: 'bac-phu-quy', brand: 'Bạc Phú Quý', region: 'Đang tải...', item1: { title: 'Bạc miếng 1 Lượng', buy: '...', sell: '...', unit: 'đ/lượng' }, item2: { title: 'Bạc thỏi 10 Lượng', buy: '...', sell: '...', unit: 'đ/lượng' } }
    ]);

    const [exchangeRates, setExchangeRates] = useState<any[]>([]);
    const [loadingExchange, setLoadingExchange] = useState(true);
    const [exchangeStateIndex, setExchangeStateIndex] = useState(0);

    const [refreshing, setRefreshing] = useState(false);

    const formatVNRate = (value: string) => {
        if (!value || value === '-' || value === '0' || value === '') return '-';
        let valStr = value.toString().replace(/,/g, '');
        let parts = valStr.split('.');
        let intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        let decPart = parts.length > 1 ? parts[1] : '';
        return decPart ? `${intPart},${decPart}` : intPart;
    };

    const fetchDashboardGas = async () => {
        try {
            let targetDate = new Date().toISOString().substring(0, 10);
            let response = await axios.get(`https://giaxanghomnay.com/api/pvdate/${targetDate}`);

            if (!Array.isArray(response.data) || response.data.length < 2) {
                targetDate = getPreviousDay(targetDate);
                response = await axios.get(`https://giaxanghomnay.com/api/pvdate/${targetDate}`);
            }

            const todayData = response.data[0] || [];
            const yesterdayData = response.data[2] || [];
            const targetKeywords = ['RON 95-V', 'RON 95-III', 'E5 RON 92-II', 'E10 RON 95-III'];
            const widgetColors = ['#e74c3c', '#e67e22', '#27AE60', '#f39c12'];

            const processed = targetKeywords.map((keyword, index) => {
                const todayItem = todayData.find((item: any) => item.title.includes(keyword));
                if (!todayItem) return null;

                const yesterdayItem = yesterdayData.find((item: any) => item.title === todayItem.title);
                const change1 = yesterdayItem ? todayItem.zone1_price - yesterdayItem.zone1_price : 0;
                const change2 = yesterdayItem ? todayItem.zone2_price - yesterdayItem.zone2_price : 0;

                return {
                    rawItem: todayItem,
                    title: todayItem.title.replace(/^Xăng\s+/i, ''),
                    price1: formatCurrency(todayItem.zone1_price),
                    price2: formatCurrency(todayItem.zone2_price),
                    trendValue1: change1,
                    trendValue2: change2,
                    color: widgetColors[index],
                };
            }).filter(Boolean);

            setGasList(processed);
        } catch (error) {
            console.log("Lỗi fetch xăng Dashboard:", error);
        } finally {
            setLoadingGas(false);
        }
    };

    const fetchMetals = async () => {
        setLoadingMetal(true);
        try {
            const [resSJC, resDOJI, resPNJ, resSilver] = await Promise.all([
                axios.get('https://giavang.org/trong-nuoc/sjc/').catch(() => null),
                axios.get('https://giavang.org/trong-nuoc/doji/').catch(() => null),
                axios.get('https://giavang.org/trong-nuoc/pnj/').catch(() => null),
                axios.get('https://giabac.phuquygroup.vn/').catch(() => null),
            ]);

            const extractGoldPrices = (html: string | null) => {
                const items: any[] = [];
                if (!html) return items;
                const root = parse(html);
                const mainBox = root.querySelector('.gold-price-box');

                if (mainBox) {
                    const titles = mainBox.querySelectorAll('h2');
                    titles.forEach((h2Node) => {
                        const title = h2Node.text.trim();
                        const row = h2Node.nextElementSibling;
                        if (row && row.classNames.includes('row')) {
                            let buy = row.querySelector('.box-cgre .gold-price')?.text.replace('x1000đ/lượng', '').trim() || '...';
                            let sell = row.querySelector('.box-cred .gold-price')?.text.replace('x1000đ/lượng', '').trim() || '...';
                            items.push({ title, buy, sell });
                        }
                    });
                }
                return items;
            };

            const sjcList = extractGoldPrices(resSJC?.data);
            const dojiList = extractGoldPrices(resDOJI?.data);
            const pnjList = extractGoldPrices(resPNJ?.data);

            const formatGoldGroup = (brandId: string, brand: string, region: string, list: any[]) => {
                if (list.length === 0) return { brandId, brand, region, item1: { title: 'Vàng miếng', buy: '...', sell: '...', unit: 'k/lượng' }, item2: { title: 'Vàng nhẫn', buy: '...', sell: '...', unit: 'k/lượng' } };
                const nhan = list.find(item => item.title.toLowerCase().includes('nhẫn')) || { buy: '...', sell: '...' };
                const mieng = list.find(item => !item.title.toLowerCase().includes('nhẫn')) || list[0];
                return {
                    brandId, brand, region,
                    item1: { title: 'Vàng miếng', buy: mieng.buy, sell: mieng.sell, unit: 'k/lượng' },
                    item2: { title: 'Vàng nhẫn', buy: nhan.buy, sell: nhan.sell, unit: 'k/lượng' }
                };
            };

            setDashboardGold([
                formatGoldGroup('sjc', 'SJC', 'TP. Hồ Chí Minh', sjcList),
                formatGoldGroup('doji', 'DOJI', 'Hà Nội', dojiList),
                formatGoldGroup('pnj', 'PNJ', 'Hà Nội', pnjList)
            ]);

            if (resSilver && resSilver.data) {
                const root = parse(resSilver.data);
                const silverProducts: any[] = [];

                const productNodes = root.querySelectorAll('.col-product');

                productNodes.forEach(node => {
                    const row = node.parentNode;
                    if (row) {
                        const tds = row.querySelectorAll('td');
                        if (tds.length >= 4) {
                            let title = tds[0].text.replace(/\s+/g, ' ').trim();

                            if (title.includes('BẠC MIẾNG')) title = 'Bạc miếng 1 Lượng';
                            else if (title.includes('10 LƯỢNG')) title = 'Bạc thỏi 10 Lượng';
                            else if (title.includes('ĐỒNG BẠC')) title = 'Đồng bạc mỹ nghệ';
                            else if (title.includes('1KILO')) title = 'Bạc thỏi 1 Kilo';

                            let unit = tds[1].text.trim().toLowerCase() === 'vnđ/kg' ? 'đ/kg' : 'đ/lượng';
                            let buy = tds[2].text.trim();
                            let sell = tds[3].text.trim();

                            silverProducts.push({ title, unit, buy, sell });
                        }
                    }
                });

                if (silverProducts.length >= 4) {
                    setDashboardSilver([
                        { brandId: 'bac-phu-quy', brand: 'Bạc Phú Quý', region: 'Toàn quốc', item1: silverProducts[0], item2: silverProducts[1] },
                        { brandId: 'bac-phu-quy', brand: 'Bạc Phú Quý', region: 'Toàn quốc', item1: silverProducts[2], item2: silverProducts[3] }
                    ]);
                }
            }

        } catch (error) {
            console.log("Lỗi fetch kim loại quý:", error);
        } finally {
            setLoadingMetal(false);
        }
    };

    const fetchDashboardExchange = async () => {
        setLoadingExchange(true);
        try {
            const response = await axios.get('https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx');
            const root = parse(response.data);
            const exrates = root.querySelectorAll('exrate');

            const targetCodes = ['USD', 'EUR', 'GBP', 'JPY', 'KRW'];
            const results: any[] = [];

            exrates.forEach(node => {
                const code = node.getAttribute('currencycode') || node.getAttribute('CurrencyCode');
                if (code && targetCodes.includes(code)) {
                    results.push({
                        code: code,
                        name: (node.getAttribute('currencyname') || node.getAttribute('CurrencyName'))?.trim(),
                        buyCash: node.getAttribute('buy') || node.getAttribute('Buy') || '-',
                        buyTransfer: node.getAttribute('transfer') || node.getAttribute('Transfer') || '-',
                        sellCash: node.getAttribute('sell') || node.getAttribute('Sell') || '-',
                        sellTransfer: '-',
                    });
                }
            });

            results.sort((a, b) => targetCodes.indexOf(a.code) - targetCodes.indexOf(b.code));
            setExchangeRates(results);

        } catch (error) {
            console.log("Lỗi fetch tỷ giá Dashboard:", error);
        } finally {
            setLoadingExchange(false);
        }
    };

    const loadAllData = async () => {
        setRefreshing(true);
        await Promise.all([fetchDashboardGas(), fetchMetals(), fetchDashboardExchange()]);
        setRefreshing(false);
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const onRefresh = useCallback(() => {
        loadAllData();
    }, []);

    useEffect(() => {
        const currentList = activeMetal === 'gold' ? dashboardGold : dashboardSilver;
        const len = currentList.length || 1;

        const interval = setInterval(() => {
            Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
                setIsZone1(prev => !prev);
                setMetalIndex(prev => (prev + 1) % len);
                setExchangeStateIndex(prev => (prev + 1) % 4);

                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [activeMetal, dashboardGold, dashboardSilver]);

    const handleMetalTabChange = (tab: 'gold' | 'silver') => {
        if (tab !== activeMetal) {
            setActiveMetal(tab);
            setMetalIndex(0);
        }
    };

    const GasWidget = ({ data }: any) => {
        const { title, price1, price2, trendValue1, trendValue2, color, rawItem } = data;

        const trendValue = isZone1 ? trendValue1 : trendValue2;
        const trendStr = trendValue > 0 ? `+${trendValue}` : trendValue < 0 ? `${trendValue}` : '0';
        const isUp = trendValue > 0;
        const isDown = trendValue < 0;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('GasDetail', { gasItem: rawItem, provider: 'Petrolimex' })}
                style={[styles.gasCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: isDarkMode ? 0 : 0.05 }]}
            >
                <View style={styles.gasCardHeader}>
                    <View style={[styles.iconBoxMini, { backgroundColor: `${color}15` }]}>
                        <Droplet size={18} color={color} strokeWidth={2.5} />
                    </View>
                    {isUp ? <TrendingUp size={16} color={colors.upColor} /> :
                        isDown ? <TrendingDown size={16} color={colors.downColor} /> :
                            <Minus size={16} color={colors.textSecondary} />}
                </View>

                <View style={styles.gasCardBody}>
                    <Text style={[styles.gasTitle, { color: colors.textSecondary }]} numberOfLines={1}>{title}</Text>

                    <Animated.View style={{ opacity: fadeAnim }}>
                        <View style={styles.priceRow}>
                            <Text style={[styles.gasPrice, { color: colors.textPrimary }]}>
                                {isZone1 ? price1 : price2} <Text style={styles.unit}>đ</Text>
                            </Text>

                            {!isZone1 && (
                                <View style={[styles.zoneBadge, { backgroundColor: '#e74c3c20', marginLeft: 6 }]}>
                                    <Text style={[styles.zoneText, { color: colors.upColor }]}>+2%</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.trendRow}>
                            <View style={[styles.zoneBadge, { backgroundColor: colors.border }]}>
                                <Text style={[styles.zoneText, { color: colors.textSecondary }]}>
                                    {isZone1 ? 'VÙNG 1' : 'VÙNG 2'}
                                </Text>
                            </View>

                            {trendValue !== 0 && (
                                <Text style={[styles.gasTrend, { color: isUp ? colors.upColor : colors.downColor }]}>
                                    {trendStr} đ
                                </Text>
                            )}
                        </View>
                    </Animated.View>
                </View>
            </TouchableOpacity>
        );
    };

    const currentMetalData = activeMetal === 'gold'
        ? (dashboardGold[metalIndex] || dashboardGold[0])
        : (dashboardSilver[metalIndex] || dashboardSilver[0]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 115 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} progressViewOffset={insets.top + 115} />}
            >
                {/* --- KHỐI XĂNG DẦU --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Xăng dầu (Petrolimex)</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Gas')} style={styles.seeAllBtn}>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>Chi tiết</Text>
                            <ChevronRight size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {loadingGas ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                            {gasList.map((gas, index) => (
                                <GasWidget key={index} data={gas} />
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* --- KHỐI KIM LOẠI QUÝ (VÀNG / BẠC) --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Vàng bạc</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Gold', { activeBrand: currentMetalData?.brandId })} style={styles.seeAllBtn}>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>Chi tiết</Text>
                            <ChevronRight size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Bộ lọc Vàng / Bạc nhanh */}
                    <View style={styles.metalTabsWrapper}>
                        <TouchableOpacity
                            onPress={() => handleMetalTabChange('gold')}
                            style={[styles.metalTab, activeMetal === 'gold' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        >
                            <Text style={[styles.metalTabText, { color: activeMetal === 'gold' ? '#FFF' : colors.textSecondary }]}>Vàng</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleMetalTabChange('silver')}
                            style={[styles.metalTab, activeMetal === 'silver' && { backgroundColor: '#7f8c8d', borderColor: '#7f8c8d' }]}
                        >
                            <Text style={[styles.metalTabText, { color: activeMetal === 'silver' ? '#FFF' : colors.textSecondary }]}>Bạc</Text>
                        </TouchableOpacity>
                        <Text style={[styles.noteText, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>* Đơn vị tính tùy mặt hàng</Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('Gold', { activeBrand: currentMetalData?.brandId })}
                        style={[styles.goldDashCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: isDarkMode ? 0 : 0.05 }]}
                    >
                        {loadingMetal ? (
                            <ActivityIndicator size="small" color="#F1C40F" style={{ marginVertical: 20 }} />
                        ) : (
                            <Animated.View style={{ opacity: fadeAnim }}>
                                <View style={styles.goldDashHeader}>
                                    <View style={[styles.iconBox, { backgroundColor: activeMetal === 'gold' ? '#F1C40F15' : '#bdc3c730', width: 40, height: 40, marginRight: 12 }]}>
                                        <Coins size={20} color={activeMetal === 'gold' ? "#F1C40F" : "#7f8c8d"} />
                                    </View>
                                    <View>
                                        <Text style={[styles.itemName, { color: colors.textPrimary, marginBottom: 2 }]}>{currentMetalData.brand}</Text>
                                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>Khu vực: {currentMetalData.region}</Text>
                                    </View>
                                </View>

                                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                                {/* Sản phẩm 1 */}
                                <View style={styles.goldTypeRow}>
                                    <Text style={[styles.goldTypeText, { color: colors.textPrimary }]}>{currentMetalData.item1?.title}</Text>
                                    <View style={styles.goldPriceBlock}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.subPrice, { color: colors.downColor }]}>{currentMetalData.item1?.buy}</Text>
                                            <Text style={styles.unitSmall}>{currentMetalData.item1?.unit} mua</Text>
                                        </View>
                                        <View style={{ width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 8 }} />
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.itemPrice, { color: colors.upColor }]}>{currentMetalData.item1?.sell}</Text>
                                            <Text style={styles.unitSmall}>{currentMetalData.item1?.unit} bán</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Sản phẩm 2 */}
                                <View style={[styles.goldTypeRow, { marginTop: 14 }]}>
                                    <Text style={[styles.goldTypeText, { color: colors.textPrimary }]}>{currentMetalData.item2?.title}</Text>
                                    <View style={styles.goldPriceBlock}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.subPrice, { color: colors.downColor }]}>{currentMetalData.item2?.buy}</Text>
                                            <Text style={styles.unitSmall}>{currentMetalData.item2?.unit} mua</Text>
                                        </View>
                                        <View style={{ width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 8 }} />
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.itemPrice, { color: colors.upColor }]}>{currentMetalData.item2?.sell}</Text>
                                            <Text style={styles.unitSmall}>{currentMetalData.item2?.unit} bán</Text>
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* --- KHỐI TỶ GIÁ --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tỷ giá (Vietcombank)</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Exchange')} style={styles.seeAllBtn}>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>Chi tiết</Text>
                            <ChevronRight size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: isDarkMode ? 0 : 0.05 }]}>
                        {loadingExchange ? (
                            <ActivityIndicator size="small" color="#27AE60" style={{ marginVertical: 20 }} />
                        ) : (
                            <Animated.View style={{ opacity: fadeAnim }}>
                                {exchangeRates.map((rate, index) => {
                                    const cleanCode = rate.code.split('(')[0].trim();
                                    const countryCode = cleanCode.length >= 2 ? cleanCode.substring(0, 2) : 'UN';
                                    const flagUrl = getLogo(cleanCode) || `https://flagsapi.com/${countryCode}/flat/64.png`;

                                    const isLast = index === exchangeRates.length - 1;
                                    const iconBgColors = ['#27AE6015', '#2980b915', '#8e44ad15', '#e67e2215', '#e74c3c15'];

                                    let currentPrice = '';
                                    let currentLabel = '';
                                    let priceColor = colors.textPrimary;

                                    if (exchangeStateIndex === 0) {
                                        currentPrice = formatVNRate(rate.buyCash);
                                        currentLabel = 'Mua TM';
                                        priceColor = colors.downColor;
                                    } else if (exchangeStateIndex === 1) {
                                        currentPrice = formatVNRate(rate.sellCash);
                                        currentLabel = 'Bán TM';
                                        priceColor = colors.upColor;
                                    } else if (exchangeStateIndex === 2) {
                                        currentPrice = formatVNRate(rate.buyTransfer);
                                        currentLabel = 'Mua CK';
                                        priceColor = colors.downColor;
                                    } else if (exchangeStateIndex === 3) {
                                        currentPrice = formatVNRate(rate.sellTransfer);
                                        currentLabel = 'Bán CK';
                                        priceColor = colors.upColor;
                                    }

                                    return (
                                        <React.Fragment key={rate.code}>
                                            <View style={styles.listRow}>
                                                <View style={styles.listRowLeft}>
                                                    <View style={[styles.iconBox, { backgroundColor: iconBgColors[index % 5] }]}>
                                                        <Image source={{ uri: flagUrl }} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="cover" />
                                                    </View>
                                                    <View>
                                                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>{rate.code}</Text>
                                                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{rate.name}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={[styles.itemPrice, { color: priceColor }]}>
                                                        {currentPrice} {currentPrice !== '-' && <Text style={styles.unit}>đ</Text>}
                                                    </Text>
                                                    <Text style={[styles.gasTrend, { color: colors.textSecondary }]}>{currentLabel}</Text>
                                                </View>
                                            </View>
                                            {!isLast && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                                        </React.Fragment>
                                    );
                                })}
                            </Animated.View>
                        )}
                    </View>
                </View>

            </ScrollView>

            <BlurView
                intensity={100}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                    styles.fixedHeader,
                    {
                        paddingTop: insets.top,
                        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)'
                    }
                ]}
            >
                <View style={styles.headerContent}>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>Tổng quan thị trường</Text>
                    <View style={styles.titleRow}>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Hôm nay</Text>
                        <View style={[styles.dateBadge, { backgroundColor: colors.border }]}>
                            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{todayStr}</Text>
                        </View>
                    </View>
                </View>
            </BlurView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    headerContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    greeting: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
    dateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, justifyContent: 'center' },
    dateText: { fontSize: 13, fontWeight: '700' },

    scrollContent: { paddingBottom: 40 },

    section: { marginBottom: 28 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700' },
    seeAllBtn: { flexDirection: 'row', alignItems: 'center' },
    seeAllText: { fontSize: 14, fontWeight: '600', marginRight: 2 },

    gasCard: { width: 155, padding: 16, borderRadius: 20, borderWidth: 1, marginRight: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
    gasCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    iconBoxMini: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    gasCardBody: { gap: 4 },
    gasTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    priceRow: { flexDirection: 'row', alignItems: 'center' },
    gasPrice: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    zoneBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    zoneText: { fontSize: 10, fontWeight: '800' },
    gasTrend: { fontSize: 12, fontWeight: '700' },

    metalTabsWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
    metalTab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#ccc' },
    metalTabText: { fontSize: 12, fontWeight: '700' },
    noteText: { fontSize: 11, fontStyle: 'italic' },

    goldDashCard: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
    goldDashHeader: { flexDirection: 'row', alignItems: 'center' },
    goldTypeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goldTypeText: { fontSize: 14, fontWeight: '700', flex: 1, paddingRight: 8 },
    goldPriceBlock: { flexDirection: 'row', alignItems: 'center' },
    unitSmall: { fontSize: 10, color: '#7f8c8d', fontWeight: '500', marginTop: 2 },

    listCard: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
    listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    listRowLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    itemName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    itemSub: { fontSize: 13, fontWeight: '500' },
    itemPrice: { fontSize: 16, fontWeight: '800' },
    subPrice: { fontSize: 15, fontWeight: '700' },
    unit: { fontSize: 12, fontWeight: '600' },
    divider: { height: 1, marginVertical: 14 },
});