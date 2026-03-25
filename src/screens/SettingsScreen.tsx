import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Moon, Sun, Globe, Info, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
    const { isDarkMode, toggleTheme, colors } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cài đặt</Text>
            </View>

            <View style={styles.section}>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {/* Nút gạt Dark Mode */}
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#3A3A3C' : '#F2F2F7' }]}>
                                {isDarkMode ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
                            </View>
                            <Text style={[styles.rowText, { color: colors.textPrimary }]}>Giao diện tối</Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#D1D1D6', true: colors.primary }}
                            thumbColor={'#FFFFFF'}
                        />
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

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

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
    card: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rowText: { fontSize: 16, fontWeight: '500' },
    rowRight: { flexDirection: 'row', alignItems: 'center' },
    rowSubText: { fontSize: 15, marginRight: 8 },
    divider: { height: 1, marginLeft: 64 },
});