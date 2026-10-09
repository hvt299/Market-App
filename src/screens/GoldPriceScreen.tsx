import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Image, ScrollView, StatusBar, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Coins, Info, ChevronDown, ChevronUp, WifiOff } from 'lucide-react-native';
import { getLogo } from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/typography';
import { fetchMetalDetailData, METAL_SOURCES, MetalDetailGroup } from '../services/metalService';

export default function GoldPriceScreen({ route }: any) {
    const { colors, isDarkMode } = useTheme();

    const initialBrandId = route.params?.activeBrand || 'sjc';
    const initialSource = METAL_SOURCES.find(s => s.id === initialBrandId) || METAL_SOURCES[0];

    const [selectedSource, setSelectedSource] = useState(initialSource);
    const [marketData, setMarketData] = useState<MetalDetailGroup[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (route.params?.activeBrand) {
            const source = METAL_SOURCES.find(s => s.id === route.params.activeBrand);
            if (source) {
                setSelectedSource(source);
            }
        }
    }, [route.params?.activeBrand]);

    const loadData = useCallback(async (source: typeof METAL_SOURCES[0]) => {
        setLoading(true);
        const res = await fetchMetalDetailData(source);
        setMarketData(res.data);
        setLastUpdated(res.time);
        setIsOffline(res.isOffline);
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadData(selectedSource);
    }, [selectedSource, loadData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData(selectedSource);
    }, [selectedSource, loadData]);

    const RegionCard = ({ group }: { group: MetalDetailGroup }) => {
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
                {/* Watermark Background */}
                <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', zIndex: 0 }]}>
                    {logoUrl && <Image source={{ uri: logoUrl }} style={{ width: 140, height: 140, opacity: 0.05 }} resizeMode="contain" blurRadius={1.5} />}
                </View>

                {/* Card Header */}
                <View style={[styles.cardHeader, { borderBottomColor: colors.border, zIndex: 1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.iconBox, { backgroundColor: selectedSource.type === 'silver' ? '#64748B20' : '#F59E0B20' }]}>
                            <Coins size={18} color={selectedSource.type === 'silver' ? '#94A3B8' : '#F59E0B'} />
                        </View>
                        <Text style={[styles.regionName, { color: colors.textPrimary }]}>{group.region}</Text>
                    </View>
                </View>

                <View style={[styles.tableHeaderRow, { zIndex: 1 }]}>
                    <Text style={[styles.colTitle, { flex: 2, color: colors.textSecondary }]}>Loại sản phẩm</Text>
                    <Text style={[styles.colPriceTitle, { color: colors.textSecondary }]}>Mua vào</Text>
                    <Text style={[styles.colPriceTitle, { color: colors.textSecondary }]}>Bán ra</Text>
                </View>

                {visibleItems.map((gItem, idx) => {
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
                        <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                            Lưu ý: Bạc thương hiệu khác chỉ giao dịch tại Số 30 Trần Nhân Tông, Phường Hai Bà Trưng, TP Hà Nội.
                        </Text>
                    </View>
                )}

                {hasMore && (
                    <TouchableOpacity onPress={toggleExpand} style={[styles.expandBtn, { borderTopColor: colors.border, zIndex: 1 }]} activeOpacity={0.7}>
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
                    {METAL_SOURCES.map((source) => {
                        const isActive = selectedSource.id === source.id;
                        return (
                            <TouchableOpacity
                                key={source.id}
                                style={[
                                    styles.tabItem,
                                    {
                                        backgroundColor: isActive ? colors.primary : colors.surface,
                                        borderColor: isActive ? colors.primary : colors.border
                                    }
                                ]}
                                onPress={() => setSelectedSource(source)}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.tabText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
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
                        <Text style={styles.offlineText}>Ngoại tuyến. Dữ liệu lưu tạm.</Text>
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
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item }) => <RegionCard group={item} />}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>Không có dữ liệu cho hệ thống này.</Text>}
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
    noticeText: { fontSize: 11, fontFamily: FONTS.regular, fontStyle: 'italic', lineHeight: 16 },
    offlineBanner: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 8 },
    offlineText: { color: '#FFF', fontSize: 13, fontFamily: FONTS.bold },
    body: { flex: 1 },
    list: { paddingHorizontal: 16, paddingBottom: 24 },
    emptyText: { textAlign: 'center', marginTop: 40, fontFamily: FONTS.medium },
    card: { borderRadius: 20, borderWidth: 1, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, overflow: 'hidden' },
    cardHeader: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    iconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    regionName: { fontSize: 15, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.3 },
    tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10 },
    colTitle: { fontSize: 12, fontFamily: FONTS.semiBold },
    colPriceTitle: { width: 90, textAlign: 'right', fontSize: 12, fontFamily: FONTS.semiBold },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    itemTitleText: { fontSize: 14, fontFamily: FONTS.medium, lineHeight: 20 },
    priceCell: { width: 90, alignItems: 'flex-end', justifyContent: 'center' },
    priceValueText: { fontSize: 15, fontFamily: FONTS.bold },
    unitText: { fontSize: 10, color: '#94A3B8', fontFamily: FONTS.medium, marginTop: 2 },
    expandBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderTopWidth: 1, gap: 4 },
    expandText: { fontSize: 13, fontFamily: FONTS.semiBold },
});