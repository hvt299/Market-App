import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Image, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { Coins, Info } from 'lucide-react-native';
import { getLogo } from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';

const GOLD_SOURCES = [
    { id: 'sjc', name: 'SJC', url: 'https://giavang.org/trong-nuoc/sjc/' },
    { id: 'doji', name: 'DOJI', url: 'https://giavang.org/trong-nuoc/doji/' },
    { id: 'pnj', name: 'PNJ', url: 'https://giavang.org/trong-nuoc/pnj/' },
    { id: 'bao-tin-minh-chau', name: 'Bảo Tín Minh Châu', url: 'https://giavang.org/trong-nuoc/bao-tin-minh-chau/' },
    { id: 'bao-tin-manh-hai', name: 'Bảo Tín Mạnh Hải', url: 'https://giavang.org/trong-nuoc/bao-tin-manh-hai/' },
    { id: 'phu-quy', name: 'Phú Quý', url: 'https://giavang.org/trong-nuoc/phu-quy/' },
    { id: 'mi-hong', name: 'Mi Hồng', url: 'https://giavang.org/trong-nuoc/mi-hong/' },
    { id: 'ngoc-tham', name: 'Ngọc Thẩm', url: 'https://giavang.org/trong-nuoc/ngoc-tham/' },
];

export default function GoldPriceScreen() {
    const { colors, isDarkMode } = useTheme();
    const [selectedSource, setSelectedSource] = useState(GOLD_SOURCES[0]);
    const [goldData, setGoldData] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchGoldPrice(selectedSource.url);
    }, [selectedSource]);

    const fetchGoldPrice = async (url: string) => {
        setLoading(true);
        try {
            const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = response.data;
            const root = parse(html);
            const items: any[] = [];

            const timeNode = root.querySelector('h1.box-headline small');
            if (timeNode) {
                let timeText = timeNode.text.trim();
                timeText = timeText.replace(/Cập nhật( lúc)?[:\s]*/i, '');
                setLastUpdated(timeText);
            } else {
                setLastUpdated('');
            }

            const mainBox = root.querySelector('.gold-price-box');
            if (mainBox) {
                const titles = mainBox.querySelectorAll('h2');
                titles.forEach((h2Node, index) => {
                    const title = h2Node.text.trim();
                    const row = h2Node.nextElementSibling;

                    if (row && row.classNames.includes('row')) {
                        let buyPrice = row.querySelector('.box-cgre .gold-price')?.text || '0';
                        buyPrice = buyPrice.replace('x1000đ/lượng', '').trim();

                        let sellPrice = row.querySelector('.box-cred .gold-price')?.text || '0';
                        sellPrice = sellPrice.replace('x1000đ/lượng', '').trim();

                        items.push({ id: index.toString(), title, buyPrice, sellPrice });
                    }
                });
            }
            setGoldData(items);
        } catch (error) {
            console.error("Lỗi lấy giá vàng:", error);
            setGoldData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchGoldPrice(selectedSource.url);
    }, [selectedSource]);

    const renderItem = ({ item }: { item: any }) => {
        const logoUrl = getLogo(selectedSource.name);

        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: isDarkMode ? 0 : 0.05 }]}>
                <View style={styles.cardTop}>
                    {logoUrl ? (
                        <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
                    ) : (
                        <View style={[styles.logoPlaceholder, { backgroundColor: '#F1C40F15' }]}>
                            <Coins size={20} color="#F1C40F" />
                        </View>
                    )}
                    <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.priceContainer}>
                    <View style={styles.priceBox}>
                        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>MUA VÀO</Text>
                        <Text style={[styles.priceValue, { color: colors.downColor }]}>{item.buyPrice}</Text>
                        <Text style={[styles.currency, { color: colors.textSecondary }]}>k / lượng</Text>
                    </View>

                    <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />

                    <View style={styles.priceBox}>
                        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>BÁN RA</Text>
                        <Text style={[styles.priceValue, { color: colors.upColor }]}>{item.sellPrice}</Text>
                        <Text style={[styles.currency, { color: colors.textSecondary }]}>k / lượng</Text>
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
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Giá vàng</Text>
                        <Text style={[styles.updateText, { color: colors.textSecondary }]}>Cập nhật: {lastUpdated || '--:--'}</Text>
                    </View>
                </View>

                {/* Thanh cuộn ngang các thương hiệu */}
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsWrapper}>
                        {GOLD_SOURCES.map((source) => {
                            const isActive = selectedSource.id === source.id;
                            return (
                                <TouchableOpacity
                                    key={source.id}
                                    style={[
                                        styles.tabItem,
                                        {
                                            backgroundColor: isActive ? colors.primary : 'transparent',
                                            borderColor: isActive ? colors.primary : colors.border
                                        }
                                    ]}
                                    onPress={() => setSelectedSource(source)}
                                >
                                    <Text style={[
                                        styles.tabText,
                                        { color: isActive ? '#FFF' : colors.textSecondary }
                                    ]}>
                                        {source.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </SafeAreaView>

            <View style={styles.infoSection}>
                <View style={styles.legendRow}>
                    <Info size={14} color={colors.textSecondary} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Đơn vị: Nghìn đồng / Lượng</Text>
                </View>
            </View>

            <View style={styles.body}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={goldData}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>Không có dữ liệu cho khu vực này.</Text>}
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
    legendText: { fontSize: 12 },

    body: { flex: 1 },
    list: { paddingHorizontal: 16, paddingBottom: 20 },

    card: { borderRadius: 20, borderWidth: 1, marginBottom: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
    cardTop: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 36, height: 36, marginRight: 12 },
    logoPlaceholder: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    itemTitle: { fontSize: 16, fontWeight: '700', flex: 1, lineHeight: 22 },

    divider: { height: 1, marginVertical: 14 },

    priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceBox: { flex: 1, alignItems: 'center' },
    verticalLine: { width: 1, height: '80%' },
    priceLabel: { fontSize: 11, fontWeight: '800', marginBottom: 4, letterSpacing: 0.5 },
    priceValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    currency: { fontSize: 11, fontWeight: '600', marginTop: 2 }
});