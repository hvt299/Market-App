import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { Coins } from 'lucide-react-native';
import { CARD_STYLES, getLogo } from '../utils/helpers';

const GOLD_SOURCES = [
    { id: 'sjc', name: 'SJC', url: 'https://giavang.org/trong-nuoc/sjc/' },
    { id: 'doji', name: 'DOJI', url: 'https://giavang.org/trong-nuoc/doji/' },
    { id: 'pnj', name: 'PNJ', url: 'https://giavang.org/trong-nuoc/pnj/' },
];

export default function GoldPriceScreen() {
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
                setLastUpdated(timeNode.text.trim());
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

    const renderItem = ({ item }: { item: any }) => {
        const logoUrl = getLogo(selectedSource.name);

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" /> :
                        <Coins size={32} color="#f1c40f" style={{ marginRight: 10 }} />}
                    <Text style={styles.itemTitle}>{item.title}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceContainer}>
                    <View style={styles.priceBox}>
                        <Text style={styles.priceLabel}>MUA VÀO</Text>
                        <Text style={[styles.priceValue, { color: '#27ae60' }]}>{item.buyPrice}</Text>
                        <Text style={styles.currency}>k/lượng</Text>
                    </View>
                    <View style={styles.verticalLine} />
                    <View style={styles.priceBox}>
                        <Text style={styles.priceLabel}>BÁN RA</Text>
                        <Text style={[styles.priceValue, { color: '#e74c3c' }]}>{item.sellPrice}</Text>
                        <Text style={styles.currency}>k/lượng</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.headerContainer} edges={['top', 'left', 'right']}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>GIÁ VÀNG {selectedSource.name}</Text>
                    {lastUpdated ? <Text style={styles.subHeader}>{lastUpdated}</Text> : null}
                </View>
                {/* Tabs Source */}
                <View style={styles.tabsWrapper}>
                    {GOLD_SOURCES.map((source) => (
                        <TouchableOpacity
                            key={source.id}
                            style={[styles.tabItem, selectedSource.id === source.id && styles.activeTab]}
                            onPress={() => setSelectedSource(source)}
                        >
                            <Text style={[styles.tabText, selectedSource.id === source.id && styles.activeTabText]}>{source.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </SafeAreaView>

            <View style={styles.body}>
                {loading ? <ActivityIndicator size="large" color="#e67e22" style={{ marginTop: 50 }} /> :
                    <FlatList data={goldData} renderItem={renderItem} contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
                }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    headerContainer: { backgroundColor: '#1e272e', paddingBottom: 10 },
    headerContent: { alignItems: 'center', marginBottom: 10, paddingTop: 10 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
    subHeader: { fontSize: 11, color: '#bdc3c7', marginTop: 2, fontStyle: 'italic' },

    tabsWrapper: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 4 },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
    activeTab: { backgroundColor: '#e67e22' },
    tabText: { color: '#bdc3c7', fontWeight: '600', fontSize: 13 },
    activeTabText: { color: '#FFF' },

    body: { flex: 1 },
    list: { padding: 16 },

    card: { ...CARD_STYLES },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    logo: { width: 32, height: 32, marginRight: 10 },
    itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
    divider: { height: 1, backgroundColor: '#eee', marginBottom: 12 },
    priceContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    priceBox: { flex: 1, alignItems: 'center' },
    verticalLine: { width: 1, backgroundColor: '#eee', marginHorizontal: 10 },
    priceLabel: { fontSize: 11, fontWeight: '700', color: '#95a5a6', marginBottom: 4 },
    priceValue: { fontSize: 20, fontWeight: 'bold' },
    currency: { fontSize: 10, color: '#bdc3c7' }
});