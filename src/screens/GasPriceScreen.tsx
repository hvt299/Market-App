import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, SlidersHorizontal, Info, CircleHelp, WifiOff } from 'lucide-react-native';

import { GasItemCard } from '../components/GasItemCard';
import { ReferenceModal } from '../components/ReferenceModal';
import { GasFilterModal } from '../components/GasFilterModal';
import {
    formatDate,
    getFuelCategory,
    matchesFuelSearch,
} from '../utils/helpers';
import {
    fetchFullGasData,
    processProviderGasData,
    GasMarketItem,
} from '../services/gasService';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/typography';

const PROVIDERS = [
    { id: 'Petrolimex', name: 'Petrolimex' },
    { id: 'Pvoil', name: 'PVOIL' },
];

const FILTERS = ['Tất cả', 'Xăng', 'Dầu', 'Gas'];

export default function GasPriceScreen({ navigation }: any) {
    const { colors, isDarkMode } = useTheme();

    const [gasData, setGasData] = useState<GasMarketItem[]>([]);
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

    const [referenceModalVisible, setReferenceModalVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    const [rawData, setRawData] = useState<any>(null);

    const fetchGasPrices = useCallback(async () => {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            setIsOffline(true);
            const cached = await AsyncStorage.getItem('cache_gas_latest');
            if (cached) {
                const parsed = JSON.parse(cached);
                setRawData(parsed);
                updateProcessedData(parsed, selectedProvider.id);
            }
            setLoading(false);
            setRefreshing(false);
            return;
        }

        setIsOffline(false);
        try {
            const dataObj = await fetchFullGasData();
            setRawData(dataObj);
            updateProcessedData(dataObj, selectedProvider.id);
        } catch (error) {
            console.log('Lỗi fetch gas prices:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedProvider.id]);

    useEffect(() => {
        fetchGasPrices();
    }, [fetchGasPrices]);

    const updateProcessedData = (dataObj: any, providerId: string) => {
        if (!dataObj) return;
        const processed = processProviderGasData(dataObj, providerId);
        setGasData(processed);

        setLastUpdatedFuel(formatDate(dataObj.targetDate));
        const gasItem = processed.find(i => i.isGas);
        if (gasItem && gasItem.date) {
            setLastUpdatedGas(formatDate(gasItem.date));
        } else {
            setLastUpdatedGas(formatDate(dataObj.targetDate));
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
        updateProcessedData(rawData, tempProvider.id);
        setFilterModalVisible(false);
    };

    const handleClearFilters = () => {
        setTempProvider(PROVIDERS[0]);
        setTempFilter(FILTERS[0]);
        setSelectedProvider(PROVIDERS[0]);
        setSelectedFilter(FILTERS[0]);
        updateProcessedData(rawData, PROVIDERS[0].id);
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
        const matchSearch = matchesFuelSearch(item.title, searchQuery, item.isGas);
        const matchType =
            selectedFilter === 'Tất cả' ? true :
                selectedFilter === 'Xăng' ? getFuelCategory(item.title, item.isGas) === 'xang' :
                    selectedFilter === 'Dầu' ? getFuelCategory(item.title, item.isGas) === 'dau' :
                        selectedFilter === 'Gas' ? getFuelCategory(item.title, item.isGas) === 'gas' : true;

        return matchSearch && matchType;
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

            <SafeAreaView style={styles.headerContainer} edges={['top', 'left', 'right']}>
                <View style={styles.topBar}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Giá xăng dầu & gas</Text>
                        <Text style={[styles.updateText, { color: colors.textSecondary }]}>
                            {selectedProvider.id === 'Petrolimex'
                                ? `Xăng: ${lastUpdatedFuel}  •  Gas: ${lastUpdatedGas}`
                                : `Cập nhật: ${lastUpdatedFuel}`}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setReferenceModalVisible(true)}
                        style={[styles.helpBtn, { backgroundColor: colors.surfaceSubtle }]}
                        activeOpacity={0.7}
                    >
                        <CircleHelp size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Search & Filter Bar */}
                <View style={styles.searchWrapper}>
                    <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Search size={18} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                        <TextInput
                            placeholder="Tìm kiếm xăng, dầu, gas..."
                            placeholderTextColor={colors.textTertiary}
                            style={[styles.searchInput, { color: colors.textPrimary }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={openFilterModal}
                        activeOpacity={0.7}
                        style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                        <SlidersHorizontal size={18} color={colors.primary} />
                        {(selectedProvider.id !== 'Petrolimex' || selectedFilter !== 'Tất cả') && (
                            <View style={[styles.filterDot, { backgroundColor: colors.primary }]} />
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Info Legend Banner */}
            <View style={styles.infoSection}>
                {isOffline && (
                    <View style={[styles.offlineBanner, { backgroundColor: colors.downColor }]}>
                        <WifiOff size={15} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.offlineBannerText}>Ngoại tuyến. Đang hiển thị dữ liệu lưu tạm.</Text>
                    </View>
                )}
                <View style={styles.legendRow}>
                    <Info size={13} color={colors.textSecondary} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                        Giá cột phải: <Text style={{ color: colors.textPrimary, fontFamily: FONTS.bold }}>Vùng 1 (Trên)</Text> • <Text style={{ color: colors.textSecondary, fontFamily: FONTS.bold }}>Vùng 2 (Dưới)</Text>
                    </Text>
                </View>
            </View>

            {/* List */}
            <View style={styles.body}>
                {loading && !isOffline ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item, index) => `${item.title}-${index}`}
                        renderItem={({ item }) => (
                            <GasItemCard item={item} providerId={selectedProvider.id} onPress={() => handlePressItem(item)} />
                        )}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    Không tìm thấy loại nhiên liệu nào phù hợp.
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Modals */}
            <ReferenceModal visible={referenceModalVisible} onClose={() => setReferenceModalVisible(false)} />

            <GasFilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                providers={PROVIDERS}
                filters={FILTERS}
                tempProvider={tempProvider}
                tempFilter={tempFilter}
                onSelectProvider={setTempProvider}
                onSelectFilter={setTempFilter}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: { paddingBottom: 0, paddingTop: 10 },

    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    headerTitle: {
        fontFamily: FONTS.black,
        fontSize: 26,
        letterSpacing: -0.5,
    },
    updateText: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        marginTop: 2,
    },
    helpBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

    searchWrapper: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12 },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 44,
        paddingHorizontal: 10,
        fontFamily: FONTS.regular,
        fontSize: 14,
    },
    filterBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },

    infoSection: { paddingHorizontal: 20, paddingBottom: 10 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendText: { fontFamily: FONTS.regular, fontSize: 12 },
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 8,
    },
    offlineBannerText: {
        color: '#FFF',
        fontSize: 12,
        fontFamily: FONTS.bold,
    },

    body: { flex: 1 },
    list: { paddingHorizontal: 20, paddingBottom: 24 },
    emptyContainer: {
        paddingTop: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        textAlign: 'center',
    },
});