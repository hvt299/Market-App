import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, StatusBar, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { CircleHelp } from 'lucide-react-native';
import { ZoneModal } from '../components/ZoneModal';
import { GasDetailModal } from '../components/GasDetailModal';
import { GasItemCard } from '../components/GasItemCard';
import { getPreviousDay, formatDate } from '../utils/helpers';

const PROVIDERS = [
    { id: 'Petrolimex', name: 'Petrolimex' },
    { id: 'Pvoil', name: 'PVOIL' },
];

export default function HomeScreen() {
    const [gasData, setGasData] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isConnected, setIsConnected] = useState(true);

    const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedGasItem, setSelectedGasItem] = useState<any>(null);

    const [rawData, setRawData] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected ?? false);
        });
        fetchGasPrices();
        return () => unsubscribe();
    }, []);

    const fetchGasPrices = async (dateStr?: string) => {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            setIsConnected(false);
            setLoading(false);
            setRefreshing(false);
            Alert.alert("Mất kết nối", "Vui lòng kiểm tra lại đường truyền internet.");
            return;
        }
        setIsConnected(true);

        try {
            let targetDate = dateStr;
            if (!targetDate) {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                targetDate = `${year}-${month}-${day}`;
            }
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
            console.error("Lỗi gọi API:", error);
            if (!dateStr) {
                const today = new Date();
                const yesterdayStr = getPreviousDay(today.toISOString().split('T')[0]);
                await fetchGasPrices(yesterdayStr);
                return;
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const processDataForProvider = (data: any, providerId: string) => {
        if (!data) return;

        let displayData: any[] = [];

        if (providerId === 'Petrolimex') {
            displayData = data[0] || [];
        } else {
            displayData = data[1] || [];
        }

        setGasData(displayData);

        if (displayData.length > 0 && displayData[0].date) {
            setLastUpdated(formatDate(displayData[0].date));
        }
    };

    const handleSwitchProvider = (provider: any) => {
        setSelectedProvider(provider);
        processDataForProvider(rawData, provider.id);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchGasPrices();
    }, []);

    const openDetail = (item: any) => {
        setSelectedGasItem(item);
        setDetailModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e272e" />

            <SafeAreaView style={styles.headerContainer} edges={['top', 'left', 'right']}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>GIÁ XĂNG DẦU</Text>
                    {lastUpdated ? <Text style={styles.subHeader}>Cập nhật ngày: {lastUpdated}</Text> : null}

                    {selectedProvider.id === 'Petrolimex' && (
                        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.helpBtn}>
                            <CircleHelp size={24} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tabs */}
                <View style={styles.tabsWrapper}>
                    {PROVIDERS.map((p) => (
                        <TouchableOpacity
                            key={p.id}
                            style={[styles.tabItem, selectedProvider.id === p.id && styles.activeTab]}
                            onPress={() => handleSwitchProvider(p)}
                        >
                            <Text style={[styles.tabText, selectedProvider.id === p.id && styles.activeTabText]}>{p.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </SafeAreaView>

            <View style={styles.body}>
                {loading ? (
                    <ActivityIndicator size="large" color="#e67e22" style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={gasData}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <GasItemCard
                                item={item}
                                providerId={selectedProvider.id}
                                onPress={() => openDetail(item)}
                            />
                        )}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e67e22']} />}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>Không có dữ liệu</Text>}
                    />
                )}
            </View>

            <ZoneModal visible={modalVisible} onClose={() => setModalVisible(false)} />

            <GasDetailModal
                visible={detailModalVisible}
                onClose={() => setDetailModalVisible(false)}
                gasItem={selectedGasItem}
                provider={selectedProvider.id}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    headerContainer: { backgroundColor: '#1e272e', paddingBottom: 10 },
    headerContent: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 10 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', textTransform: 'uppercase' },
    subHeader: { fontSize: 12, color: '#bdc3c7', marginTop: 4, fontStyle: 'italic' },
    helpBtn: { position: 'absolute', right: 20, top: 10 },

    tabsWrapper: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 4 },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
    activeTab: { backgroundColor: '#e67e22' },
    tabText: { color: '#bdc3c7', fontWeight: '600', fontSize: 13 },
    activeTabText: { color: '#FFF' },

    body: { flex: 1 },
    list: { padding: 16 },
});