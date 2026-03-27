import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, StatusBar, RefreshControl, Alert, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { Search, SlidersHorizontal, Info, CircleHelp, X } from 'lucide-react-native';

import { GasItemCard } from '../components/GasItemCard';
import { ZoneModal } from '../components/ZoneModal';
import { getPreviousDay, formatDate } from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';

const PROVIDERS = [
    { id: 'Petrolimex', name: 'Petrolimex' },
    { id: 'Pvoil', name: 'PVOIL' },
];

const FILTERS = ['Tất cả', 'Xăng', 'Dầu'];

export default function GasPriceScreen({ navigation }: any) {
    const { colors, isDarkMode } = useTheme();

    const [gasData, setGasData] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
    const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
    const [searchQuery, setSearchQuery] = useState('');

    const [tempProvider, setTempProvider] = useState(PROVIDERS[0]);
    const [tempFilter, setTempFilter] = useState(FILTERS[0]);

    const [modalVisible, setModalVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    const [rawData, setRawData] = useState<any>(null);

    useEffect(() => {
        fetchGasPrices();
    }, []);

    const fetchGasPrices = async (dateStr?: string) => {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            setLoading(false); setRefreshing(false);
            Alert.alert("Mất kết nối", "Vui lòng kiểm tra lại đường truyền internet.");
            return;
        }

        try {
            let targetDate = dateStr || new Date().toISOString().substring(0, 10);
            const apiUrl = `https://giaxanghomnay.com/api/pvdate/${targetDate}`;
            const response = await axios.get(apiUrl);

            if (Array.isArray(response.data) && response.data.length >= 2) {
                setRawData(response.data);
                processDataForProvider(response.data, selectedProvider.id);
            } else {
                const yesterday = getPreviousDay(targetDate);
                if (dateStr !== yesterday) {
                    await fetchGasPrices(yesterday);
                    return;
                }
            }
        } catch (error) {
            if (!dateStr) {
                const yesterdayStr = getPreviousDay(new Date().toISOString().split('T')[0]);
                await fetchGasPrices(yesterdayStr);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const processDataForProvider = (data: any, providerId: string) => {
        if (!data) return;

        const isPetrolimex = providerId === 'Petrolimex';
        const todayData = isPetrolimex ? (data[0] || []) : (data[1] || []);
        const yesterdayData = isPetrolimex ? (data[2] || []) : (data[3] || []);

        const combinedData = todayData.map((todayItem: any) => {
            const yesterdayItem = yesterdayData.find((y: any) => y.title === todayItem.title);
            let change1 = 0;
            let change2 = 0;

            if (yesterdayItem) {
                const tPrice1 = isPetrolimex ? todayItem.zone1_price : todayItem.price;
                const yPrice1 = isPetrolimex ? yesterdayItem.zone1_price : yesterdayItem.price;
                change1 = tPrice1 - yPrice1;

                if (isPetrolimex) {
                    const tPrice2 = todayItem.zone2_price || 0;
                    const yPrice2 = yesterdayItem.zone2_price || 0;
                    change2 = tPrice2 - yPrice2;
                }
            }
            return { ...todayItem, change1, change2 };
        });

        setGasData(combinedData);
        if (combinedData.length > 0 && combinedData[0].date) {
            setLastUpdated(formatDate(combinedData[0].date));
        }
    };

    const openFilterModal = () => {
        setTempProvider(selectedProvider);
        setTempFilter(selectedFilter);
        setFilterModalVisible(true);
    };

    const handleApplyFilters = () => {
        setSelectedProvider(tempProvider);
        setSelectedFilter(tempFilter);
        processDataForProvider(rawData, tempProvider.id);
        setFilterModalVisible(false);
    };

    const handleClearFilters = () => {
        setTempProvider(PROVIDERS[0]);
        setTempFilter(FILTERS[0]);
        setSelectedProvider(PROVIDERS[0]);
        setSelectedFilter(FILTERS[0]);
        processDataForProvider(rawData, PROVIDERS[0].id);
        setFilterModalVisible(false);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchGasPrices();
    };

    const handlePressItem = (item: any) => {
        navigation.navigate('GasDetail', { gasItem: item, provider: selectedProvider.id });
    };

    const filteredData = gasData.filter(item => {
        const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchType =
            selectedFilter === 'Tất cả' ? true :
                selectedFilter === 'Xăng' ? item.title.toLowerCase().includes('xăng') || item.title.toLowerCase().includes('ron') :
                    item.title.toLowerCase().includes('do') || item.title.toLowerCase().includes('dầu') || item.title.toLowerCase().includes('ko');

        return matchSearch && matchType;
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <SafeAreaView style={styles.headerContainer} edges={['top', 'left', 'right']}>
                <View style={styles.topBar}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Giá xăng dầu</Text>
                        <Text style={[styles.updateText, { color: colors.textSecondary }]}>Cập nhật: {lastUpdated}</Text>
                    </View>
                    {selectedProvider.id === 'Petrolimex' && (
                        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.helpBtn}>
                            <CircleHelp size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.searchWrapper}>
                    <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Search size={20} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                        <TextInput
                            placeholder="Tìm kiếm xăng, dầu..."
                            placeholderTextColor={colors.textSecondary}
                            style={[styles.searchInput, { color: colors.textPrimary }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity onPress={openFilterModal} style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <SlidersHorizontal size={20} color={colors.primary} />
                        {(selectedProvider.id !== 'Petrolimex' || selectedFilter !== 'Tất cả') && (
                            <View style={styles.filterDot} />
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.infoSection}>
                <View style={styles.legendRow}>
                    <Info size={14} color={colors.textSecondary} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                        Giá bên phải: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Vùng 1 (Trên)</Text> - <Text style={{ fontWeight: '700', color: colors.textSecondary }}>Vùng 2 (Dưới)</Text>
                    </Text>
                </View>
            </View>

            <View style={styles.body}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <GasItemCard item={item} providerId={selectedProvider.id} onPress={() => handlePressItem(item)} />
                        )}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>Không tìm thấy loại nhiên liệu nào.</Text>}
                    />
                )}
            </View>

            {/* --- MODAL CHÚ THÍCH VÙNG 2 --- */}
            <ZoneModal visible={modalVisible} onClose={() => setModalVisible(false)} />

            {/* --- MODAL BỘ LỌC (Sử dụng State Tạm) --- */}
            <Modal visible={filterModalVisible} transparent animationType="fade" statusBarTranslucent>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterModalVisible(false)}>
                    <TouchableOpacity activeOpacity={1} style={[styles.filterModalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.filterModalHeader}>
                            <Text style={[styles.filterModalTitle, { color: colors.textPrimary }]}>Bộ lọc hiển thị</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={[styles.closeModalBtn, { backgroundColor: colors.border }]}>
                                <X size={22} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.filterSectionTitle, { color: colors.textPrimary }]}>Nhà cung cấp</Text>
                        <View style={styles.filterOptions}>
                            {PROVIDERS.map((p) => (
                                <TouchableOpacity key={p.id} onPress={() => setTempProvider(p)}
                                    style={[styles.filterChip, tempProvider.id === p.id ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: 'transparent', borderColor: colors.border }]}>
                                    <Text style={[styles.filterChipText, { color: tempProvider.id === p.id ? '#FFF' : colors.textSecondary }]}>{p.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.filterSectionTitle, { color: colors.textPrimary }]}>Loại nhiên liệu</Text>
                        <View style={styles.filterOptions}>
                            {FILTERS.map((f) => (
                                <TouchableOpacity key={f} onPress={() => setTempFilter(f)}
                                    style={[styles.filterChip, tempFilter === f ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: 'transparent', borderColor: colors.border }]}>
                                    <Text style={[styles.filterChipText, { color: tempFilter === f ? '#FFF' : colors.textSecondary }]}>{f}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.filterActions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }]} onPress={handleClearFilters}>
                                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Xóa bộ lọc</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleApplyFilters}>
                                <Text style={{ color: '#FFF', fontWeight: '700' }}>Áp dụng</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: { paddingBottom: 0, paddingTop: 10 },

    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
    headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    updateText: { fontSize: 13, fontWeight: '600', marginTop: 2 },
    helpBtn: { padding: 4 },

    searchWrapper: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, marginRight: 10 },
    searchInput: { flex: 1, height: 44, paddingHorizontal: 10, fontSize: 15 },
    filterBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    filterDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#e74c3c' },

    infoSection: { paddingHorizontal: 20, paddingBottom: 10 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendText: { fontSize: 12 },

    body: { flex: 1 },
    list: { paddingHorizontal: 16, paddingBottom: 20 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    filterModalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    filterModalTitle: { fontSize: 20, fontWeight: 'bold' },
    closeModalBtn: { padding: 4, borderRadius: 20 },

    filterSectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
    filterOptions: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 10 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    filterChipText: { fontSize: 14, fontWeight: '600' },

    filterActions: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 10 },
    actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
});