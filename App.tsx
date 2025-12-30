import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, ActivityIndicator,
  StatusBar, RefreshControl, TouchableOpacity, Modal, SectionList, Alert, Platform
} from 'react-native';
// Thêm import useSafeAreaInsets để xử lý padding thủ công khi cần
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';

// --- DỮ LIỆU DANH SÁCH VÙNG 2 (Chuẩn theo ảnh QĐ 630 bạn cung cấp) ---
const ZONE_2_DATA = [
  {
    title: "I. Các Tỉnh/TP đủ điều kiện áp dụng Vùng 2",
    data: [
      "Lai Châu", "Điện Biên", "Sơn La", "Cao Bằng", "Lạng Sơn", "Tuyên Quang",
      "Lào Cai", "Thái Nguyên", "Bắc Ninh", "Ninh Bình", "Thanh Hóa", "Nghệ An",
      "Hà Tĩnh", "TP Huế", "Quảng Trị", "Gia Lai", "Khánh Hòa", "Lâm Đồng",
      "Đắk Lắk", "Vĩnh Long", "Đồng Tháp", "Cà Mau", "An Giang"
    ]
  },
  {
    title: "II. Các Tỉnh/TP áp dụng Vùng 2 theo vùng",
    data: [
      "Tỉnh Phú Thọ (gồm Phú Thọ và Hòa Bình)",
      "Tỉnh Hưng Yên (thuộc Thái Bình cũ)",
      "TP Đà Nẵng (gồm Quảng Nam)",
      "Tỉnh Quảng Ngãi (gồm KonTum)",
      "TP Hồ Chí Minh (gồm Bà Rịa - Vũng Tàu*)",
      "Tỉnh Đồng Nai (gồm Bình Phước)",
      "TP Cần Thơ (gồm Sóc Trăng và Hậu Giang)"
    ]
  },
  {
    title: "III. Khu vực khác",
    data: [
      "Tất cả các đảo thuộc Việt Nam"
    ]
  }
];

