import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, RefreshControl, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const GOLD_SOURCES = [
    { id: 'sjc', name: 'SJC', url: 'https://giavang.org/trong-nuoc/sjc/' },
    { id: 'doji', name: 'DOJI', url: 'https://giavang.org/trong-nuoc/doji/' },
    { id: 'pnj', name: 'PNJ', url: 'https://giavang.org/trong-nuoc/pnj/' },
];

export default function GoldPriceScreen() {
    const [selectedSource, setSelectedSource] = useState(GOLD_SOURCES[0]);
    const [goldData, setGoldData] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>(''); // State lưu thời gian
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

            // 1. LẤY THỜI GIAN CẬP NHẬT
            // Tìm thẻ small nằm trong h1 (theo cấu trúc HTML bạn cung cấp)
            const timeNode = root.querySelector('h1.box-headline small');
            if (timeNode) {
                // timeNode.text sẽ là "Cập nhật lúc 10:35:28 30/12/2025"
                setLastUpdated(timeNode.text.trim());
            } else {
                setLastUpdated('');
            }

            // 2. LẤY DỮ LIỆU BẢNG GIÁ
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

                        items.push({
                            id: index.toString(),
                            title,
                            buyPrice,
                            sellPrice
                        });
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

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="ring" size={24} color="#f1c40f" />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
                <View style={styles.priceCol}>
                    <Text style={styles.label}>MUA VÀO</Text>
                    <Text style={styles.buyPrice}>{item.buyPrice}</Text>
                    <Text style={styles.unit}>k/lượng</Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.priceCol}>
                    <Text style={styles.label}>BÁN RA</Text>
                    <Text style={styles.sellPrice}>{item.sellPrice}</Text>
                    <Text style={styles.unit}>k/lượng</Text>
                </View>
            </View>
        </View>
    );

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
            <SafeAreaView style={{ flex: 0, backgroundColor: '#2c3e50' }} edges={['top']} />
            <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>GIÁ VÀNG TRONG NƯỚC</Text>
                    {/* HIỂN THỊ THỜI GIAN CẬP NHẬT */}
                    {lastUpdated ? (
                        <Text style={styles.lastUpdatedText}>{lastUpdated}</Text>
                    ) : null}

                    <View style={styles.sourceTabsContainer}>
                        {GOLD_SOURCES.map((source) => (
                            <TouchableOpacity
                                key={source.id}
                                style={[styles.tabButton, selectedSource.id === source.id && styles.activeTab]}
                                onPress={() => setSelectedSource(source)}
                            >
                                <Text style={[styles.tabText, selectedSource.id === source.id && styles.activeTabText]}>
                                    {source.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.body}>
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#e67e22" />
                            <Text style={{ marginTop: 10, color: '#7f8c8d' }}>Đang cập nhật giá...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={goldData}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={styles.list}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e67e22']} />}
                            ListEmptyComponent={<Text style={styles.emptyText}>Không lấy được dữ liệu.</Text>}
                            ListFooterComponent={<View style={{ height: 20 }} />}
                        />
                    )}
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ecf0f1' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#2c3e50',
        padding: 15, paddingBottom: 20, alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5, zIndex: 10
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 5, letterSpacing: 1 },
    // Style cho dòng thời gian cập nhật
    lastUpdatedText: { fontSize: 12, color: '#bdc3c7', marginBottom: 15, fontStyle: 'italic' },

    sourceTabsContainer: {
        flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 25, padding: 4,
        width: '100%', justifyContent: 'space-between'
    },
    tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20 },
    activeTab: { backgroundColor: '#e67e22', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 2 },
    tabText: { color: '#bdc3c7', fontWeight: '600', fontSize: 13 },
    activeTabText: { color: '#FFF', fontWeight: 'bold' },
    body: { flex: 1 },
    list: { padding: 16 },
    card: {
        backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, padding: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'center' },
    iconContainer: { marginRight: 8 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    priceCol: { flex: 1, alignItems: 'center' },
    verticalLine: { width: 1, backgroundColor: '#ecf0f1', marginHorizontal: 10 },
    label: { fontSize: 12, fontWeight: '700', color: '#7f8c8d', marginBottom: 4 },
    buyPrice: { fontSize: 22, fontWeight: 'bold', color: '#27ae60' },
    sellPrice: { fontSize: 22, fontWeight: 'bold', color: '#c0392b' },
    unit: { fontSize: 11, color: '#95a5a6', marginTop: 2 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#7f8c8d' }
});