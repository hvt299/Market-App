import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Moon, Sun, Globe, Info, ChevronRight, MonitorSmartphone } from 'lucide-react-native';

export default function SettingsScreen() {
    const { isDarkMode, themeMode, setThemeMode, colors } = useTheme();

    const ThemeOption = ({ mode, label, Icon }: { mode: 'light' | 'dark' | 'system', label: string, Icon: any }) => {
        const isActive = themeMode === mode;
        return (
            <TouchableOpacity
                style={[styles.themeOptionBtn, isActive && { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}
                onPress={() => setThemeMode(mode)}
                activeOpacity={0.7}
            >
                <Icon size={20} color={isActive ? colors.primary : colors.textSecondary} />
                <Text style={[styles.themeOptionText, { color: isActive ? colors.primary : colors.textSecondary }]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cài đặt</Text>
            </View>

            <View style={styles.section}>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

                    <View style={styles.themeSection}>
                        <Text style={[styles.rowText, { color: colors.textPrimary, marginBottom: 12, fontWeight: '700' }]}>Giao diện</Text>
                        <View style={styles.themeSelectorRow}>
                            <ThemeOption mode="light" label="Sáng" Icon={Sun} />
                            <ThemeOption mode="dark" label="Tối" Icon={Moon} />
                            <ThemeOption mode="system" label="Hệ thống" Icon={MonitorSmartphone} />
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 0 }]} />

                    {/* Ngôn ngữ */}
                    <TouchableOpacity style={styles.row}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#3A3A3C' : '#F2F2F7' }]}>
                                <Globe size={20} color={colors.textSecondary} />
                            </View>
                            <Text style={[styles.rowText, { color: colors.textPrimary }]}>Ngôn ngữ</Text>
                        </View>
                        <View style={styles.rowRight}>
                            <Text style={[styles.rowSubText, { color: colors.textSecondary }]}>Tiếng Việt</Text>
                            <ChevronRight size={20} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 64 }]} />

                    {/* Thông tin ứng dụng */}
                    <TouchableOpacity style={styles.row}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#3A3A3C' : '#F2F2F7' }]}>
                                <Info size={20} color={colors.textSecondary} />
                            </View>
                            <Text style={[styles.rowText, { color: colors.textPrimary }]}>Về ứng dụng</Text>
                        </View>
                        <ChevronRight size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', letterSpacing: 0.5 },
    section: { paddingHorizontal: 16 },
    card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },

    themeSection: { padding: 16 },
    themeSelectorRow: { flexDirection: 'row', gap: 10 },
    themeOptionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
    themeOptionText: { fontSize: 13, fontWeight: '600', marginTop: 6 },

    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 },
    rowLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rowText: { fontSize: 16, fontWeight: '500' },
    rowRight: { flexDirection: 'row', alignItems: 'center' },
    rowSubText: { fontSize: 15, marginRight: 8 },
    divider: { height: 1 },
});