import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { useTheme } from '../theme/ThemeContext';
import { Droplet, Coins, Banknote, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { getPreviousDay, formatCurrency } from '../utils/helpers';

export default function DashboardScreen({ navigation }: any) {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    const todayStr = new Date().toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const [isZone1, setIsZone1] = useState(true);
    const [goldIndex, setGoldIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const [gasList, setGasList] = useState<any[]>([]);
    const [loadingGas, setLoadingGas] = useState(true);

    const goldSources = [
        { name: 'SJC', sub: 'Hồ Chí Minh', sell: '80.500', buy: '78.500' },
        { name: 'DOJI', sub: 'Hà Nội', sell: '80.500', buy: '78.500' },
        { name: 'PNJ', sub: 'Hồ Chí Minh', sell: '80.400', buy: '78.400' }
    ];

    useEffect(() => {
        const fetchDashboardGas = async () => {
            try {
                let targetDate = new Date().toISOString().substring(0, 10);
                let response = await axios.get(`https://giaxanghomnay.com/api/pvdate/${targetDate}`);

                if (!Array.isArray(response.data) || response.data.length < 2) {
                    targetDate = getPreviousDay(targetDate);
                    response = await axios.get(`https://giaxanghomnay.com/api/pvdate/${targetDate}`);
                }

                const todayData = response.data[0] || [];
                const yesterdayData = response.data[2] || [];

                const targetKeywords = ['RON 95-V', 'RON 95-III', 'E5 RON 92-II', 'E10 RON 95-III'];
                const widgetColors = ['#e74c3c', '#e67e22', '#27AE60', '#f39c12'];

                const processed = targetKeywords.map((keyword, index) => {
                    const todayItem = todayData.find((item: any) => item.title.includes(keyword));
                    if (!todayItem) return null;

                    const yesterdayItem = yesterdayData.find((item: any) => item.title === todayItem.title);
                    const change = yesterdayItem ? todayItem.zone1_price - yesterdayItem.zone1_price : 0;

                    return {
                        rawItem: todayItem,
                        title: todayItem.title.replace(/^Xăng\s+/i, ''),
                        price1: formatCurrency(todayItem.zone1_price),
                        price2: formatCurrency(todayItem.zone2_price),
                        trendValue: change,
                        trendStr: change > 0 ? `+${change}` : change < 0 ? `${change}` : '0',
                        color: widgetColors[index],
                    };
                }).filter(Boolean);

                setGasList(processed);
            } catch (error) {
                console.log("Lỗi fetch xăng Dashboard:", error);
            } finally {
                setLoadingGas(false);
            }
        };

        fetchDashboardGas();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setIsZone1(prev => !prev);
                setGoldIndex(prev => (prev + 1) % 3);

                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const GasWidget = ({ data }: any) => {
        const { title, price1, price2, trendValue, trendStr, color, rawItem } = data;
        const isUp = trendValue > 0;
        const isDown = trendValue < 0;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('GasDetail', { gasItem: rawItem, provider: 'Petrolimex' })}
                style={[styles.gasCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: isDarkMode ? 0 : 0.05 }]}
            >
                <View style={styles.gasCardHeader}>
                    <View style={[styles.iconBoxMini, { backgroundColor: `${color}15` }]}>
                        <Droplet size={18} color={color} strokeWidth={2.5} />
                    </View>
                    {isUp ? <TrendingUp size={16} color={colors.upColor} /> :
                        isDown ? <TrendingDown size={16} color={colors.downColor} /> :
                            <Minus size={16} color={colors.textSecondary} />}
                </View>

                <View style={styles.gasCardBody}>
                    <Text style={[styles.gasTitle, { color: colors.textSecondary }]} numberOfLines={1}>{title}</Text>

                    <Animated.View style={{ opacity: fadeAnim }}>
                        <View style={styles.priceRow}>
                            <Text style={[styles.gasPrice, { color: colors.textPrimary }]}>
                                {isZone1 ? price1 : price2} <Text style={styles.unit}>đ</Text>
                            </Text>

                            {!isZone1 && (
                                <View style={[styles.zoneBadge, { backgroundColor: '#e74c3c20', marginLeft: 6 }]}>
                                    <Text style={[styles.zoneText, { color: colors.upColor }]}>+2%</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.trendRow}>
                            <View style={[styles.zoneBadge, { backgroundColor: colors.border }]}>
                                <Text style={[styles.zoneText, { color: colors.textSecondary }]}>
                                    {isZone1 ? 'VÙNG 1' : 'VÙNG 2'}
                                </Text>
                            </View>

                            {trendValue !== 0 && (
                                <Text style={[styles.gasTrend, { color: isUp ? colors.upColor : colors.downColor }]}>
                                    {trendStr} đ
                                </Text>
                            )}
                        </View>
                    </Animated.View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 115 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* --- KHỐI XĂNG DẦU --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Xăng dầu (Petrolimex)</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Gas')} style={styles.seeAllBtn}>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>Chi tiết</Text>
                            <ChevronRight size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {loadingGas ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                            {gasList.map((gas, index) => (
                                <GasWidget key={index} data={gas} />
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* --- KHỐI GIÁ VÀNG --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Giá vàng</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Gold')} style={styles.seeAllBtn}>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>Chi tiết</Text>
                            <ChevronRight size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: isDarkMode ? 0 : 0.05 }]}>
                        <Animated.View style={[styles.listRow, { opacity: fadeAnim }]}>
                            <View style={styles.listRowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#F1C40F15' }]}>
                                    <Coins size={22} color="#F1C40F" />
                                </View>
                                <View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <Text style={[styles.itemName, { color: colors.textPrimary, marginBottom: 0 }]}>
                                            Vàng miếng {goldSources[goldIndex].name}
                                        </Text>
                                    </View>
                                    <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                                        Khu vực {goldSources[goldIndex].sub}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.itemPrice, { color: colors.upColor }]}>
                                    {goldSources[goldIndex].sell} <Text style={styles.unit}>bán</Text>
                                </Text>
                                <Text style={[styles.subPrice, { color: colors.downColor }]}>
                                    {goldSources[goldIndex].buy} <Text style={styles.unit}>mua</Text>
                                </Text>
                            </View>
                        </Animated.View>
                    </View>
                </View>

                {/* --- KHỐI TỶ GIÁ --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Ngoại tệ (NHNN)</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Exchange')} style={styles.seeAllBtn}>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>Chi tiết</Text>
                            <ChevronRight size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: isDarkMode ? 0 : 0.05 }]}>
                        <Animated.View style={{ opacity: fadeAnim }}>
                            <View style={styles.listRow}>
                                <View style={styles.listRowLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: '#27AE6015' }]}>
                                        <Banknote size={22} color="#27AE60" />
                                    </View>
                                    <View>
                                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>USD</Text>
                                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>Đô la Mỹ</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>25.450 <Text style={styles.unit}>đ</Text></Text>
                                    <Text style={[styles.gasTrend, { color: colors.upColor }]}>+15 đ</Text>
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            <View style={styles.listRow}>
                                <View style={styles.listRowLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: '#2980b915' }]}>
                                        <Banknote size={22} color="#2980b9" />
                                    </View>
                                    <View>
                                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>EUR</Text>
                                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>Euro</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>27.120 <Text style={styles.unit}>đ</Text></Text>
                                    <Text style={[styles.gasTrend, { color: colors.downColor }]}>-45 đ</Text>
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            <View style={styles.listRow}>
                                <View style={styles.listRowLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: '#8e44ad15' }]}>
                                        <Banknote size={22} color="#8e44ad" />
                                    </View>
                                    <View>
                                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>GBP</Text>
                                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>Bảng Anh</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>31.850 <Text style={styles.unit}>đ</Text></Text>
                                    <Text style={[styles.gasTrend, { color: colors.upColor }]}>+20 đ</Text>
                                </View>
                            </View>
                        </Animated.View>
                    </View>
                </View>

            </ScrollView>

            <BlurView
                intensity={100}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                    styles.fixedHeader,
                    {
                        paddingTop: insets.top,
                        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)'
                    }
                ]}
            >
                <View style={styles.headerContent}>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>Tổng quan thị trường</Text>
                    <View style={styles.titleRow}>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Hôm nay</Text>
                        <View style={[styles.dateBadge, { backgroundColor: colors.border }]}>
                            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{todayStr}</Text>
                        </View>
                    </View>
                </View>
            </BlurView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
    },
    greeting: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
    dateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, justifyContent: 'center' },
    dateText: { fontSize: 13, fontWeight: '700' },

    scrollContent: { paddingBottom: 40 },

    section: { marginBottom: 28 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700' },
    seeAllBtn: { flexDirection: 'row', alignItems: 'center' },
    seeAllText: { fontSize: 14, fontWeight: '600', marginRight: 2 },

    gasCard: {
        width: 155,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    gasCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    iconBoxMini: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    gasCardBody: { gap: 4 },
    gasTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    priceRow: { flexDirection: 'row', alignItems: 'center' },
    gasPrice: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },

    trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    zoneBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    zoneText: { fontSize: 10, fontWeight: '800' },
    gasTrend: { fontSize: 12, fontWeight: '700' },

    listCard: {
        marginHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    listRowLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    itemName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    itemSub: { fontSize: 13, fontWeight: '500' },

    itemPrice: { fontSize: 16, fontWeight: '800' },
    subPrice: { fontSize: 14, fontWeight: '600', marginTop: 2 },
    unit: { fontSize: 12, fontWeight: '600' },
    divider: { height: 1, marginVertical: 14 },
});