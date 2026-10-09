import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Image, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Info, AlertCircle, WifiOff } from 'lucide-react-native';
import { getLogo } from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/typography';
import {
    EXCHANGE_SOURCES,
    BankExchangeRateItem,
    fetchBankExchangeRates,
    formatVNRate
} from '../services/exchangeService';

export default function ExchangeRateScreen({ route }: any) {
    const { colors, isDarkMode } = useTheme();
    const [selectedBank, setSelectedBank] = useState(EXCHANGE_SOURCES[0]);
    const [rates, setRates] = useState<BankExchangeRateItem[]>([]);
    const [lastUpdated, setLastUpdated] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (route?.params?.activeBank) {
            const bank = EXCHANGE_SOURCES.find(b => b.id === route.params.activeBank);
            if (bank) {
                setSelectedBank(bank);
            }
        }
    }, [route?.params?.activeBank]);

    const loadRates = useCallback(async (bank: typeof EXCHANGE_SOURCES[0]) => {
        setLoading(true);
        setIsMaintenance(false);
        const res = await fetchBankExchangeRates(bank);
        setRates(res.rates);
        setLastUpdated(res.time);
        setIsOffline(res.isOffline);
        if (res.rates.length === 0 && !res.isOffline) {
            setIsMaintenance(true);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadRates(selectedBank);
    }, [selectedBank, loadRates]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadRates(selectedBank);
    }, [selectedBank, loadRates]);

    const renderItem = ({ item, index }: { item: BankExchangeRateItem; index: number }) => {
        const cleanCode = item.code.split('(')[0].trim();
        const countryCode = cleanCode.length >= 2 ? cleanCode.substring(0, 2) : 'UN';
        const flagUrl = getLogo(cleanCode) || `https://flagsapi.com/${countryCode}/flat/64.png`;
        const bankLogoUrl = getLogo(selectedBank.id.toUpperCase());

        const iconBgColors = ['#10B98115', '#3B82F615', '#8B5CF615', '#F59E0B15', '#EF444415'];

        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: isDarkMode ? 0 : 0.05 }]}>
                {/* Watermark Logo */}
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

                {/* Card Top / Header */}
                <View style={styles.cardTop}>
                    <View style={[styles.iconBox, { backgroundColor: iconBgColors[index % iconBgColors.length] }]}>
                        <Image source={{ uri: flagUrl }} style={styles.flag} resizeMode="cover" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.currencyCode, { color: colors.textPrimary }]}>{item.code}</Text>
                        {item.name ? <Text style={[styles.currencyName, { color: colors.textSecondary }]} numberOfLines={1}>{item.name}</Text> : null}
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Price columns */}
                <View style={styles.priceContainer}>
                    <View style={styles.priceCol}>
                        <Text style={[styles.headLabel, { color: colors.textSecondary }]}>MUA TIỀN MẶT</Text>
                        <Text style={[styles.priceVal, { color: colors.downColor }]} numberOfLines={1} adjustsFontSizeToFit>
                            {formatVNRate(item.buyCash)}
                        </Text>
                    </View>
                    <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />
                    <View style={styles.priceCol}>
                        <Text style={[styles.headLabel, { color: colors.textSecondary }]}>MUA CK</Text>
                        <Text style={[styles.priceVal, { color: colors.downColor }]} numberOfLines={1} adjustsFontSizeToFit>
                            {formatVNRate(item.buyTransfer)}
                        </Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 8, opacity: 0.5 }]} />

                <View style={styles.priceContainer}>
                    <View style={styles.priceCol}>
                        <Text style={[styles.headLabel, { color: colors.textSecondary }]}>BÁN TIỀN MẶT</Text>
                        <Text style={[styles.priceVal, { color: colors.upColor }]} numberOfLines={1} adjustsFontSizeToFit>
                            {formatVNRate(item.sellCash)}
                        </Text>
                    </View>
                    <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />
                    <View style={styles.priceCol}>
                        <Text style={[styles.headLabel, { color: colors.textSecondary }]}>BÁN CK</Text>
                        <Text style={[styles.priceVal, { color: colors.upColor }]} numberOfLines={1} adjustsFontSizeToFit>
                            {formatVNRate(item.sellTransfer)}
                        </Text>
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
                                            backgroundColor: isActive ? colors.primary : colors.surface,
                                            borderColor: isActive ? colors.primary : colors.border
                                        }
                                    ]}
                                    onPress={() => setSelectedBank(bank)}
                                    activeOpacity={0.75}
                                >
                                    <Text style={[styles.tabText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
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
                        <Text style={styles.offlineText}>Ngoại tuyến. Dữ liệu lưu tạm.</Text>
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
                        keyExtractor={(item) => item.code + item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>Không có dữ liệu.</Text>}
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
    headerTitle: { fontSize: 28, fontFamily: FONTS.extraBold, letterSpacing: -0.5 },
    updateText: { fontSize: 13, fontFamily: FONTS.semiBold, marginTop: 2 },
    chipsWrapper: { paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
    tabItem: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    tabText: { fontFamily: FONTS.semiBold, fontSize: 14 },
    infoSection: { paddingHorizontal: 20, paddingBottom: 10 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendText: { fontSize: 12, fontFamily: FONTS.regular, fontStyle: 'italic' },
    offlineBanner: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 8 },
    offlineText: { color: '#FFF', fontSize: 13, fontFamily: FONTS.bold },
    body: { flex: 1 },
    list: { paddingHorizontal: 16, paddingBottom: 24 },
    emptyText: { textAlign: 'center', marginTop: 40, fontFamily: FONTS.medium },
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
    currencyCode: { fontSize: 18, fontFamily: FONTS.bold },
    currencyName: { fontSize: 12, fontFamily: FONTS.medium, marginTop: 2 },
    divider: { height: 1, marginVertical: 12, zIndex: 1 },
    priceContainer: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
    priceCol: { flex: 1, alignItems: 'center' },
    verticalLine: { width: 1, height: '100%' },
    headLabel: { fontSize: 11, fontFamily: FONTS.semiBold, marginBottom: 6 },
    priceVal: { fontSize: 15, fontFamily: FONTS.bold },
    maintenanceContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
    maintenanceText: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 8 },
    maintenanceSubText: { fontSize: 14, fontFamily: FONTS.regular }
});