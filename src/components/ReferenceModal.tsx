import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZONE_2_DATA } from '../constants/zoneData';
import { useTheme } from '../theme/ThemeContext';
import { X, Map, Fuel, Flame } from 'lucide-react-native';

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
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    <Text style={[styles.modalNote, { color: colors.textSecondary, backgroundColor: isDarkMode ? '#2c2c2e' : '#f9f9f9', borderLeftColor: colors.primary }]}>
                        (*) Giá bán Vùng 2 (Petrolimex) cao hơn tối đa 2% so với giá điều hành. Riêng mặt hàng Madút tại <Text style={{ fontWeight: '700', color: colors.primary }}>Bà Rịa - Vũng Tàu</Text> áp dụng giá Vùng 1.
                    </Text>
                    {ZONE_2_DATA.map((section, index) => {
                        const isLong = index === 1;
                        return (
                            <View key={index} style={styles.sectionContainer}>
                                <View style={[styles.sectionHeader, { backgroundColor: isDarkMode ? colors.border : '#dfe4ea' }]}>
                                    <Text style={[styles.sectionHeaderText, { color: colors.textPrimary }]}>{section.title}</Text>
                                </View>
                                <View style={styles.gridContainer}>
                                    {section.data.map((item, idx) => (
                                        <View key={idx} style={[isLong ? styles.fullItem : styles.gridItem, { borderColor: colors.border }]}>
                                            <Text style={[styles.provinceText, isLong && { textAlign: 'left', paddingLeft: 8 }, item.includes('*') ? { color: colors.primary, fontWeight: '700' } : { color: colors.textSecondary }]}>{item}</Text>
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
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    <DefinitionItem title="Xăng E5 RON 92" desc="Là hỗn hợp gồm 95% xăng khoáng truyền thống và 5% cồn sinh học Ethanol. Xăng có màu xanh, phù hợp với hầu hết các loại xe máy phổ thông và ô tô đời cũ." />
                    <DefinitionItem title="Xăng E10" desc="Theo lộ trình chuyển đổi, xăng sinh học E10 (pha 10% ethanol) đang dần thay thế xăng khoáng. Loại xăng này có khả năng đốt cháy sạch, bảo vệ môi trường và tối ưu cho các dòng xe đời mới." />
                    <DefinitionItem title="Xăng RON 95-III (A95)" desc="Xăng không chì cao cấp có chỉ số octan 95 đạt tiêu chuẩn khí thải Euro 3. Có màu vàng nhạt, khả năng chống kích nổ tốt, giúp động cơ vận hành êm ái và bền bỉ." />
                    <DefinitionItem title="Xăng RON 95-IV" desc="Là phiên bản cao cấp hơn của A95, đạt tiêu chuẩn khí thải Euro 4 hoặc Euro 5. Loại này có hàm lượng lưu huỳnh cực thấp, thân thiện với môi trường và phù hợp cho các dòng xe hơi hạng sang." />
                </ScrollView>
            );
        }

        return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8, marginTop: 10 }}>Dầu Diesel (DO)</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>Là nhiên liệu chủ lực cho các dòng xe tải, xe bán tải, tàu thuyền, máy móc nông nghiệp và máy phát điện. Tại Việt Nam, dầu Diesel được chia theo hàm lượng lưu huỳnh:</Text>

                <DefinitionItem title="DO 0.001S (Euro 5)" desc="Loại dầu cao cấp nhất hiện nay, cực ít lưu huỳnh, ít khói, giúp kéo dài tuổi thọ động cơ và giảm thiểu ô nhiễm." />
                <DefinitionItem title="DO 0.05S" desc="Loại dầu phổ biến trên thị trường, đáp ứng các tiêu chuẩn khí thải mức thấp hơn." />

                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8, marginTop: 16 }}>Khác</Text>
                <DefinitionItem title="Dầu hỏa 2-K" desc="Nhiên liệu sử dụng cho thắp sáng, đun nấu hoặc các mục đích công nghiệp đặc thù." />
                <DefinitionItem title="Gas (LPG)" desc="Khí đốt hóa lỏng chuyên dụng. Bình 12kg chủ yếu dùng cho hộ gia đình, bình 48kg dùng cho nhà hàng và công nghiệp." />
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
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.border }]}>
                            <X size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.tabsWrapper, { backgroundColor: isDarkMode ? '#2c2c2e' : '#f0f2f5' }]}>
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
    modalContent: { height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 0 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    closeBtn: { padding: 6, borderRadius: 20 },

    tabsWrapper: { flexDirection: 'row', padding: 4, borderRadius: 12, marginBottom: 16 },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    tabText: { fontSize: 13, fontWeight: '700' },

    modalNote: { fontSize: 13, fontStyle: 'italic', marginBottom: 16, lineHeight: 20, padding: 12, borderRadius: 8, borderLeftWidth: 3 },
    sectionContainer: { marginBottom: 16 },
    sectionHeader: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginBottom: 8 },
    sectionHeaderText: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
    gridItem: { width: '33.33%', paddingHorizontal: 4, paddingVertical: 6, justifyContent: 'center' },
    fullItem: { width: '100%', paddingHorizontal: 4, paddingVertical: 6, justifyContent: 'center' },
    provinceText: { fontSize: 13, textAlign: 'center', fontWeight: '500' },

    defItem: { paddingVertical: 12, borderBottomWidth: 1 },
    defTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    defDesc: { fontSize: 13, lineHeight: 20 }
});