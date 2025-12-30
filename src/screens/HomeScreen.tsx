import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, StatusBar, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';

import { GasItemCard } from '../components/GasItemCard';
import { ZoneModal } from '../components/ZoneModal';
import { getPreviousDay } from '../utils/helpers';

export default function HomeScreen() {
    const [gasData, setGasData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

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

            let foundData: any[] = [];
            if (Array.isArray(response.data)) {
                for (let i = 0; i < response.data.length; i++) {
                    const item = response.data[i];
                    if (Array.isArray(item) && item.length > 0) {
                        foundData = item;
                        break;
                    }
                }
            }

            if (foundData.length > 0) {
                setGasData(foundData);
            } else {
                const yesterday = getPreviousDay(targetDate);
                if (dateStr !== yesterday) {
                    await fetchGasPrices(yesterday);
                    return;
                } else {
                    setGasData([]);
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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchGasPrices();
    }, []);

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
            <SafeAreaView style={{ flex: 0, backgroundColor: '#2c3e50' }} edges={['top']} />
            <SafeAreaView style={styles.bodySafeArea} edges={['left', 'right', 'bottom']}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>MARKET APP</Text>
                        <Text style={styles.headerSubtitle}>Giá xăng dầu Petrolimex</Text>
                    </View>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.infoButton}>
                        <Text style={styles.infoButtonText}>?</Text>
                    </TouchableOpacity>
                </View>

                {!isConnected && (
                    <View style={styles.offlineBanner}>
                        <Text style={styles.offlineText}>Không có kết nối Internet</Text>
                    </View>
                )}

                <View style={styles.body}>
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#e67e22" />
                            <Text style={{ marginTop: 10, color: '#7f8c8d' }}>Đang tải dữ liệu...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={gasData}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => <GasItemCard item={item} />}
                            contentContainerStyle={styles.listContent}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e67e22']} />}
                            ListFooterComponent={<View style={{ height: 20 }} />}
                            ListEmptyComponent={<Text style={styles.emptyText}>{isConnected ? "Không có dữ liệu hôm nay." : "Vui lòng kết nối mạng."}</Text>}
                        />
                    )}
                </View>

                <ZoneModal visible={modalVisible} onClose={() => setModalVisible(false)} />
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    bodySafeArea: { flex: 1, backgroundColor: '#ecf0f1' },
    body: { flex: 1, backgroundColor: '#ecf0f1' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        padding: 20, backgroundColor: '#2c3e50', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5, zIndex: 10
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', letterSpacing: 1 },
    headerSubtitle: { fontSize: 12, color: '#bdc3c7', marginTop: 2 },
    infoButton: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)'
    },
    infoButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    offlineBanner: { backgroundColor: '#c0392b', padding: 10, alignItems: 'center' },
    offlineText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    listContent: { padding: 16 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#7f8c8d' },
});