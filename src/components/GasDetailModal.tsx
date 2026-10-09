import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import axios from 'axios';
import { formatCurrency, formatDate, getPreviousDay, isFuelTitleMatch, getCleanFuelDisplayTitle } from '../utils/helpers';
import { X, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/typography';
import { TrendBadge } from './common/TrendBadge';

interface GasDetailModalProps {
    visible: boolean;
    onClose: () => void;
    gasItem: any;
    provider: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const GasDetailModal: React.FC<GasDetailModalProps> = ({ visible, onClose, gasItem, provider }) => {
    const { colors, isDarkMode } = useTheme();
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
            change2: 0,
        });

        let checkDate = getPreviousDay(new Date().toISOString().substring(0, 10));
        let lastPrice1 = isPetrolimex ? currentZone1 : currentPrice;
        let lastPrice2 = isPetrolimex ? currentZone2 : 0;

        let attempts = 0;
        const maxAttempts = 60;

        try {
            while (history.length < 6 && attempts < maxAttempts) {
                await delay(350);

                const apiUrl = `https://giaxanghomnay.com/api/pvdate/${checkDate}`;
                try {
                    const response = await axios.get(apiUrl);
                    let foundItem = null;

                    if (Array.isArray(response.data)) {
                        const dataIndex = isPetrolimex ? 0 : 1;
                        const dayData = response.data[dataIndex];
                        if (Array.isArray(dayData)) {
                            foundItem = dayData.find((i: any) => isFuelTitleMatch(i.title, gasItem.title));
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
                                change2: 0,
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

    const isPetrolimex = provider === 'Petrolimex';

    const renderHistoryItem = ({ item, index }: { item: any, index: number }) => {
        const displayDate = formatDate(item.date, index === 0 ? 0 : 1);

        return (
            <View style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                {/* Cột Ngày */}
                <View style={[styles.colDate, isPetrolimex ? { flex: 0.9 } : { flex: 1 }]}>
                    <Text style={[styles.historyDate, { color: colors.textPrimary }]}>{displayDate}</Text>
                    {index === 0 && <Text style={[styles.newBadge, { color: colors.primary }]}>Hiện tại</Text>}
                </View>

                {isPetrolimex ? (
                    <>
                        <View style={styles.colPriceMulti}>
                            <Text style={[styles.priceText, { color: colors.textPrimary }]}>{formatCurrency(item.price1)}</Text>
                            <View style={{ marginTop: 2 }}><TrendBadge value={item.change1} size="sm" /></View>
                        </View>
                        <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />
                        <View style={styles.colPriceMulti}>
                            <Text style={[styles.priceText, { color: colors.secondary }]}>{formatCurrency(item.price2)}</Text>
                            <View style={{ marginTop: 2 }}><TrendBadge value={item.change2} size="sm" /></View>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.colPriceSingle}>
                            <Text style={[styles.priceText, { color: colors.textPrimary, fontSize: 16 }]}>
                                {formatCurrency(item.price1)} <Text style={{ fontSize: 11, color: colors.textSecondary }}>đ</Text>
                            </Text>
                        </View>
                        <View style={styles.colChangeSingle}>
                            <TrendBadge value={item.change1} />
                        </View>
                    </>
                )}
            </View>
        );
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.content, { backgroundColor: colors.surface }]} onPress={() => { }}>
                    <View style={[styles.header, { backgroundColor: colors.surfaceSubtle, borderBottomColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.providerName, { color: colors.primary }]}>{isPetrolimex ? 'PETROLIMEX' : 'PVOIL'}</Text>
                            <Text style={[styles.title, { color: colors.textPrimary }]}>{getCleanFuelDisplayTitle(gasItem?.title)}</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Lịch sử 5 lần điều chỉnh giá gần nhất</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.border }]}>
                            <X size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        {loading ? (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang dò tìm dữ liệu...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={historyData}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={renderHistoryItem}
                                contentContainerStyle={styles.listContent}
                                ListHeaderComponent={
                                    <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.headText, isPetrolimex ? { flex: 0.9 } : { flex: 1 }, { textAlign: 'left', color: colors.textSecondary }]}>Ngày</Text>
                                        {isPetrolimex ? (
                                            <>
                                                <Text style={[styles.headText, { flex: 1, color: colors.textSecondary }]}>Vùng 1</Text>
                                                <Text style={[styles.headText, { flex: 1, color: colors.textSecondary }]}>Vùng 2</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Text style={[styles.headText, { flex: 1, color: colors.textSecondary }]}>Giá (VNĐ)</Text>
                                                <Text style={[styles.headText, { flex: 1, textAlign: 'right', color: colors.textSecondary }]}>Thay đổi</Text>
                                            </>
                                        )}
                                    </View>
                                }
                                ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>Không tìm thấy dữ liệu.</Text>}
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
    content: { borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '70%', overflow: 'hidden' },
    header: { padding: 20, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'flex-start' },
    providerName: { fontFamily: FONTS.bold, fontSize: 11, marginBottom: 2, letterSpacing: 1, textTransform: 'uppercase' },
    title: { fontFamily: FONTS.extraBold, fontSize: 18, marginBottom: 2 },
    subtitle: { fontFamily: FONTS.regular, fontSize: 13 },
    closeBtn: { padding: 6, borderRadius: 20 },

    body: { flex: 1 },
    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontFamily: FONTS.semiBold, fontSize: 13 },
    listContent: { padding: 20 },

    tableHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 5, borderBottomWidth: 1, paddingBottom: 10 },
    headText: { fontFamily: FONTS.bold, fontSize: 12, textAlign: 'center' },

    historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },

    colDate: { justifyContent: 'center' },
    historyDate: { fontFamily: FONTS.semiBold, fontSize: 13 },
    newBadge: { fontFamily: FONTS.bold, fontSize: 10, marginTop: 2 },

    colPriceMulti: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    verticalLine: { width: 1, height: '80%', marginHorizontal: 5 },

    colPriceSingle: { flex: 1, alignItems: 'center' },
    colChangeSingle: { flex: 1, alignItems: 'flex-end' },

    priceText: { fontFamily: FONTS.bold, fontSize: 15 },
    emptyText: { textAlign: 'center', marginTop: 30, fontFamily: FONTS.medium, fontSize: 14 }
});