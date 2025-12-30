import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency, getGasColor } from '../utils/helpers';

interface GasItemProps {
    item: any;
}

export const GasItemCard: React.FC<GasItemProps> = ({ item }) => {
    const mainColor = getGasColor(item.title);
    const badgeText = item.title.includes('95') ? '95' : item.title.includes('E5') ? 'E5' : 'DO';

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: mainColor }]}>
                    <Text style={styles.badgeText}>{badgeText}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemName}>{item.title}</Text>
                    <Text style={styles.itemDate}>Cập nhật: {item.updated_at?.substring(0, 10)}</Text>
                </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
                <View style={styles.priceBlock}>
                    <Text style={styles.zoneTitle}>VÙNG 1</Text>
                    <Text style={[styles.priceText, { color: '#333' }]}>{formatCurrency(item.zone1_price)}</Text>
                    <Text style={styles.unitText}>VNĐ/Lít</Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.priceBlock}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.zoneTitle}>VÙNG 2</Text>
                        <Text style={styles.zoneDiff}>(+2%)</Text>
                    </View>
                    <Text style={[styles.priceText, { color: '#c0392b' }]}>{formatCurrency(item.zone2_price)}</Text>
                    <Text style={styles.unitText}>VNĐ/Lít</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, padding: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    badge: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    itemName: { fontSize: 18, fontWeight: '700', color: '#2c3e50' },
    itemDate: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 12 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    priceBlock: { flex: 1, alignItems: 'center' },
    verticalLine: { width: 1, backgroundColor: '#ecf0f1', marginHorizontal: 10 },
    zoneTitle: { fontSize: 12, fontWeight: '700', color: '#7f8c8d', marginBottom: 4 },
    zoneDiff: { fontSize: 10, color: '#c0392b', marginLeft: 4, fontWeight: 'bold' },
    priceText: { fontSize: 20, fontWeight: 'bold' },
    unitText: { fontSize: 10, color: '#95a5a6', marginTop: 2 },
});