// Tách Component chính ra để dùng được hook useSafeAreaInsets (nếu cần mở rộng sau này)
function MainScreen() {
  const [gasData, setGasData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Lấy thông số vùng an toàn để xử lý Modal
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });
    fetchGasPrices();
    return () => unsubscribe();
  }, []);

  const formatCurrency = (value: number) => {
    return value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
  };

  const getGasColor = (name: string) => {
    if (!name) return '#95A5A6';
    if (name.includes('95')) return '#e67e22';
    if (name.includes('E5')) return '#27AE60';
    if (name.includes('DO') || name.includes('Dầu')) return '#2980b9';
    return '#34495e';
  };

  // Hàm lấy ngày hôm qua (dùng khi API trả về rỗng toàn bộ)
  const getPreviousDay = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Hàm gọi API (Có tham số dateStr để hỗ trợ gọi đệ quy lùi ngày)
  const fetchGasPrices = async (dateStr?: string) => {
    // 1. Kiểm tra mạng
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      setIsConnected(false);
      setLoading(false);
      setRefreshing(false);
      Alert.alert("Mất kết nối", "Vui lòng kiểm tra lại đường truyền internet.");
      return;
    }
    setIsConnected(true);

    try {
      // 2. Xác định ngày cần lấy (Nếu không truyền vào thì lấy hôm nay)
      let targetDate = dateStr;
      if (!targetDate) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        targetDate = `${year}-${month}-${day}`;
      }
      const apiUrl = `https://giaxanghomnay.com/api/pvdate/${targetDate}`;
      const response = await axios.get(apiUrl);

      // 3. LOGIC MỚI: TÌM DỮ LIỆU KHÁC RỖNG
      let foundData = [];

      if (Array.isArray(response.data)) {
        // Duyệt qua từng phần tử trong mảng response
        for (let i = 0; i < response.data.length; i++) {
          const item = response.data[i];
          // Nếu phần tử là mảng và có dữ liệu bên trong -> LẤY LUÔN và DỪNG
          if (Array.isArray(item) && item.length > 0) {
            foundData = item;
            break;
          }
        }
      }

      // 4. Xử lý kết quả tìm được
      if (foundData.length > 0) {
        setGasData(foundData);
      } else {
        // Trường hợp đặc biệt: Cả response đều rỗng (VD: ngày 1/1 trả về [[],[],[]])
        // Ta sẽ thử gọi lại API với ngày hôm qua (Lùi 1 ngày)
        const yesterday = getPreviousDay(targetDate);

        // Chỉ lùi tối đa nếu ngày hiện tại chưa quá xa (tránh vòng lặp vô tận)
        // Ở đây mình gọi đệ quy 1 lần
        if (dateStr !== yesterday) {
          await fetchGasPrices(yesterday);
          return; // Kết thúc hàm hiện tại để hàm đệ quy chạy
        } else {
          setGasData([]); // Chịu thua, không có dữ liệu
        }
      }

    } catch (error) {
      console.error("Lỗi gọi API:", error);
      // Nếu lỗi 404 hoặc lỗi mạng khi gọi ngày hiện tại, thử lùi ngày 1 lần
      if (!dateStr) {
        const today = new Date();
        const yesterdayStr = getPreviousDay(today.toISOString().split('T')[0]);
        console.log("Lỗi API, thử fallback về:", yesterdayStr);
        await fetchGasPrices(yesterdayStr);
        return;
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGasPrices();
  }, []);

  const renderItem = ({ item }: { item: any }) => {
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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />

      {/* FIX 1: Tách SafeAreaView thành 2 phần.
        Phần 1 (Top): Màu xanh (#2c3e50) chỉ xử lý phần tai thỏ phía trên.
      */}
      <SafeAreaView style={{ flex: 0, backgroundColor: '#2c3e50' }} edges={['top']} />

      {/* Phần 2 (Body): Màu xám (#ecf0f1) xử lý phần đáy.
        Điều này đảm bảo vạch đáy màn hình trùng màu với nội dung, không bị vệt đen/xanh.
      */}
      <SafeAreaView style={styles.bodySafeArea} edges={['left', 'right', 'bottom']}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>MARKET APP</Text>
            <Text style={styles.headerSubtitle}>Giá xăng dầu Petrolimex</Text>
          </View>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.infoButton}>
            <Text style={styles.infoButtonText}>?</Text>
          </TouchableOpacity>
        </View>

        {!isConnected && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>Không có kết nối Internet</Text>
          </View>
        )}

        <View style={styles.body}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#e67e22" />
              <Text style={{ marginTop: 10, color: '#7f8c8d' }}>Đang tải dữ liệu...</Text>
            </View>
          ) : (
            <FlatList
              data={gasData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e67e22']} />
              }
              ListFooterComponent={<View style={{ height: 20 }} />}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{isConnected ? "Không có dữ liệu hôm nay." : "Vui lòng kết nối mạng."}</Text>
              }
            />
          )}
        </View>

        {/* MODAL DANH SÁCH VÙNG 2 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            {/* FIX 2: Xử lý vùng an toàn cho Modal.
               Thêm paddingBottom = insets.bottom để nội dung không bị thanh Home che khuất.
            */}
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Danh Mục Vùng 2</Text>
                  <Text style={styles.modalSubtitle}>Theo QĐ 630/PLX-QĐ-TGĐ</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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

      </SafeAreaView>
    </>
  );
}

// Component App gốc chỉ làm nhiệm vụ cung cấp Context
export default function App() {
  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  // FIX: Body Safe Area giờ có màu trùng với nền nội dung (xám)
  bodySafeArea: {
    flex: 1,
    backgroundColor: '#ecf0f1'
  },
  body: {
    flex: 1,
    backgroundColor: '#ecf0f1'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 20,
    backgroundColor: '#2c3e50', // Màu header vẫn là xanh
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
    zIndex: 10
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', letterSpacing: 1 },
  headerSubtitle: { fontSize: 12, color: '#bdc3c7', marginTop: 2 },
  infoButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)'
  },
  infoButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },

  offlineBanner: { backgroundColor: '#c0392b', padding: 10, alignItems: 'center' },
  offlineText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  listContent: { padding: 16 },
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
  emptyText: { textAlign: 'center', marginTop: 50, color: '#7f8c8d' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFF',
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    // Padding bottom sẽ được override bằng insets trong code logic
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