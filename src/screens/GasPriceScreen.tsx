import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, StatusBar, RefreshControl, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, SlidersHorizontal, Info, CircleHelp, X, WifiOff } from 'lucide-react-native';

import { GasItemCard } from '../components/GasItemCard';
import { ZoneModal } from '../components/ZoneModal';
import { getPreviousDay, formatDate } from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';

const PROVIDERS = [
    { id: 'Petrolimex', name: 'Petrolimex' },
    { id: 'Pvoil', name: 'PVOIL' },
];

const FILTERS = ['Tất cả', 'Xăng', 'Dầu', 'Gas'];

export default function GasPriceScreen({ navigation }: any) {
    const { colors, isDarkMode } = useTheme();

    const [gasData, setGasData] = useState<any[]>([]);
    const [lastUpdatedFuel, setLastUpdatedFuel] = useState<string>('');
    const [lastUpdatedGas, setLastUpdatedGas] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

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
            setIsOffline(true);
            const cached = await AsyncStorage.getItem('cache_gas_latest');
            if (cached) {
                const parsed = JSON.parse(cached);
                setRawData(parsed);
                processDataForProvider(parsed, selectedProvider.id);
            }
            setLoading(false); setRefreshing(false);
            return;
        }

        setIsOffline(false);
        try {
            let targetDate = dateStr || new Date().toISOString().substring(0, 10);

            const oldApiUrl = `https://giaxanghomnay.com/api/pvdate/${targetDate}`;
            let oldResponse = await axios.get(oldApiUrl);

            if (!Array.isArray(oldResponse.data) || oldResponse.data.length < 2) {
                targetDate = getPreviousDay(targetDate);
                oldResponse = await axios.get(`https://giaxanghomnay.com/api/pvdate/${targetDate}`);
            }

            const plxReqFuel = "eyJGaWx0ZXJCeSI6eyJBbmQiOlt7IlN5c3RlbUlEIjp7IkVxdWFscyI6IjY3ODNkYzEyNzFmZjQ0OWU5NWI3NGE5NTIwOTY0MTY5In19LHsiUmVwb3NpdG9yeUlEIjp7IkVxdWFscyI6ImE5NTQ1MWUyM2I0NzRmZTU4ODZiZmI3Y2Y4NDNmNTNjIn19LHsiUmVwb3NpdG9yeUVudGl0eUlEIjp7IkVxdWFscyI6IjM4MDEzNzhmZTFlMDQ1YjFhZmExMGRlN2M1Nzc2MTI0In19XX19";
            const plxReqGas = "eyJGaWx0ZXJCeSI6eyJBbmQiOlt7IlN5c3RlbUlEIjp7IkVxdWFscyI6IjcwOTAyNGYzN2UyZTRhZTg5MzgyMWQwNTY0ZjJmYjNlIn19LHsiUmVwb3NpdG9yeUlEIjp7IkVxdWFscyI6ImU4ZjcxMDJjNTY4MzQ3YzJiNWQyZjhjMGY4ZGFiMzhjIn19LHsiUmVwb3NpdG9yeUVudGl0eUlEIjp7IkVxdWFscyI6IjJjYTdmNGI1YzU0MTRlZTlhMzM4ZDY1NDZkNzYyNDNiIn19LHsiU3RhdHVzIjp7IkVxdWFscyI6IlB1Ymxpc2hlZCJ9fV19LCJTb3J0QnkiOnsiTGFzdE1vZGlmaWVkIjoiRGVzY2VuZGluZyJ9LCJQYWdpbmF0aW9uIjp7IlRvdGFsUmVjb3JkcyI6LTEsIlRvdGFsUGFnZXMiOjAsIlBhZ2VTaXplIjowLCJQYWdlTnVtYmVyIjowfX0";

            const [newFuelRes, newGasRes] = await Promise.all([
                axios.get(`https://portals.petrolimex.com.vn/~apis/portals/cms.item/search?x-request=${plxReqFuel}`),
                axios.get(`https://portals.petrolimex.com.vn/~apis/portals/cms.item/search?x-request=${plxReqGas}&language=vi-VN`)
            ]);

            const rawDataObj = {
                oldApi: oldResponse.data,
                newFuel: newFuelRes.data?.Objects || [],
                newGas: newGasRes.data?.Objects || [],
                targetDate
            };

            setRawData(rawDataObj);
            processDataForProvider(rawDataObj, selectedProvider.id);
            await AsyncStorage.setItem('cache_gas_latest', JSON.stringify(rawDataObj));

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

    const processDataForProvider = (dataObj: any, providerId: string) => {
        if (!dataObj || !dataObj.oldApi) return;
        const { oldApi, newFuel, newGas, targetDate } = dataObj;

        if (providerId === 'Petrolimex') {
            const yesterdayData = oldApi[2] || [];

            const fuelItems = newFuel
                .filter((item: any) => item.Title !== 'Xăng RON 95-V' && item.Title !== 'Xăng RON 95-III' && item.Title !== 'Xăng RON 95')
                .map((item: any) => {
                    const yItem = yesterdayData.find((y: any) => y.title === item.Title);
                    return {
                        title: item.Title,
                        zone1_price: item.Zone1Price,
                        zone2_price: item.Zone2Price,
                        change1: yItem ? item.Zone1Price - yItem.zone1_price : 0,
                        change2: yItem ? item.Zone2Price - (yItem.zone2_price || 0) : 0,
                        isGas: false,
                        date: item.LastModified || targetDate
                    };
                });

            const gasItems = newGas.map((item: any) => ({
                title: `Gas Petrolimex - ${item.Title}`,
                zone1_price: item.TwelvePrice,
                zone2_price: item.FortyeightPrice,
                change1: 0,
                change2: 0,
                isGas: true,
                date: item.LastModified || targetDate
            }));

            const combined = [...fuelItems, ...gasItems];
            setGasData(combined);

            setLastUpdatedFuel(formatDate(targetDate));
            if (gasItems.length > 0) {
                setLastUpdatedGas(formatDate(gasItems[0].date));
            } else {
                setLastUpdatedGas(formatDate(targetDate));
            }

        } else if (providerId === 'Pvoil') {
            const todayData = oldApi[1] || [];
            const yesterdayData = oldApi[3] || [];

            const combined = todayData.map((item: any) => {
                const yItem = yesterdayData.find((y: any) => y.title === item.title);
                return {
                    ...item,
                    zone1_price: item.price,
                    change1: yItem ? item.price - yItem.price : 0,
                    isGas: false,
                    date: targetDate
                };
            });
            setGasData(combined);
            setLastUpdatedFuel(formatDate(targetDate));
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
                    selectedFilter === 'Dầu' ? item.title.toLowerCase().includes('do') || item.title.toLowerCase().includes('dầu') || item.title.toLowerCase().includes('ko') || item.title.toLowerCase().includes('mazut') :
                        selectedFilter === 'Gas' ? !!item.isGas : false;

        return matchSearch && matchType;
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <SafeAreaView style={styles.headerContainer} edges={['top', 'left', 'right']}>
                <View style={styles.topBar}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Giá xăng dầu & gas</Text>
                        <Text style={[styles.updateText, { color: colors.textSecondary }]}>
                            {selectedProvider.id === 'Petrolimex'
                                ? `Xăng: ${lastUpdatedFuel}  -  Gas: ${lastUpdatedGas}`
                                : `Cập nhật: ${lastUpdatedFuel}`}
                        </Text>
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
                {isOffline && (
                    <View style={styles.offlineBanner}>
                        <WifiOff size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Ngoại tuyến. Dữ liệu lưu tạm.</Text>
                    </View>
                )}
                <View style={styles.legendRow}>
                    <Info size={14} color={colors.textSecondary} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                        Giá bên phải: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Vùng 1 / 12kg (Trên)</Text> - <Text style={{ fontWeight: '700', color: colors.textSecondary }}>Vùng 2 / 48kg (Dưới)</Text>
                    </Text>
                </View>
            </View>

            <View style={styles.body}>
                {loading && !isOffline ? (
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

            <ZoneModal visible={modalVisible} onClose={() => setModalVisible(false)} />

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
    legendText: { fontSize: 12, fontStyle: 'italic' },
    offlineBanner: { backgroundColor: '#e74c3c', flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 8 },

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