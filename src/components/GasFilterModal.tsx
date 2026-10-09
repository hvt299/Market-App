import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/typography';

interface ProviderItem {
    id: string;
    name: string;
}

interface GasFilterModalProps {
    visible: boolean;
    onClose: () => void;
    providers: ProviderItem[];
    filters: string[];
    tempProvider: ProviderItem;
    tempFilter: string;
    onSelectProvider: (p: ProviderItem) => void;
    onSelectFilter: (f: string) => void;
    onApply: () => void;
    onClear: () => void;
}

export const GasFilterModal: React.FC<GasFilterModalProps> = ({
    visible,
    onClose,
    providers,
    filters,
    tempProvider,
    tempFilter,
    onSelectProvider,
    onSelectFilter,
    onApply,
    onClear,
}) => {
    const { colors } = useTheme();

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.filterModalContent, { backgroundColor: colors.surface }]}>
                    {/* Header */}
                    <View style={styles.filterModalHeader}>
                        <Text style={[styles.filterModalTitle, { color: colors.textPrimary }]}>Bộ lọc hiển thị</Text>
                        <TouchableOpacity onPress={onClose} style={[styles.closeModalBtn, { backgroundColor: colors.surfaceSubtle }]}>
                            <X size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Section 1: Provider */}
                    <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>Nhà cung cấp</Text>
                    <View style={styles.filterOptions}>
                        {providers.map((p) => {
                            const isSelected = tempProvider.id === p.id;
                            return (
                                <TouchableOpacity
                                    key={p.id}
                                    onPress={() => onSelectProvider(p)}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.filterChip,
                                        isSelected
                                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                            : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                                        ]}
                                    >
                                        {p.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Section 2: Category */}
                    <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>Loại nhiên liệu</Text>
                    <View style={styles.filterOptions}>
                        {filters.map((f) => {
                            const isSelected = tempFilter === f;
                            return (
                                <TouchableOpacity
                                    key={f}
                                    onPress={() => onSelectFilter(f)}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.filterChip,
                                        isSelected
                                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                            : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                                        ]}
                                    >
                                        {f}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Actions */}
                    <View style={styles.filterActions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderWidth: 1 }]}
                            onPress={onClear}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Xóa bộ lọc</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                            onPress={onApply}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Áp dụng</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    filterModalContent: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
    },
    filterModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    filterModalTitle: {
        fontFamily: FONTS.bold,
        fontSize: 20,
        letterSpacing: -0.3,
    },
    closeModalBtn: {
        padding: 6,
        borderRadius: 20,
    },
    filterSectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 13,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 22,
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
    },
    filterChipText: {
        fontFamily: FONTS.semiBold,
        fontSize: 14,
    },
    filterActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 6,
        marginBottom: 10,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    actionText: {
        fontFamily: FONTS.bold,
        fontSize: 15,
    },
});
