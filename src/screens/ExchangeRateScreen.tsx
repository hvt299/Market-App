import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Image, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { parse } from 'node-html-parser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Info, AlertCircle, WifiOff } from 'lucide-react-native';
import { getLogo } from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';

const EXCHANGE_SOURCES = [
    { id: 'vcb', name: 'Vietcombank', url: 'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx' },
    { id: 'agri', name: 'Agribank', url: 'https://www.agribank.com.vn/vn/ty-gia' },
    { id: 'bidv', name: 'BIDV', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-bidv.epi' },
    { id: 'hdb', name: 'HDBank', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-hdbank.epi' },
    { id: 'tpb', name: 'TPBank', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-tpbank.epi' },
    { id: 'nhnn', name: 'NHNN', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-nhnn.epi' },
];

const CURRENCY_NAMES: Record<string, string> = {
    'USD': 'US DOLLAR', 'EUR': 'EURO', 'GBP': 'BRITISH POUND',
    'JPY': 'JAPANESE YEN', 'AUD': 'AUSTRALIAN DOLLAR', 'SGD': 'SINGAPORE DOLLAR',
    'THB': 'THAI BAHT', 'CAD': 'CANADIAN DOLLAR', 'NZD': 'NEW ZEALAND DOLLAR',
    'KRW': 'KOREAN WON', 'DKK': 'DANISH KRONE', 'NOK': 'NORWEGIAN KRONE',
    'SEK': 'SWEDISH KRONA', 'CHF': 'SWISS FRANC', 'HKD': 'HONGKONG DOLLAR',
    'RUB': 'RUSSIAN RUBLE', 'CNY': 'CHINESE YUAN', 'INR': 'INDIAN RUPEE',
    'KWD': 'KUWAITI DINAR', 'MYR': 'MALAYSIAN RINGGIT', 'SAR': 'SAUDI RIAL',
    'IDR': 'INDONESIAN RUPIAH', 'TWD': 'TAIWAN DOLLAR', 'MOP': 'MACANESE PATACA',
    'TRY': 'TURKISH LIRA', 'BRL': 'BRAZILIAN REAL', 'PLN': 'POLISH ZLOTY',
    'AED': 'UAE DIRHAM', 'ZAR': 'SOUTH AFRICAN RAND', 'CZK': 'CZECH KORUNA',
    'PHP': 'PHILIPPINE PESO', 'HUF': 'HUNGARIAN FORINT', 'LAK': 'LAO KIP'
};

export default function ExchangeRateScreen() {
    const { colors, isDarkMode } = useTheme();
    const [selectedBank, setSelectedBank] = useState(EXCHANGE_SOURCES[0]);
    const [rates, setRates] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        fetchExchangeRates(selectedBank);
    }, [selectedBank]);

    const formatVNRate = (value: string) => {
        if (!value || value === '-' || value === '0' || value === '') return '-';
        let valStr = value.toString().replace(/,/g, '');
        let parts = valStr.split('.');
        let intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        let decPart = parts.length > 1 ? parts[1] : '';
        return decPart ? `${intPart},${decPart} đ` : `${intPart} đ`;
    };

    const fetchExchangeRates = async (bank: typeof EXCHANGE_SOURCES[0]) => {
        setLoading(true);
        setIsMaintenance(false);

        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            setIsOffline(true);
            const cached = await AsyncStorage.getItem(`cache_exchange_${bank.id}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                setRates(parsed.rates);
                setLastUpdated(parsed.time);
            } else {
                setRates([]);
            }
            setLoading(false); setRefreshing(false);
            return;
        }

        setIsOffline(false);

        try {
            const response = await axios.get(bank.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const data = response.data;
            const root = parse(data);
            const items: any[] = [];
            let updatedTime = '';

            if (bank.id === 'vcb') {
                const timeNode = root.querySelector('datetime') || root.querySelector('DateTime');
                if (timeNode) {
                    const rawTime = timeNode.text.trim();
                    const match = rawTime.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})\s+(AM|PM)/i);
                    if (match) {
                        let mo = match[1].padStart(2, '0');
                        let dd = match[2].padStart(2, '0');
                        let yy = match[3];
                        let hh = parseInt(match[4], 10);
                        let mm = match[5].padStart(2, '0');
                        let ss = match[6].padStart(2, '0');
                        let ampm = match[7].toUpperCase();

                        if (ampm === 'PM' && hh < 12) hh += 12;
                        if (ampm === 'AM' && hh === 12) hh = 0;

                        let hhs = String(hh).padStart(2, '0');
                        updatedTime = `${hhs}:${mm}:${ss} ${dd}/${mo}/${yy}`;
                    } else {
                        updatedTime = rawTime;
                    }
                }

                const exrates = root.querySelectorAll('exrate');
                exrates.forEach((node, index) => {
                    const code = node.getAttribute('currencycode') || node.getAttribute('CurrencyCode');
                    if (code) {
                        items.push({
                            id: index.toString(),
                            code: code,
                            name: (node.getAttribute('currencyname') || node.getAttribute('CurrencyName') || '').trim(),
                            buyCash: node.getAttribute('buy') || node.getAttribute('Buy') || '-',
                            buyTransfer: node.getAttribute('transfer') || node.getAttribute('Transfer') || '-',
                            sellCash: node.getAttribute('sell') || node.getAttribute('Sell') || '-',
                            sellTransfer: '-',
                        });
                    }
                });
            }
            else if (bank.id === 'agri') {
                const timeNode = root.querySelector('.luu_ycc');
                if (timeNode) {
                    const match = timeNode.text.match(/lúc\s+([0-9:]+)\s+ngày\s+([0-9\/]+)/i);
                    if (match) {
                        let timeStr = match[1];
                        if (timeStr.length === 5) timeStr += ':00';
                        updatedTime = `${timeStr} ${match[2]}`;
                    }
                }

                const rows = root.querySelectorAll('tr');
                rows.forEach((row, index) => {
                    const tds = row.querySelectorAll('td');
                    if (tds.length >= 4) {
                        const code = tds[0].text.trim();
                        const buyCash = tds[1].text.replace(/&nbsp;/g, '').trim();
                        const buyTransfer = tds[2].text.replace(/&nbsp;/g, '').trim();
                        const sell = tds[3].text.replace(/&nbsp;/g, '').trim();

                        if (code && code.length === 3) {
                            items.push({
                                id: index.toString(),
                                code: code,
                                name: CURRENCY_NAMES[code] || '',
                                buyCash: buyCash || '-',
                                buyTransfer: buyTransfer || '-',
                                sellCash: sell || '-',
                                sellTransfer: '-',
                            });
                        }
                    }
                });
            }
            else if (bank.url.includes('baomoi.com')) {
                const titleNode = root.querySelector('h2.ut-title');
                if (titleNode) {
                    const timeMatch = titleNode.text.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}:\d{2})/);
                    if (timeMatch) {
                        updatedTime = `${timeMatch[4]}:00 ${timeMatch[1]}/${timeMatch[2]}/${timeMatch[3]}`;
                    }
                }

                const rows = root.querySelectorAll('.rc-table-tbody .rc-table-row');
                rows.forEach((row, index) => {
                    const tds = row.querySelectorAll('td');
                    if (tds.length >= 6) {
                        const rawCode = tds[1].text.trim();
                        const codeMatch = rawCode.match(/^[A-Z]{3}/);

                        if (codeMatch) {
                            const code = codeMatch[0];
                            const buyCash = tds[2].text.trim() || '-';
                            const buyTransfer = tds[3].text.trim() || '-';
                            const sellCash = tds[4].text.trim() || '-';
                            const sellTransfer = tds[5].text.trim() || '-';

                            items.push({
                                id: index.toString(),
                                code: code,
                                name: CURRENCY_NAMES[code] || '',
                                buyCash: buyCash,
                                buyTransfer: buyTransfer,
                                sellCash: sellCash,
                                sellTransfer: sellTransfer,
                            });
                        }
                    }
                });
            }

            const uniqueItems = [];
            const map = new Map();
            for (const item of items) {
                if (!map.has(item.code) && item.code !== '-') {
                    map.set(item.code, true);
                    uniqueItems.push(item);
                }
            }

            const finalTime = updatedTime || `00:00:00 ${new Date().toLocaleDateString('vi-VN')}`;
            setRates(uniqueItems);
            setLastUpdated(finalTime);

            await AsyncStorage.setItem(`cache_exchange_${bank.id}`, JSON.stringify({ rates: uniqueItems, time: finalTime }));

        } catch (error) {
            console.error("Lỗi lấy tỷ giá:", error);
            setRates([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchExchangeRates(selectedBank);
    }, [selectedBank]);

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const cleanCode = item.code.split('(')[0].trim();
        const countryCode = cleanCode.length >= 2 ? cleanCode.substring(0, 2) : 'UN';
        const flagUrl = getLogo(cleanCode) || `https://flagsapi.com/${countryCode}/flat/64.png`;
        const bankLogoUrl = getLogo(selectedBank.id.toUpperCase());

        const iconBgColors = ['#27AE6015', '#2980b915', '#8e44ad15', '#e67e2215', '#e74c3c15'];

        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

                <View style={styles.watermarkWrapper}>
                    {bankLogoUrl && (
                        <Image
                            source={{ uri: bankLogoUrl }}
                            style={styles.watermarkLogo}
                            resizeMode="contain"
                            blurRadius={1.5}
                        />
                    )}
                </View>

                <View style={styles.cardTop}>
                    <View style={[styles.iconBox, { backgroundColor: iconBgColors[index % 5] }]}>
                        <Image source={{ uri: flagUrl }} style={styles.flag} resizeMode="cover" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.currencyCode, { color: colors.textPrimary }]}>{item.code}</Text>
                        {item.name ? <Text style={[styles.currencyName, { color: colors.textSecondary }]} numberOfLines={1}>{item.name}</Text> : null}
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.priceContainer}>
                    <View style={styles.priceCol}>
                        <Text style={[styles.headLabel, { color: colors.textSecondary }]}>MUA TM</Text>
                        <Text style={[styles.priceVal, { color: colors.downColor }]} numberOfLines={1} adjustsFontSizeToFit>{formatVNRate(item.buyCash)}</Text>
                    </View>
                    <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />
                    <View style={styles.priceCol}>
                        <Text style={[styles.headLabel, { color: colors.textSecondary }]}>MUA CK</Text>
                        <Text style={[styles.priceVal, { color: colors.downColor }]} numberOfLines={1} adjustsFontSizeToFit>{formatVNRate(item.buyTransfer)}</Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 8, opacity: 0.5 }]} />

                <View style={styles.priceContainer}>
                    <View style={styles.priceCol}>
                        <Text style={[styles.headLabel, { color: colors.textSecondary }]}>BÁN TM</Text>
                        <Text style={[styles.priceVal, { color: colors.upColor }]} numberOfLines={1} adjustsFontSizeToFit>{formatVNRate(item.sellCash)}</Text>
                    </View>
                    <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />
                    <View style={styles.priceCol}>
                        <Text style={[styles.headLabel, { color: colors.textSecondary }]}>BÁN CK</Text>
                        <Text style={[styles.priceVal, { color: colors.upColor }]} numberOfLines={1} adjustsFontSizeToFit>{formatVNRate(item.sellTransfer)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <SafeAreaView style={styles.headerContainer} edges={['top', 'left', 'right']}>
                <View style={styles.topBar}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Tỷ giá ngoại tệ</Text>
                        <Text style={[styles.updateText, { color: colors.textSecondary }]}>Cập nhật: {lastUpdated || '--:--'}</Text>
                    </View>
                </View>

                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsWrapper}>
                        {EXCHANGE_SOURCES.map((bank) => {
                            const isActive = selectedBank.id === bank.id;
                            return (
                                <TouchableOpacity
                                    key={bank.id}
                                    style={[
                                        styles.tabItem,
                                        {
                                            backgroundColor: isActive ? colors.primary : 'transparent',
                                            borderColor: isActive ? colors.primary : colors.border
                                        }
                                    ]}
                                    onPress={() => setSelectedBank(bank)}
                                >
                                    <Text style={[styles.tabText, { color: isActive ? '#FFF' : colors.textSecondary }]}>
                                        {bank.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </SafeAreaView>

            <View style={styles.infoSection}>
                {isOffline && (
                    <View style={styles.offlineBanner}>
                        <WifiOff size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Ngoại tuyến. Dữ liệu lưu tạm.</Text>
                    </View>
                )}
                <View style={styles.legendRow}>
                    <Info size={14} color={colors.textSecondary} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                        Chú ý: TM (Tiền mặt) - CK (Chuyển khoản)
                    </Text>
                </View>
            </View>

            <View style={styles.body}>
                {loading && !isOffline ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : isMaintenance ? (
                    <View style={styles.maintenanceContainer}>
                        <AlertCircle size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
                        <Text style={[styles.maintenanceText, { color: colors.textPrimary }]}>Hệ thống đang bảo trì</Text>
                        <Text style={[styles.maintenanceSubText, { color: colors.textSecondary }]}>Vui lòng thử lại sau.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={rates}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>Không có dữ liệu.</Text>}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: { paddingBottom: 10, paddingTop: 10 },

    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
    headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    updateText: { fontSize: 13, fontWeight: '600', marginTop: 2 },

    chipsWrapper: { paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
    tabItem: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    tabText: { fontWeight: '600', fontSize: 14 },

    infoSection: { paddingHorizontal: 20, paddingBottom: 10 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendText: { fontSize: 12, fontStyle: 'italic' },
    offlineBanner: { backgroundColor: '#e74c3c', flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 8 },

    body: { flex: 1 },
    list: { paddingHorizontal: 16, paddingBottom: 20 },

    card: { borderRadius: 20, borderWidth: 1, marginBottom: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, overflow: 'hidden' },

    watermarkWrapper: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    watermarkLogo: {
        width: 140,
        height: 140,
        opacity: 0.05
    },

    cardTop: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    flag: { width: 28, height: 28, borderRadius: 14 },
    currencyCode: { fontSize: 18, fontWeight: '800' },
    currencyName: { fontSize: 12, marginTop: 2 },

    divider: { height: 1, marginVertical: 12, zIndex: 1 },

    priceContainer: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
    priceCol: { flex: 1, alignItems: 'center' },
    verticalLine: { width: 1, height: '100%' },
    headLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
    priceVal: { fontSize: 15, fontWeight: '800' },

    maintenanceContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
    maintenanceText: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    maintenanceSubText: { fontSize: 14 }
});