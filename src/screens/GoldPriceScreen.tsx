import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Image, ScrollView, StatusBar, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { parse } from 'node-html-parser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Coins, Info, ChevronDown, ChevronUp, WifiOff } from 'lucide-react-native';
import { getLogo } from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';

const MARKET_SOURCES = [
    { id: 'sjc', name: 'SJC', url: 'https://giavang.org/trong-nuoc/sjc/', type: 'gold' },
    { id: 'doji', name: 'DOJI', url: 'https://giavang.org/trong-nuoc/doji/', type: 'gold' },
    { id: 'pnj', name: 'PNJ', url: 'https://giavang.org/trong-nuoc/pnj/', type: 'gold' },
    { id: 'bao-tin-minh-chau', name: 'Bảo Tín Minh Châu', url: 'https://giavang.org/trong-nuoc/bao-tin-minh-chau/', type: 'gold' },
    { id: 'bao-tin-manh-hai', name: 'Bảo Tín Mạnh Hải', url: 'https://giavang.org/trong-nuoc/bao-tin-manh-hai/', type: 'gold' },
    { id: 'phu-quy', name: 'Phú Quý', url: 'https://giavang.org/trong-nuoc/phu-quy/', type: 'gold' },
    { id: 'mi-hong', name: 'Mi Hồng', url: 'https://giavang.org/trong-nuoc/mi-hong/', type: 'gold' },
    { id: 'ngoc-tham', name: 'Ngọc Thẩm', url: 'https://giavang.org/trong-nuoc/ngoc-tham/', type: 'gold' },
    { id: 'bac-phu-quy', name: 'Bạc Phú Quý', url: 'https://giabac.phuquygroup.vn/', type: 'silver' },
];

