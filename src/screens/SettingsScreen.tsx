import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Moon,
    Sun,
    Globe,
    Info,
    ChevronRight,
    MonitorSmartphone,
    Database,
    RefreshCw,
    ShieldCheck,
    Check,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/typography';

export default function SettingsScreen() {
    const { isDarkMode, themeMode, setThemeMode, colors } = useTheme();
    const [clearingCache, setClearingCache] = useState(false);

    const handleClearCache = () => {
        Alert.alert(
            'Làm mới bộ nhớ đệm',
            'Thao tác này sẽ xóa dữ liệu giá thị trường lưu trữ ngoại tuyến và tải lại dữ liệu mới nhất. Bạn có muốn tiếp tục?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa bộ nhớ đệm',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setClearingCache(true);
                            // Clear all market cache keys except theme
                            const allKeys = await AsyncStorage.getAllKeys();
                            const cacheKeys = allKeys.filter((k) => k !== 'app_theme_mode');
                            if (cacheKeys.length > 0) {
                                await AsyncStorage.multiRemove(cacheKeys);
                            }
                            setTimeout(() => {
                                setClearingCache(false);
                                Alert.alert('Thành công', 'Đã xóa bộ nhớ đệm ngoại tuyến thành công.');
                            }, 500);
                        } catch (err) {
                            setClearingCache(false);
                            Alert.alert('Thông báo', 'Không thể xóa bộ nhớ đệm lúc này.');
                        }
                    },
                },
            ]
        );
    };

    const handleShowSources = () => {
        Alert.alert(
            'Nguồn dữ liệu thị trường',
            '• Xăng dầu & Khí đốt: Cổng thông tin Tập đoàn Xăng dầu Việt Nam (Petrolimex)\n\n• Giá vàng & bạc: SJC, DOJI, PNJ, Bạc Phú Quý 999, Bảo Tín Minh Châu\n\n• Tỷ giá ngoại tệ: Vietcombank, Agribank, BIDV, HDBank, TPBank và NHNN',
            [{ text: 'Đã hiểu', style: 'default' }]
        );
    };

    const handleShowAbout = () => {
        Alert.alert(
            'Về ứng dụng Market App',
            'Market App v1.0.0 (Build 2026.10)\n\nỨng dụng theo dõi giá cả thị trường Việt Nam thời gian thực: Xăng dầu Petrolimex, Giá vàng bạc & Tỷ giá ngoại tệ ngân hàng.\n\nPhát triển bởi Mr.T (hvt299)',
            [{ text: 'Đóng', style: 'default' }]
        );
    };

    const ThemeOption = ({
        mode,
        label,
        Icon,
    }: {
        mode: 'light' | 'dark' | 'system';
        label: string;
        Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
    }) => {
        const isActive = themeMode === mode;
        const activeBg = isDarkMode ? `${colors.primary}25` : `${colors.primary}12`;
        const activeBorder = colors.primary;
        const inactiveBg = colors.surfaceSubtle;
        const inactiveBorder = colors.border;

        return (
            <TouchableOpacity
                style={[
                    styles.themeOptionBtn,
                    {
                        backgroundColor: isActive ? activeBg : inactiveBg,
                        borderColor: isActive ? activeBorder : inactiveBorder,
                    },
                ]}
                onPress={() => setThemeMode(mode)}
                activeOpacity={0.75}
            >
                {isActive && (
                    <View style={[styles.activeDot, { backgroundColor: colors.primary }]}>
                        <Check size={9} color="#FFFFFF" strokeWidth={3} />
                    </View>
                )}
                <Icon
                    size={20}
                    color={isActive ? colors.primary : colors.textSecondary}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                <Text
                    style={[
                        styles.themeOptionText,
                        {
                            color: isActive ? colors.primary : colors.textSecondary,
                            fontFamily: isActive ? FONTS.bold : FONTS.semiBold,
                        },
                    ]}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                {/* 1. Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cài đặt</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        Tùy chỉnh giao diện & cấu hình hệ thống
                    </Text>
                </View>

                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Section 1: GIAO DIỆN & HIỂN THỊ */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            GIAO DIỆN & HIỂN THỊ
                        </Text>
                        <View
                            style={[
                                styles.card,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                            ]}
                        >
                            <View style={styles.themeSection}>
                                <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>
                                    Chế độ màu sắc
                                </Text>
                                <View style={styles.themeSelectorRow}>
                                    <ThemeOption mode="light" label="Sáng" Icon={Sun} />
                                    <ThemeOption mode="dark" label="Tối" Icon={Moon} />
                                    <ThemeOption mode="system" label="Hệ thống" Icon={MonitorSmartphone} />
                                </View>
                                <Text style={[styles.themeDesc, { color: colors.textTertiary }]}>
                                    {themeMode === 'light'
                                        ? 'Chế độ sáng tối ưu cho không gian đủ sáng ban ngày.'
                                        : themeMode === 'dark'
                                        ? 'Chế độ tối dịu mắt, tiết kiệm năng lượng màn hình.'
                                        : 'Tự động thay đổi đồng bộ theo cài đặt hệ thống của thiết bị.'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Section 2: DỮ LIỆU & BỘ NHỚ ĐỆM */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            DỮ LIỆU & BỘ NHỚ ĐỆM
                        </Text>
                        <View
                            style={[
                                styles.card,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                            ]}
                        >
                            {/* Offline Cache Status */}
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <View
                                        style={[
                                            styles.iconBox,
                                            { backgroundColor: `${colors.primary}15` },
                                        ]}
                                    >
                                        <Database size={18} color={colors.primary} strokeWidth={2.2} />
                                    </View>
                                    <View style={styles.rowTextCol}>
                                        <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                                            Lưu đệm ngoại tuyến
                                        </Text>
                                        <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                                            Tự động lưu giá gần nhất khi mất mạng
                                        </Text>
                                    </View>
                                </View>
                                <View
                                    style={[
                                        styles.statusPill,
                                        { backgroundColor: `${colors.upColor}18` },
                                    ]}
                                >
                                    <Text style={[styles.statusPillText, { color: colors.upColor }]}>
                                        Đang bật
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={[styles.divider, { backgroundColor: colors.border, marginLeft: 56 }]}
                            />

                            {/* Clear Cache Action */}
                            <TouchableOpacity
                                style={styles.row}
                                onPress={handleClearCache}
                                activeOpacity={0.7}
                                disabled={clearingCache}
                            >
                                <View style={styles.rowLeft}>
                                    <View
                                        style={[
                                            styles.iconBox,
                                            { backgroundColor: '#EA580C15' },
                                        ]}
                                    >
                                        <RefreshCw size={18} color="#EA580C" strokeWidth={2.2} />
                                    </View>
                                    <View style={styles.rowTextCol}>
                                        <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                                            Làm mới bộ nhớ đệm
                                        </Text>
                                        <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                                            Xóa dữ liệu cũ & tải lại dữ liệu mới nhất
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.rowRight}>
                                    {clearingCache ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <ChevronRight size={18} color={colors.textTertiary} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Section 3: THÔNG TIN & NGUỒN DỮ LIỆU */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            THÔNG TIN & NGUỒN DỮ LIỆU
                        </Text>
                        <View
                            style={[
                                styles.card,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                            ]}
                        >
                            {/* Ngôn ngữ */}
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <View
                                        style={[
                                            styles.iconBox,
                                            { backgroundColor: '#10B98115' },
                                        ]}
                                    >
                                        <Globe size={18} color="#10B981" strokeWidth={2.2} />
                                    </View>
                                    <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                                        Ngôn ngữ
                                    </Text>
                                </View>
                                <View style={styles.rowRight}>
                                    <Text style={[styles.rowSubText, { color: colors.textSecondary }]}>
                                        Tiếng Việt
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={[styles.divider, { backgroundColor: colors.border, marginLeft: 56 }]}
                            />

                            {/* Nguồn dữ liệu */}
                            <TouchableOpacity
                                style={styles.row}
                                onPress={handleShowSources}
                                activeOpacity={0.7}
                            >
                                <View style={styles.rowLeft}>
                                    <View
                                        style={[
                                            styles.iconBox,
                                            { backgroundColor: '#6366F115' },
                                        ]}
                                    >
                                        <ShieldCheck size={18} color="#6366F1" strokeWidth={2.2} />
                                    </View>
                                    <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                                        Nguồn dữ liệu
                                    </Text>
                                </View>
                                <View style={styles.rowRight}>
                                    <Text style={[styles.rowSubText, { color: colors.textSecondary }]}>
                                        Petrolimex, SJC...
                                    </Text>
                                    <ChevronRight size={18} color={colors.textTertiary} />
                                </View>
                            </TouchableOpacity>

                            <View
                                style={[styles.divider, { backgroundColor: colors.border, marginLeft: 56 }]}
                            />

                            {/* Về ứng dụng */}
                            <TouchableOpacity
                                style={styles.row}
                                onPress={handleShowAbout}
                                activeOpacity={0.7}
                            >
                                <View style={styles.rowLeft}>
                                    <View
                                        style={[
                                            styles.iconBox,
                                            { backgroundColor: '#8B5CF615' },
                                        ]}
                                    >
                                        <Info size={18} color="#8B5CF6" strokeWidth={2.2} />
                                    </View>
                                    <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                                        Về ứng dụng
                                    </Text>
                                </View>
                                <View style={styles.rowRight}>
                                    <Text style={[styles.rowSubText, { color: colors.textSecondary }]}>
                                        v1.0.0
                                    </Text>
                                    <ChevronRight size={18} color={colors.textTertiary} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer Info */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                            Market App • Phiên bản 1.0.0 (Build 2026.10)
                        </Text>
                        <Text style={[styles.footerSubText, { color: colors.textTertiary }]}>
                            Phát triển bởi Mr.T (hvt299)
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 14,
    },
    headerTitle: {
        fontFamily: FONTS.black,
        fontSize: 26,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontFamily: FONTS.medium,
        fontSize: 13,
        marginTop: 3,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 11.5,
        letterSpacing: 0.8,
        marginBottom: 8,
        paddingLeft: 4,
    },
    card: {
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden',
    },
    themeSection: {
        padding: 16,
    },
    cardHeading: {
        fontFamily: FONTS.bold,
        fontSize: 14.5,
        marginBottom: 12,
    },
    themeSelectorRow: {
        flexDirection: 'row',
        gap: 10,
    },
    themeOptionBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: 14,
        borderWidth: 1,
        position: 'relative',
    },
    activeDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    themeOptionText: {
        fontSize: 12.5,
        marginTop: 6,
    },
    themeDesc: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        marginTop: 12,
        lineHeight: 17,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 13,
        paddingHorizontal: 16,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rowTextCol: {
        flex: 1,
    },
    rowTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 15,
    },
    rowDesc: {
        fontFamily: FONTS.regular,
        fontSize: 11.5,
        marginTop: 2,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rowSubText: {
        fontFamily: FONTS.medium,
        fontSize: 13.5,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusPillText: {
        fontFamily: FONTS.bold,
        fontSize: 11,
    },
    divider: {
        height: 1,
    },
    footer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 4,
    },
    footerText: {
        fontFamily: FONTS.medium,
        fontSize: 11.5,
    },
    footerSubText: {
        fontFamily: FONTS.regular,
        fontSize: 11,
    },
});