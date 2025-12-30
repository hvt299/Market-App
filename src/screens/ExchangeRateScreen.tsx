import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, RefreshControl, StatusBar, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Danh sách nguồn dữ liệu (Ngân hàng)
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

            // 1. LẤY THỜI GIAN CẬP NHẬT
            // Tìm thẻ h2 chứa thông tin ngày giờ
            const titleNode = root.querySelector('h2.ut-title');
            if (titleNode) {
                // Lấy nội dung text và xử lý để chỉ lấy phần ngày giờ
                // Ví dụ text gốc: "Tỷ giá ... Ngày 30-12-2025 10:51"
                const fullText = titleNode.text.trim();
                const dateMatch = fullText.match(/Ngày\s+(.*)/);
                if (dateMatch) {
                    setLastUpdated(dateMatch[1]);
                } else {
                    setLastUpdated('');
                }
            }

            // 2. LẤY BẢNG TỶ GIÁ
            const items: any[] = [];
            const rows = root.querySelectorAll('.rc-table-row');

            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                // Cấu trúc cột theo HTML bạn cung cấp:
                // 0: Icon (bỏ qua)
                // 1: Mã NT (AUD, USD...)
                // 2: Mua tiền mặt
                // 3: Mua chuyển khoản
                // 4: Bán tiền mặt
                // 5: Bán chuyển khoản

                if (cells.length >= 6) {
                    // Lấy Mã Tiền Tệ (ví dụ: AUD) - nằm trong thẻ div hoặc text trực tiếp
                    const code = cells[1].text.trim().split(' ')[0]; // Lấy chữ cái đầu tiên (AUD) bỏ phần tên dài
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

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            {/* Header Card: Mã tiền tệ & Tên */}
            <View style={styles.cardHeader}>
                <View style={styles.flagContainer}>
                    {/* Dùng icon tiền tệ chung hoặc text tròn */}
                    <View style={styles.currencyAvatar}>
                        <Text style={styles.currencyText}>{item.code[0]}</Text>
                    </View>
                </View>
                <View>
                    <Text style={styles.currencyCode}>{item.code}</Text>
                    <Text style={styles.currencyName}>{item.name}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Grid Giá: Mua / Bán */}
            <View style={styles.rateContainer}>
                {/* Cột MUA */}
                <View style={styles.rateColumn}>
                    <Text style={styles.colLabel}>MUA VÀO (VNĐ)</Text>
                    <View style={styles.rateRow}>
                        <Text style={styles.rateType}>TM:</Text>
                        <Text style={styles.rateValue}>{item.buyCash}</Text>
                    </View>
                    <View style={styles.rateRow}>
                        <Text style={styles.rateType}>CK:</Text>
                        <Text style={styles.rateValue}>{item.buyTransfer}</Text>
                    </View>
                </View>

                <View style={styles.verticalLine} />

                {/* Cột BÁN */}
                <View style={styles.rateColumn}>
                    <Text style={styles.colLabel}>BÁN RA (VNĐ)</Text>
                    <View style={styles.rateRow}>
                        <Text style={styles.rateType}>TM:</Text>
                        <Text style={styles.rateValue}>{item.sellCash}</Text>
                    </View>
                    <View style={styles.rateRow}>
                        <Text style={styles.rateType}>CK:</Text>
                        <Text style={styles.rateValue}>{item.sellTransfer}</Text>
                    </View>
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
                    <Text style={styles.headerTitle}>TỶ GIÁ NGOẠI TỆ</Text>
                    {lastUpdated ? <Text style={styles.lastUpdated}>Cập nhật: {lastUpdated}</Text> : null}

                    {/* ScrollView Ngang cho danh sách Ngân hàng */}
                    <View style={styles.bankListContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 5 }}>
                            {EXCHANGE_SOURCES.map((bank) => (
                                <TouchableOpacity
                                    key={bank.id}
                                    style={[styles.bankButton, selectedBank.id === bank.id && styles.activeBank]}
                                    onPress={() => setSelectedBank(bank)}
                                >
                                    <Text style={[styles.bankText, selectedBank.id === bank.id && styles.activeBankText]}>
                                        {bank.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                <View style={styles.body}>
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#3498db" />
                            <Text style={{ marginTop: 10, color: '#7f8c8d' }}>Đang tải dữ liệu...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={rates}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={styles.list}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3498db']} />}
                            ListEmptyComponent={<Text style={styles.emptyText}>Không có dữ liệu.</Text>}
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
        paddingVertical: 15, alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5, zIndex: 10
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', letterSpacing: 1 },
    lastUpdated: { fontSize: 12, color: '#bdc3c7', marginTop: 4, fontStyle: 'italic' },

    bankListContainer: { marginTop: 15, height: 40 },
    bankButton: {
        paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 4,
        borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center'
    },
    activeBank: { backgroundColor: '#3498db' },
    bankText: { color: '#bdc3c7', fontWeight: '600' },
    activeBankText: { color: '#FFF', fontWeight: 'bold' },

    body: { flex: 1 },
    list: { padding: 16 },

    // Card Styles
    card: {
        backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12, padding: 12,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    flagContainer: { marginRight: 10 },
    currencyAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ecf0f1', justifyContent: 'center', alignItems: 'center' },
    currencyText: { fontSize: 18, fontWeight: 'bold', color: '#34495e' },
    currencyCode: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    currencyName: { fontSize: 12, color: '#7f8c8d' },

    divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 10 },

    rateContainer: { flexDirection: 'row' },
    rateColumn: { flex: 1 },
    colLabel: { fontSize: 11, fontWeight: '700', color: '#95a5a6', marginBottom: 6, textAlign: 'center' },
    verticalLine: { width: 1, backgroundColor: '#f0f0f0', marginHorizontal: 8 },

    rateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, paddingHorizontal: 4 },
    rateType: { fontSize: 12, color: '#7f8c8d' },
    rateValue: { fontSize: 13, fontWeight: 'bold', color: '#2c3e50' },

    emptyText: { textAlign: 'center', marginTop: 50, color: '#7f8c8d' }
});