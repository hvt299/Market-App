import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Fuel } from 'lucide-react-native';
import { formatCurrency, getLogo, CARD_STYLES } from '../utils/helpers';

interface GasItemCardProps {
    item: any;
    providerId: string;
    onPress: () => void;
}

export const GasItemCard: React.FC<GasItemCardProps> = ({ item, providerId, onPress }) => {
    const logoUrl = getLogo(providerId);
    const isPvoil = providerId === 'Pvoil';

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={styles.card}
        >
            {/* --- Header Card: Logo & Tên --- */}
            <View style={styles.cardTop}>
                {logoUrl ? (
                    <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
                ) : (
                    <View style={styles.logoPlaceholder}>
                        <Fuel size={24} color="#2c3e50" />
                    </View>
                )}
                <View style={styles.cardHeaderInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.tapHint}>(Chạm để xem lịch sử)</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* --- Body Card: Giá --- */}
            <View style={styles.priceContainer}>
                {isPvoil ? (
                    <View style={[styles.priceBox, { alignItems: 'center' }]}>
                        <Text style={styles.priceLabel}>GIÁ BÁN LẺ</Text>
                        <Text style={styles.priceValue}>{formatCurrency(item.price)}</Text>
                        <Text style={styles.currency}>VNĐ</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.priceBox}>
                            <Text style={styles.priceLabel}>VÙNG 1</Text>
                            <Text style={styles.priceValue}>{formatCurrency(item.zone1_price)}</Text>
                            <Text style={styles.currency}>VNĐ</Text>
                        </View>
                        <View style={styles.verticalLine} />
                        <View style={styles.priceBox}>
                            <Text style={[styles.priceLabel, { color: '#c0392b' }]}>VÙNG 2</Text>
                            <Text style={[styles.priceValue, { color: '#c0392b' }]}>{formatCurrency(item.zone2_price)}</Text>
                            <Text style={styles.currency}>VNĐ</Text>
                        </View>
                    </>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: { ...CARD_STYLES },

    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    logo: { width: 40, height: 40, marginRight: 12 },
    logoPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ecf0f1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardHeaderInfo: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },
    tapHint: { fontSize: 10, color: '#e67e22', fontStyle: 'italic', marginTop: 2 },

    divider: { height: 1, backgroundColor: '#eee', marginBottom: 12 },

    priceContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    priceBox: { flex: 1, alignItems: 'center' },
    verticalLine: { width: 1, backgroundColor: '#eee', marginHorizontal: 10 },

    priceLabel: { fontSize: 11, fontWeight: '600', color: '#7f8c8d', marginBottom: 4 },
    priceValue: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
    currency: { fontSize: 10, color: '#bdc3c7' }
});