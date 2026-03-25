import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZONE_2_DATA } from '../constants/zoneData';
import { useTheme } from '../theme/ThemeContext';

interface ZoneModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ZoneModal: React.FC<ZoneModalProps> = ({ visible, onClose }) => {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();

    return (
        <Modal
            animationType="slide"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View
                    style={[
                        styles.modalContent,
                        { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }
                    ]}
                >
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                Danh Mục Vùng 2
                            </Text>
                            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                                Theo QĐ 630/PLX-QĐ-TGĐ
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeButtonBox, { backgroundColor: colors.border }]}
                        >
                            <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: 'bold' }}>
                                Đóng
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={[
                            styles.modalNote,
                            {
                                color: colors.textSecondary,
                                backgroundColor: isDarkMode ? '#2c2c2e' : '#f9f9f9',
                                borderLeftColor: colors.primary
                            }
                        ]}
                    >
                        (*) Giá bán Vùng 2 cao hơn tối đa 2% so với giá điều hành.
                        {'\n'}Riêng mặt hàng Madút tại <Text style={{ fontWeight: '700', color: colors.primary }}>Bà Rịa - Vũng Tàu</Text> áp dụng giá Vùng 1.
                    </Text>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 20 }}
                    >
                        {ZONE_2_DATA.map((section, index) => {
                            const isLongTextSection = index === 1;

                            return (
                                <View key={index} style={styles.sectionContainer}>
                                    <View
                                        style={[
                                            styles.sectionHeader,
                                            { backgroundColor: isDarkMode ? colors.border : '#dfe4ea' }
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.sectionHeaderText,
                                                { color: colors.textPrimary }
                                            ]}
                                        >
                                            {section.title}
                                        </Text>
                                    </View>

                                    <View style={styles.gridContainer}>
                                        {section.data.map((item, idx) => {
                                            const hasAsterisk = item.includes('*');

                                            return (
                                                <View
                                                    key={idx}
                                                    style={[
                                                        isLongTextSection ? styles.fullItem : styles.gridItem,
                                                        { borderColor: colors.border }
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.provinceText,
                                                            isLongTextSection && { textAlign: 'left', paddingLeft: 8 },
                                                            hasAsterisk
                                                                ? { color: colors.primary, fontWeight: '700' }
                                                                : { color: colors.textSecondary }
                                                        ]}
                                                    >
                                                        {item}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        height: '85%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    modalSubtitle: {
        fontSize: 13,
        marginTop: 4
    },
    closeButtonBox: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20
    },
    modalNote: {
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 16,
        lineHeight: 20,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3
    },
    sectionContainer: {
        marginBottom: 16
    },
    sectionHeader: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginBottom: 8
    },
    sectionHeaderText: {
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4
    },
    gridItem: {
        width: '33.33%',
        paddingHorizontal: 4,
        paddingVertical: 6,
        justifyContent: 'center'
    },
    fullItem: {
        width: '100%',
        paddingHorizontal: 4,
        paddingVertical: 6,
        justifyContent: 'center'
    },
    provinceText: {
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500'
    }
});