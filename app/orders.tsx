import EmptyState from '@/components/EmptyState';
import { Ionicons } from '@/components/FlatIcon';
import FlatIllustration from '@/components/illustrations/FlatIllustration';
import { SkeletonRow } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { orderToneColors } from '@/constants/OrderTones';
import {
  ApiOrderRecord,
  describeOrderStatus,
  describePaymentStatus,
  getOrderById,
  getOrders,
  toAmount,
} from '@/services/api/ordersService';
import { formatCurrency } from '@/types/payment';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The list endpoint has no items, so the first page of orders is enriched from
// the detail endpoint in parallel (product name and picture).
const DETAIL_LIMIT = 12;

type OrderSummary = { title: string; image?: string; itemCount: number };

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const tones = orderToneColors(isDark);

  const [orders, setOrders] = useState<ApiOrderRecord[]>([]);
  const [summaries, setSummaries] = useState<Record<number, OrderSummary>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
  };

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setIsLoading(true);
    else setIsRefreshing(true);
    setHasError(false);
    try {
      const list = await getOrders(1);
      setOrders(list);

      const details = await Promise.allSettled(list.slice(0, DETAIL_LIMIT).map((o) => getOrderById(o.id)));
      const next: Record<number, OrderSummary> = {};
      details.forEach((result, i) => {
        if (result.status !== 'fulfilled') return;
        const items = result.value.items ?? [];
        const first = items[0]?.product;
        next[list[i].id] = {
          title: first?.title ? first.title : `Order #${list[i].id}`,
          image: first?.thumbnail_url || first?.media_url || undefined,
          itemCount: items.length,
        };
      });
      setSummaries(next);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const renderOrder = ({ item }: { item: ApiOrderRecord }) => {
    const status = describeOrderStatus(item.status);
    const payment = describePaymentStatus(item.payment_status);
    const summary = summaries[item.id];
    const title = summary
      ? summary.itemCount > 1
        ? `${summary.title} + ${summary.itemCount - 1} more`
        : summary.title
      : `Order #${item.id}`;
    const date = new Date(item.created_at).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const address = [item.shipping_address?.line1, item.shipping_address?.city].filter(Boolean).join(', ');

    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: tc.card, borderColor: tc.border }]}
        onPress={() => router.push(`/order-tracking/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={styles.orderTop}>
          {summary?.image ? (
            <Image source={{ uri: summary.image }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: Colors.light.primary + '20' }]}>
              <Ionicons name="bag" size={22} color={Colors.light.primary} />
            </View>
          )}
          <View style={styles.orderInfo}>
            <Text style={[styles.orderName, { color: tc.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.orderDate, { color: tc.sub }]}>
              Order #{item.id} · {date}
            </Text>
          </View>
        </View>

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: tones[status.tone].bg }]}>
            <Text style={[styles.badgeText, { color: tones[status.tone].fg }]}>{status.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: tones[payment.tone].bg }]}>
            <Text style={[styles.badgeText, { color: tones[payment.tone].fg }]}>{payment.label}</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: tc.border }]} />

        <View style={styles.orderBottom}>
          {address ? (
            <View style={styles.meta}>
              <Ionicons name="location" size={13} color={tc.sub} />
              <Text style={[styles.metaText, { color: tc.sub }]} numberOfLines={1}>
                {address}
              </Text>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={[styles.total, { color: tc.text }]}>{formatCurrency(toAmount(item.total), item.currency)}</Text>
            <View style={styles.trackLink}>
              <Text style={[styles.trackLinkText, { color: Colors.light.primary }]}>Details</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.light.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <View style={styles.list}>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </View>
    );
  } else if (hasError) {
    body = (
      <EmptyState
        icon="cloud-offline-outline"
        title="Couldn't load your orders"
        message="Check your connection and try again."
        onRetry={() => void load()}
      />
    );
  } else if (orders.length === 0) {
    body = (
      <View style={styles.emptyState}>
        <View style={{ marginBottom: 12 }}>
          <FlatIllustration name="bag" width={220} soft animated />
        </View>
        <Text style={[styles.emptyTitle, { color: tc.text }]}>No Orders Yet</Text>
        <Text style={[styles.emptySubtitle, { color: tc.sub }]}>
          Your orders will appear here once you make a purchase
        </Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/products-listing' as any)}>
          <Text style={styles.shopBtnText}>Browse Shop</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={() => void load('refresh')}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.text }]}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  orderCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  orderTop: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 10, gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1 },
  orderName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  orderDate: { fontSize: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: 16 },
  orderBottom: { padding: 16, gap: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  total: { fontSize: 18, fontWeight: '800' },
  trackLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trackLinkText: { fontSize: 14, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  shopBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
  shopBtnText: { color: '#0F1419', fontSize: 16, fontWeight: '700' },
});
