import React from 'react';
import { View, Text, Modal, TouchableOpacity, SectionList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZONE_2_DATA } from '../constants/zoneData';

interface ZoneModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ZoneModal: React.FC<ZoneModalProps> = ({ visible, onClose }) => {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Danh Mục Vùng 2</Text>
                            <Text style={styles.modalSubtitle}>Theo QĐ 630/PLX-QĐ-TGĐ</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Text style={styles.closeButton}>Đóng</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.modalNote}>
                        (*) Giá bán Vùng 2 cao hơn tối đa 2% so với giá điều hành.
                        {"\n"}Riêng mặt hàng Madút tại Bà Rịa - Vũng Tàu áp dụng giá Vùng 1.
                    </Text>

                    <SectionList
                        sections={ZONE_2_DATA}
                        keyExtractor={(item, index) => item + index}
                        renderItem={({ item }) => (
                            <View style={styles.provinceItem}>
                                <Text style={styles.provinceText}>• {item}</Text>
                            </View>
                        )}
                        renderSectionHeader={({ section: { title } }) => (
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionHeaderText}>{title}</Text>
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#FFF', height: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
    modalSubtitle: { fontSize: 13, color: '#7f8c8d', marginTop: 4 },
    closeButton: { fontSize: 16, color: '#e67e22', fontWeight: 'bold', padding: 5 },
    modalNote: {
        fontSize: 14, color: '#57606f', fontStyle: 'italic', marginBottom: 10, lineHeight: 20,
        backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#e67e22'
    },
    sectionHeader: {
        backgroundColor: '#dfe4ea', paddingVertical: 8, paddingHorizontal: 12, marginTop: 15, marginBottom: 5, borderRadius: 6,
    },
    sectionHeaderText: { fontSize: 14, fontWeight: 'bold', color: '#2f3542', textTransform: 'uppercase' },
    provinceItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1', paddingLeft: 10 },
    provinceText: { fontSize: 16, color: '#34495e' },
});