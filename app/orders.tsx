import Colors from '@/constants/Colors';
import { RootState } from '@/store/store';
import { ProductOrder } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  packed: { label: 'Packed', color: '#FF9500' },
  on_way_to_logistics: { label: 'On the Way', color: '#007AFF' },
  at_logistics: { label: 'At Facility', color: '#007AFF' },
  shipped: { label: 'Shipped', color: '#5856D6' },
  out_for_delivery: { label: 'Out for Delivery', color: '#FF9500' },
  delivered: { label: 'Delivered', color: '#4CD964' },
  delivery_failed: { label: 'Delivery Failed', color: '#FF3B30' },
};

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const orders = useSelector((state: RootState) => state.payment.productOrders);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
    input: isDark ? '#2C2C2E' : '#F3F4F6',
  };

  const renderOrder = ({ item }: { item: ProductOrder }) => {
    const statusInfo = STATUS_LABELS[item.orderStatus] || { label: item.orderStatus, color: tc.sub };
    const formattedDate = new Date(item.createdAt).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: tc.card, borderColor: tc.border }]}
        onPress={() => router.push(`/order-tracking/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.orderTop}>
          <View style={[styles.orderIcon, { backgroundColor: Colors.light.primary + '20' }]}>
            <Ionicons name="cube" size={22} color={Colors.light.primary} />
          </View>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderName, { color: tc.text }]} numberOfLines={1}>{item.productName}</Text>
            <Text style={[styles.orderDate, { color: tc.sub }]}>{formattedDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: tc.border }]} />

        <View style={styles.orderBottom}>
          <View style={styles.orderMeta}>
            <Ionicons name="location" size={13} color={tc.sub} />
            <Text style={[styles.orderMetaText, { color: tc.sub }]} numberOfLines={1}>
              {item.shippingAddress.address || 'No address'}
            </Text>
          </View>
          <View style={styles.orderMeta}>
            <Ionicons name="receipt" size={13} color={tc.sub} />
            <Text style={[styles.orderMetaText, { color: tc.sub }]}>{item.trackingNumber}</Text>
          </View>
          <View style={styles.orderPriceRow}>
            <Text style={[styles.orderTotal, { color: tc.text }]}>₦{item.total.toLocaleString()}</Text>
            <View style={styles.trackLink}>
              <Text style={[styles.trackLinkText, { color: Colors.light.primary }]}>Track</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.light.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.text }]}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: Colors.light.primary + '15' }]}>
            <Ionicons name="bag" size={48} color={Colors.light.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: tc.text }]}>No Orders Yet</Text>
          <Text style={[styles.emptySubtitle, { color: tc.sub }]}>
            Your orders will appear here once you make a purchase
          </Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/products-listing' as any)}>
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  orderCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  orderTop: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  orderIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1 },
  orderName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  orderDate: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: 16 },
  orderBottom: { padding: 16, gap: 8 },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderMetaText: { fontSize: 13, flex: 1 },
  orderPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  orderTotal: { fontSize: 18, fontWeight: '800' },
  trackLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trackLinkText: { fontSize: 14, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  shopBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
