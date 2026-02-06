import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import axios from 'axios';
import { formatCurrency, formatDate, getPreviousDay } from '../utils/helpers';
import { X, TrendingUp, TrendingDown } from 'lucide-react-native';

interface GasDetailModalProps {
    visible: boolean;
    onClose: () => void;
    gasItem: any;
    provider: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const GasDetailModal: React.FC<GasDetailModalProps> = ({ visible, onClose, gasItem, provider }) => {
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible && gasItem) {
            fetchHistory();
        } else {
            setHistoryData([]);
            setLoading(true);
        }
    }, [visible, gasItem]);

    const fetchHistory = async () => {
        setLoading(true);
        const history: any[] = [];
        const isPetrolimex = provider === 'Petrolimex';

        const currentZone1 = gasItem.zone1_price || 0;
        const currentZone2 = gasItem.zone2_price || 0;
        const currentPrice = gasItem.price || 0;

        history.push({
            date: gasItem.date || new Date().toISOString().substring(0, 10),
            price1: isPetrolimex ? currentZone1 : currentPrice,
            price2: isPetrolimex ? currentZone2 : 0,
            change1: 0,
            change2: 0
        });

        let checkDate = getPreviousDay(new Date().toISOString().substring(0, 10));
        let lastPrice1 = isPetrolimex ? currentZone1 : currentPrice;
        let lastPrice2 = isPetrolimex ? currentZone2 : 0;

        let attempts = 0;
        const maxAttempts = 60;

        try {
            while (history.length < 6 && attempts < maxAttempts) {
                await delay(500);

                const apiUrl = `https://giaxanghomnay.com/api/pvdate/${checkDate}`;
                try {
                    const response = await axios.get(apiUrl);
                    let foundItem = null;

                    if (Array.isArray(response.data)) {
                        const dataIndex = isPetrolimex ? 0 : 1;
                        const dayData = response.data[dataIndex];
                        if (Array.isArray(dayData)) {
                            foundItem = dayData.find((i: any) => i.title === gasItem.title);
                        }
                    }

                    if (foundItem) {
                        const price1 = isPetrolimex ? foundItem.zone1_price : foundItem.price;
                        const price2 = isPetrolimex ? foundItem.zone2_price : 0;

                        if (price1 !== lastPrice1) {
                            history.push({
                                date: checkDate,
                                price1: price1,
                                price2: price2,
                                change1: 0,
                                change2: 0
                            });
                            lastPrice1 = price1;
                            lastPrice2 = price2;
                        }
                    }
                } catch (err: any) {
                    if (err.response && err.response.status === 429) break;
                }
                checkDate = getPreviousDay(checkDate);
                attempts++;
            }

            for (let i = 0; i < history.length - 1; i++) {
                const current = history[i];
                const prev = history[i + 1];
                current.change1 = current.price1 - prev.price1;
                current.change2 = current.price2 - prev.price2;
            }

            setHistoryData(history.slice(0, 5));

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderChangeBadge = (change: number) => {
        if (change === 0) return <Text style={{ fontSize: 12, color: '#bdc3c7' }}>-</Text>;

        let TrendIcon = change > 0 ? TrendingUp : TrendingDown;
        let color = change > 0 ? '#e74c3c' : '#27ae60';

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TrendIcon size={12} color={color} style={{ marginRight: 2 }} />
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: color }}>
                    {Math.abs(change)}
                </Text>
            </View>
        );
    };

    const renderHistoryItem = ({ item, index }: { item: any, index: number }) => {
        const isPetrolimex = provider === 'Petrolimex';
        const displayDate = formatDate(item.date, index === 0 ? 0 : 1);

        return (
            <View style={styles.historyRow}>
                {/* Cột Ngày */}
                <View style={[styles.colDate, isPetrolimex ? { flex: 0.8 } : { flex: 1 }]}>
                    <Text style={styles.historyDate}>{displayDate}</Text>
                    {index === 0 && <Text style={styles.newBadge}>Hiện tại</Text>}
                </View>

                {isPetrolimex ? (
                    <>
                        <View style={styles.colPriceMulti}>
                            <Text style={styles.priceText}>{formatCurrency(item.price1)}</Text>
                            <View style={{ marginTop: 2 }}>{renderChangeBadge(item.change1)}</View>
                        </View>
                        <View style={styles.verticalLine} />
                        <View style={styles.colPriceMulti}>
                            <Text style={[styles.priceText, { color: '#c0392b' }]}>{formatCurrency(item.price2)}</Text>
                            <View style={{ marginTop: 2 }}>{renderChangeBadge(item.change2)}</View>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.colPriceSingle}>
                            <Text style={[styles.priceText, { fontSize: 16 }]}>{formatCurrency(item.price1)} <Text style={{ fontSize: 11, color: '#999' }}>đ</Text></Text>
                        </View>
                        <View style={styles.colChangeSingle}>
                            {item.change1 !== 0 ? (
                                <View style={[styles.badgeBox, { backgroundColor: item.change1 > 0 ? '#FDEDEC' : '#E8F8F5' }]}>
                                    {renderChangeBadge(item.change1)}
                                </View>
                            ) : (
                                <Text style={{ color: '#bdc3c7', fontSize: 12 }}>Gốc</Text>
                            )}
                        </View>
                    </>
                )}
            </View>
        );
    };

    const isPetrolimex = provider === 'Petrolimex';

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={styles.content} onPress={() => { }}>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.providerName}>{isPetrolimex ? 'PETROLIMEX' : 'PVOIL'}</Text>
                            <Text style={styles.title}>{gasItem?.title}</Text>
                            <Text style={styles.subtitle}>Lịch sử 5 lần điều chỉnh giá gần nhất</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        {loading ? (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size="large" color="#e67e22" />
                                <Text style={styles.loadingText}>Đang dò tìm dữ liệu...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={historyData}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={renderHistoryItem}
                                contentContainerStyle={styles.listContent}
                                ListHeaderComponent={
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.headText, isPetrolimex ? { flex: 0.8 } : { flex: 1 }, { textAlign: 'left' }]}>Ngày</Text>
                                        {isPetrolimex ? (
                                            <>
                                                <Text style={[styles.headText, { flex: 1 }]}>Vùng 1</Text>
                                                <Text style={[styles.headText, { flex: 1 }]}>Vùng 2</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Text style={[styles.headText, { flex: 1 }]}>Giá (VNĐ)</Text>
                                                <Text style={[styles.headText, { flex: 1, textAlign: 'right' }]}>Thay đổi</Text>
                                            </>
                                        )}
                                    </View>
                                }
                                ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy dữ liệu.</Text>}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    content: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', overflow: 'hidden' },
    header: { padding: 20, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'flex-start' },
    providerName: { fontSize: 10, fontWeight: 'bold', color: '#e67e22', marginBottom: 2, letterSpacing: 1, textTransform: 'uppercase' },
    title: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 2 },
    subtitle: { fontSize: 13, color: '#95a5a6' },
    closeBtn: { padding: 8, backgroundColor: '#eee', borderRadius: 20 },

    body: { flex: 1 },
    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#333', fontWeight: '600' },
    listContent: { padding: 20 },

    tableHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 5, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
    headText: { fontSize: 12, fontWeight: 'bold', color: '#bdc3c7', textAlign: 'center' },

    historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },

    colDate: { justifyContent: 'center' },
    historyDate: { fontSize: 14, fontWeight: '600', color: '#2c3e50' },
    newBadge: { fontSize: 10, color: '#e67e22', fontWeight: 'bold', marginTop: 2 },

    colPriceMulti: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    verticalLine: { width: 1, height: '80%', backgroundColor: '#eee', marginHorizontal: 5 },

    colPriceSingle: { flex: 1, alignItems: 'center' },
    colChangeSingle: { flex: 1, alignItems: 'flex-end' },

    priceText: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    badgeBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 30 }
});