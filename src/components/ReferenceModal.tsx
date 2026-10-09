import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZONE_2_DATA } from '../constants/zoneData';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/typography';
import { X } from 'lucide-react-native';

interface ReferenceModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ReferenceModal: React.FC<ReferenceModalProps> = ({ visible, onClose }) => {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState(0);

    const DefinitionItem = ({ title, desc }: { title: string, desc: string }) => (
        <View style={[styles.defItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.defTitle, { color: colors.primary }]}>{title}</Text>
            <Text style={[styles.defDesc, { color: colors.textSecondary }]}>{desc}</Text>
        </View>
    );

    const renderTabContent = () => {
        if (activeTab === 0) {
            return (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                    <Text style={[styles.modalNote, { color: colors.textSecondary, backgroundColor: colors.surfaceSubtle, borderLeftColor: colors.primary }]}>
                        (*) Giá bán Vùng 2 (Petrolimex) cao hơn tối đa 2% so với giá điều hành. Riêng mặt hàng Madút tại <Text style={{ fontFamily: FONTS.bold, color: colors.primary }}>Bà Rịa - Vũng Tàu</Text> áp dụng giá Vùng 1.
                    </Text>
                    {ZONE_2_DATA.map((section, index) => {
                        const isLong = index === 1;
                        return (
                            <View key={index} style={styles.sectionContainer}>
                                <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceSubtle }]}>
                                    <Text style={[styles.sectionHeaderText, { color: colors.textPrimary }]}>{section.title}</Text>
                                </View>
                                <View style={styles.gridContainer}>
                                    {section.data.map((item, idx) => (
                                        <View key={idx} style={[isLong ? styles.fullItem : styles.gridItem, { borderColor: colors.border }]}>
                                            <Text style={[styles.provinceText, isLong && { textAlign: 'left', paddingLeft: 8 }, item.includes('*') ? { color: colors.primary, fontFamily: FONTS.bold } : { color: colors.textSecondary }]}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            );
        }

        if (activeTab === 1) {
            return (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                    <DefinitionItem title="Xăng E10 RON 95 Mức 5 (cũ: RON 95-V)" desc="Xăng sinh học cao cấp pha 10% ethanol đạt tiêu chuẩn khí thải Mức 5 (tương đương Euro 5). Hàm lượng lưu huỳnh cực thấp, bảo vệ môi trường và tối ưu cho các dòng xe đời mới, xe hạng sang." />
                    <DefinitionItem title="Xăng E10 RON 95 Mức 3 (cũ: RON 95-III / A95)" desc="Xăng sinh học pha 10% ethanol đạt tiêu chuẩn khí thải Mức 3 (tương đương Euro 3). Khả năng chống kích nổ tốt, giúp động cơ vận hành êm ái, bền bỉ và phổ biến nhất trên thị trường." />
                    <DefinitionItem title="Xăng E5 RON 92 Mức 2 (cũ: E5 RON 92-II)" desc="Là hỗn hợp gồm xăng khoáng và 5% cồn sinh học Ethanol đạt tiêu chuẩn Mức 2 (Euro 2), phù hợp với hầu hết các dòng xe máy phổ thông và ô tô đời cũ." />
                </ScrollView>
            );
        }

        return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: colors.textPrimary, marginBottom: 8, marginTop: 10 }}>Dầu Diesel (DO)</Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>Là nhiên liệu chủ lực cho các dòng xe tải, xe bán tải, tàu thuyền, máy móc nông nghiệp và máy phát điện. Tại Việt Nam, dầu Diesel được chia theo hàm lượng lưu huỳnh và mức tiêu chuẩn khí thải:</Text>

                <DefinitionItem title="DO 0,001S Mức 5 (cũ: DO 0.001S-V / Euro 5)" desc="Loại dầu cao cấp nhất hiện nay, cực ít lưu huỳnh (tối đa 10 mg/kg), ít khói, giúp kéo dài tuổi thọ động cơ và giảm thiểu tối đa ô nhiễm môi trường." />
                <DefinitionItem title="DO 0,05S Mức 2 (cũ: DO 0.05S-II / Euro 2)" desc="Loại dầu phổ biến nhất trên thị trường hiện nay với hàm lượng lưu huỳnh tối đa 500 mg/kg, đáp ứng tiêu chuẩn vận hành xe thông dụng." />

                <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: colors.textPrimary, marginBottom: 8, marginTop: 16 }}>Khác</Text>
                <DefinitionItem title="Dầu hỏa 2-K (Dầu KO)" desc="Nhiên liệu sử dụng cho thắp sáng, đun nấu hoặc các mục đích công nghiệp đặc thù." />
                <DefinitionItem title="Gas Petrolimex (LPG)" desc="Khí đốt hóa lỏng chuyên dụng. Bình 12kg chủ yếu dùng cho hộ gia đình, bình 48kg dùng cho nhà hàng và công nghiệp." />
            </ScrollView>
        );
    };

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

                <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 10 }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Tra cứu thông tin</Text>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}>
                            <X size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.tabsWrapper, { backgroundColor: colors.surfaceSubtle }]}>
                        <TouchableOpacity onPress={() => setActiveTab(0)} style={[styles.tabBtn, activeTab === 0 && { backgroundColor: colors.surface }]}>
                            <Text style={[styles.tabText, { color: activeTab === 0 ? colors.primary : colors.textSecondary }]}>Vùng 2</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActiveTab(1)} style={[styles.tabBtn, activeTab === 1 && { backgroundColor: colors.surface }]}>
                            <Text style={[styles.tabText, { color: activeTab === 1 ? colors.primary : colors.textSecondary }]}>Xăng</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActiveTab(2)} style={[styles.tabBtn, activeTab === 2 && { backgroundColor: colors.surface }]}>
                            <Text style={[styles.tabText, { color: activeTab === 2 ? colors.primary : colors.textSecondary }]}>Dầu/Gas</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                        {renderTabContent()}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { height: '85%', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 0 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontFamily: FONTS.bold, fontSize: 20 },
    closeBtn: { padding: 6, borderRadius: 20 },

    tabsWrapper: { flexDirection: 'row', padding: 4, borderRadius: 14, marginBottom: 16 },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    tabText: { fontFamily: FONTS.bold, fontSize: 13 },

    modalNote: { fontFamily: FONTS.regular, fontSize: 13, marginBottom: 16, lineHeight: 20, padding: 12, borderRadius: 10, borderLeftWidth: 3 },
    sectionContainer: { marginBottom: 16 },
    sectionHeader: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8 },
    sectionHeaderText: { fontFamily: FONTS.bold, fontSize: 12, textTransform: 'uppercase' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
    gridItem: { width: '33.33%', paddingHorizontal: 4, paddingVertical: 6, justifyContent: 'center' },
    fullItem: { width: '100%', paddingHorizontal: 4, paddingVertical: 6, justifyContent: 'center' },
    provinceText: { fontFamily: FONTS.medium, fontSize: 13, textAlign: 'center' },

    defItem: { paddingVertical: 12, borderBottomWidth: 1 },
    defTitle: { fontFamily: FONTS.bold, fontSize: 15, marginBottom: 4 },
    defDesc: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 20 }
});