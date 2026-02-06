import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { Banknote } from 'lucide-react-native';
import { CARD_STYLES, getLogo } from '../utils/helpers';

const EXCHANGE_SOURCES = [
    { id: 'vcb', name: 'Vietcombank', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-vietcombank.epi' },
    { id: 'bidv', name: 'BIDV', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-bidv.epi' },
    { id: 'agri', name: 'Agribank', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-agribank.epi' },
    { id: 'hdb', name: 'HDBank', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-hdbank.epi' },
    { id: 'tpb', name: 'TPBank', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-tpbank.epi' },
    { id: 'nhnn', name: 'NHNN', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-nhnn.epi' },
];

export default function ExchangeRateScreen() {
    const [selectedBank, setSelectedBank] = useState(EXCHANGE_SOURCES[0]);
    const [rates, setRates] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchExchangeRates(selectedBank.url);
    }, [selectedBank]);

    const fetchExchangeRates = async (url: string) => {
        setLoading(true);
        try {
            const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = response.data;
            const root = parse(html);

            const titleNode = root.querySelector('h2.ut-title');
            if (titleNode) {
                const fullText = titleNode.text.trim();
                const dateMatch = fullText.match(/Ngày\s+(.*)/);
                if (dateMatch) {
                    setLastUpdated(dateMatch[1]);
                } else {
                    setLastUpdated('');
                }
            }

            const items: any[] = [];
            const rows = root.querySelectorAll('.rc-table-row');

            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');

                if (cells.length >= 6) {
                    const code = cells[1].text.trim().split(' ')[0];
                    const name = cells[1].querySelector('div.truncate')?.text.trim() || '';

                    const buyCash = cells[2].text.trim();
                    const buyTransfer = cells[3].text.trim();
                    const sellCash = cells[4].text.trim();
                    const sellTransfer = cells[5].text.trim();

                    items.push({
                        id: index.toString(),
                        code,
                        name,
                        buyCash: buyCash === '-' ? '_' : buyCash,
                        buyTransfer: buyTransfer === '-' ? '_' : buyTransfer,
                        sellCash: sellCash === '-' ? '_' : sellCash,
                        sellTransfer: sellTransfer === '-' ? '_' : sellTransfer,
                    });
                }
            });

            setRates(items);

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
        fetchExchangeRates(selectedBank.url);
    }, [selectedBank]);

    const renderItem = ({ item }: { item: any }) => {
        const countryCode = item.code.substring(0, 2);
        const flagUrl = `https://flagsapi.com/${countryCode}/flat/64.png`;

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    {flagUrl ? <Image source={{ uri: flagUrl }} style={styles.flag} resizeMode="contain" /> :
                        <Banknote size={32} color="#27ae60" style={{ marginRight: 10 }} />}
                    <View>
                        <Text style={styles.currencyCode}>{item.code}</Text>
                        <Text style={styles.currencyName}>{item.name}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceContainer}>
                    {/* MUA */}
                    <View style={styles.priceCol}>
                        <Text style={styles.headLabel}>MUA (TM)</Text>
                        <Text style={[styles.priceVal, { color: '#27ae60' }]}>{item.buyCash}</Text>
                    </View>
                    {/* BÁN */}
                    <View style={styles.priceCol}>
                        <Text style={styles.headLabel}>BÁN (TM)</Text>
                        <Text style={[styles.priceVal, { color: '#e74c3c' }]}>{item.sellCash}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.headerContainer} edges={['top', 'left', 'right']}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>TỶ GIÁ NGOẠI TỆ</Text>
                </View>
                <View style={{ height: 50 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
                        {EXCHANGE_SOURCES.map((bank) => (
                            <TouchableOpacity
                                key={bank.id}
                                style={[styles.bankChip, selectedBank.id === bank.id && styles.activeChip]}
                                onPress={() => setSelectedBank(bank)}
                            >
                                {/* Có thể thêm logo ngân hàng nhỏ vào đây */}
                                <Text style={[styles.chipText, selectedBank.id === bank.id && styles.activeChipText]}>{bank.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </SafeAreaView>

            <View style={styles.body}>
                {loading ? <ActivityIndicator size="large" color="#1e272e" style={{ marginTop: 50 }} /> :
                    <FlatList
                        data={rates}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    />
                }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    headerContainer: { backgroundColor: '#1e272e', paddingBottom: 10 },
    headerContent: { alignItems: 'center', marginBottom: 15, paddingTop: 10 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

    bankChip: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, justifyContent: 'center' },
    activeChip: { backgroundColor: '#e67e22' },
    chipText: { color: '#bdc3c7', fontWeight: '600' },
    activeChipText: { color: '#FFF' },

    body: { flex: 1 },
    list: { padding: 16 },
    card: { ...CARD_STYLES },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    flag: { width: 36, height: 36, marginRight: 12, borderRadius: 18, backgroundColor: '#f0f0f0' },
    currencyCode: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    currencyName: { fontSize: 12, color: '#95a5a6' },
    divider: { height: 1, backgroundColor: '#eee', marginBottom: 10 },
    priceContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    priceCol: { flex: 1, alignItems: 'center' },
    headLabel: { fontSize: 11, fontWeight: '700', color: '#95a5a6' },
    priceVal: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
});