export default function GoldPriceScreen({ route }: any) {
    const { colors, isDarkMode } = useTheme();

    const initialBrandId = route.params?.activeBrand || 'sjc';
    const initialSource = MARKET_SOURCES.find(s => s.id === initialBrandId) || MARKET_SOURCES[0];

    const [selectedSource, setSelectedSource] = useState(initialSource);
    const [marketData, setMarketData] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (route.params?.activeBrand) {
            const source = MARKET_SOURCES.find(s => s.id === route.params.activeBrand);
            if (source) {
                setSelectedSource(source);
            }
        }
    }, [route.params?.activeBrand]);

    useEffect(() => {
        fetchMarketData(selectedSource);
    }, [selectedSource]);

    const normalizeName = (text: string) => {
        let t = text.replace(/\s+/g, ' ').trim().toLowerCase();
        t = t.replace(/phú quý/g, 'Phú Quý');
        t = t.replace(/1 lượng/g, '1L');
        t = t.replace(/10 lượng/g, '10L');
        t = t.replace(/5 lượng/g, '5L');
        t = t.replace(/1 kilo|1kg|1 kg/g, '1KG');
        return t.charAt(0).toUpperCase() + t.slice(1);
    };

    const fetchMarketData = async (source: typeof MARKET_SOURCES[0]) => {
        setLoading(true);
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            setIsOffline(true);
            const cached = await AsyncStorage.getItem(`cache_metal_${source.id}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                setMarketData(parsed.data);
                setLastUpdated(parsed.time);
            } else {
                setMarketData([]);
            }
            setLoading(false); setRefreshing(false);
            return;
        }

        setIsOffline(false);
        try {
            const response = await axios.get(source.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const root = parse(response.data);
            const groupedData: any[] = [];
            const rows = root.querySelectorAll('tr');
            let updatedTime = '';

            if (source.type === 'silver') {
                const timeNode = root.querySelector('.update-info-mobile');
                if (timeNode) {
                    updatedTime = timeNode.text.replace(/Cập nhật lần cuối[:\s]*/i, '').replace(/\s+/g, ' ').trim();
                    setLastUpdated(updatedTime);
                }

                let brandGroup = { region: 'Bạc thương hiệu Phú Quý', items: [] as any[] };
                let otherGroup = { region: 'Bạc thương hiệu khác', items: [] as any[] };

                rows.forEach(row => {
                    const tds = row.querySelectorAll('td');
                    if (tds.length >= 4) {
                        let title = normalizeName(tds[0].text);
                        let unit = tds[1].text.trim().toLowerCase() === 'vnđ/kg' ? 'đ/kg' : 'đ/lượng';
                        let buyPrice = tds[2].text.trim();
                        let sellPrice = tds[3].text.trim();

                        const item = { title, unit, buyPrice, sellPrice };

                        if (title.includes('Phú Quý')) {
                            brandGroup.items.push(item);
                        } else {
                            otherGroup.items.push(item);
                        }
                    }
                });

                if (brandGroup.items.length) groupedData.push(brandGroup);
                if (otherGroup.items.length) groupedData.push(otherGroup);
            } else {
                let currentGroup: any = { region: 'Toàn quốc', items: [] };
                let isGroupAdded = false;

                rows.forEach(row => {
                    const th = row.querySelector('th');
                    const tds = row.querySelectorAll('td');

                    if (tds.length === 1 && tds[0].getAttribute('colspan')) {
                        const timeText = tds[0].text.trim();
                        const timeMatch = timeText.match(/Cập nhật lúc\s+([0-9:]+\s+[0-9/]+)/i);
                        if (timeMatch) {
                            updatedTime = timeMatch[1];
                            setLastUpdated(updatedTime);
                        }
                        return;
                    }

                    if (th && th.getAttribute('rowspan')) {
                        currentGroup = { region: th.text.trim(), items: [] };
                        groupedData.push(currentGroup);
                        isGroupAdded = true;
                        if (tds.length >= 3) {
                            currentGroup.items.push({
                                title: tds[0].text.trim(),
                                unit: 'k/lượng',
                                buyPrice: tds[1].text.trim(),
                                sellPrice: tds[2].text.trim()
                            });
                        }
                    } else if (th && !th.getAttribute('rowspan') && tds.length >= 2) {
                        if (!isGroupAdded) {
                            groupedData.push(currentGroup);
                            isGroupAdded = true;
                        }
                        currentGroup.items.push({
                            title: th.text.trim(),
                            unit: 'k/lượng',
                            buyPrice: tds[0].text.trim(),
                            sellPrice: tds[1].text.trim()
                        });
                    } else if (!th && tds.length >= 3) {
                        if (!isGroupAdded) {
                            groupedData.push(currentGroup);
                            isGroupAdded = true;
                        }
                        currentGroup.items.push({
                            title: tds[0].text.trim(),
                            unit: 'k/lượng',
                            buyPrice: tds[1].text.trim(),
                            sellPrice: tds[2].text.trim()
                        });
                    }
                });
            }

            const finalData = groupedData.filter(g => g.items.length > 0);
            setMarketData(finalData);
            await AsyncStorage.setItem(`cache_metal_${source.id}`, JSON.stringify({ data: finalData, time: updatedTime }));

        } catch (error) {
            setMarketData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMarketData(selectedSource);
    }, [selectedSource]);

    const RegionCard = ({ group }: { group: any }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const maxVisible = 2;
        const hasMore = group.items.length > maxVisible;

        const brandNameForLogo = selectedSource.id === 'bac-phu-quy' ? 'Phú Quý' : selectedSource.name;
        const logoUrl = getLogo(brandNameForLogo);

        const toggleExpand = () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsExpanded(!isExpanded);
        };

        const visibleItems = isExpanded ? group.items : group.items.slice(0, maxVisible);

        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: isDarkMode ? 0 : 0.05 }]}>
                {/* WATERMARK BACKGROUND */}
                <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', zIndex: 0 }]}>
                    {logoUrl && <Image source={{ uri: logoUrl }} style={{ width: 140, height: 140, opacity: 0.05 }} resizeMode="contain" blurRadius={1.5} />}
                </View>

                {/* SỬ DỤNG ICON MẶC ĐỊNH (COINS) */}
                <View style={[styles.cardHeader, { borderBottomColor: colors.border, zIndex: 1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.iconBox, { backgroundColor: selectedSource.type === 'silver' ? '#bdc3c730' : '#F1C40F15' }]}>
                            <Coins size={18} color={selectedSource.type === 'silver' ? "#7f8c8d" : "#F1C40F"} />
                        </View>
                        <Text style={[styles.regionName, { color: colors.textPrimary }]}>{group.region}</Text>
                    </View>
                </View>

                <View style={[styles.tableHeaderRow, { zIndex: 1 }]}>
                    <Text style={[styles.colTitle, { flex: 2, color: colors.textSecondary }]}>Loại sản phẩm</Text>
                    <Text style={[styles.colPriceTitle, { color: colors.textSecondary }]}>Mua vào</Text>
                    <Text style={[styles.colPriceTitle, { color: colors.textSecondary }]}>Bán ra</Text>
                </View>

                {visibleItems.map((gItem: any, idx: number) => {
                    const isLast = idx === visibleItems.length - 1;
                    return (
                        <View key={idx} style={[styles.tableRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }, { zIndex: 1 }]}>
                            <View style={{ flex: 2, paddingRight: 8 }}>
                                <Text style={[styles.itemTitleText, { color: colors.textPrimary }]} numberOfLines={2}>
                                    {gItem.title}
                                </Text>
                            </View>
                            <View style={styles.priceCell}>
                                <Text style={[styles.priceValueText, { color: colors.downColor }]} numberOfLines={1} adjustsFontSizeToFit>
                                    {gItem.buyPrice}
                                </Text>
                                <Text style={styles.unitText}>{gItem.unit}</Text>
                            </View>
                            <View style={styles.priceCell}>
                                <Text style={[styles.priceValueText, { color: colors.upColor }]} numberOfLines={1} adjustsFontSizeToFit>
                                    {gItem.sellPrice}
                                </Text>
                                <Text style={styles.unitText}>{gItem.unit}</Text>
                            </View>
                        </View>
                    );
                })}

                {selectedSource.id === 'bac-phu-quy' && group.region === 'Bạc thương hiệu khác' && (
                    <View style={{ padding: 12, zIndex: 1 }}>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, fontStyle: 'italic' }}>
                            Quý khách lưu ý: Bạc thương hiệu khác chỉ giao dịch tại Số 30 Trần Nhân Tông, Phường Hai Bà Trưng, TP Hà Nội, Việt Nam.
                        </Text>
                    </View>
                )}

                {hasMore && (
                    <TouchableOpacity onPress={toggleExpand} style={[styles.expandBtn, { borderTopColor: colors.border, zIndex: 1 }]}>
                        <Text style={[styles.expandText, { color: colors.primary }]}>
                            {isExpanded ? 'Thu gọn' : `Xem thêm ${group.items.length - maxVisible} loại`}
                        </Text>
                        {isExpanded ? <ChevronUp size={16} color={colors.primary} /> : <ChevronDown size={16} color={colors.primary} />}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <SafeAreaView style={styles.headerContainer} edges={['top', 'left', 'right']}>
                <View style={styles.topBar}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Giá vàng bạc</Text>
                        <Text style={[styles.updateText, { color: colors.textSecondary }]}>Cập nhật: {lastUpdated || '--:--'}</Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsWrapper}>
                    {MARKET_SOURCES.map((source) => {
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
                                <Text style={[styles.tabText, { color: isActive ? '#FFF' : colors.textSecondary }]}>
                                    {source.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
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
                        Chú ý: Đơn vị tính được ghi chú ngay dưới mức giá
                    </Text>
                </View>
            </View>

            <View style={styles.body}>
                {loading && !isOffline ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={marketData}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => <RegionCard group={item} />}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>Không có dữ liệu cho hệ thống này.</Text>}
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
    card: { borderRadius: 20, borderWidth: 1, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, overflow: 'hidden' },
    cardHeader: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    logo: { width: 36, height: 36, marginRight: 12, borderRadius: 8 },
    iconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    regionName: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
    tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10 },
    colTitle: { fontSize: 12, fontWeight: '700' },
    colPriceTitle: { width: 85, textAlign: 'right', fontSize: 12, fontWeight: '700' },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    itemTitleText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    priceCell: { width: 85, alignItems: 'flex-end', justifyContent: 'center' },
    priceValueText: { fontSize: 15, fontWeight: '800' },
    unitText: { fontSize: 10, color: '#7f8c8d', fontWeight: '500', marginTop: 2 },
    expandBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderTopWidth: 1, gap: 4 },
    expandText: { fontSize: 13, fontWeight: '700' },
});