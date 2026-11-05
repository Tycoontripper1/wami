import EmptyState from '@/components/EmptyState';
import { Ionicons } from '@/components/FlatIcon';
import { SkeletonRow } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { orderToneColors } from '@/constants/OrderTones';
import {
  ApiOrderRecord,
  describeOrderStatus,
  describePaymentStatus,
  getOrderById,
  OrderStatusValue,
  orderRole,
  toAmount,
  updateOrderStatus,
} from '@/services/api/ordersService';
import { formatCurrency } from '@/types/payment';
import { Alert } from '@/components/AppAlert';
import type { RootState } from '@/store/store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * One order, read from GET /orders/:id: its state, items, amounts and the
 * address. Everything shown is data the backend returned — there is no
 * invented timeline or tracking number, because the backend has neither yet.
 */
export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const tones = orderToneColors(isDark);
  const myId = useSelector((st: RootState) => (st.auth.user as any)?.id);
  const [moving, setMoving] = useState(false);

  const [order, setOrder] = useState<ApiOrderRecord | null>(null);
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

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'initial') setIsLoading(true);
      else setIsRefreshing(true);
      setHasError(false);
      try {
        setOrder(await getOrderById(orderId));
      } catch (error) {
        console.error('Failed to load order:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={tc.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: tc.text }]}>Order #{orderId}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: tc.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {header}
        <View style={styles.content}>
          <SkeletonRow />
          <SkeletonRow />
        </View>
      </View>
    );
  }

  if (hasError || !order) {
    return (
      <View style={[styles.container, { backgroundColor: tc.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {header}
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load this order"
          message="It may have been removed, or the connection dropped."
          onRetry={() => void load()}
        />
      </View>
    );
  }

  const status = describeOrderStatus(order.status);
  const payment = describePaymentStatus(order.payment_status);
  const currency = order.currency || 'NGN';
  const money = (value: string | number) => formatCurrency(toAmount(value), currency);
  const placed = new Date(order.created_at).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const address = order.shipping_address ?? {};
  const addressLines = [address.line1, address.city, address.country].filter(Boolean) as string[];
  const awaitingPayment = (order.payment_status || '').toLowerCase() === 'pending';
  const role = orderRole(order, myId);
  const paid = ['paid', 'success', 'successful'].includes((order.payment_status || '').toLowerCase());
  const st = (order.status || '').toLowerCase();

  // The next move for this person, if there is one. The server has the last
  // word on who may do what; a refused move comes back as a message.
  let nextMove: { to: OrderStatusValue; label: string; ask: string } | null = null;
  if (role === 'seller' && paid) {
    if (st === 'placed') nextMove = { to: 'packing', label: 'Start packing', ask: 'Let the buyer know you are packing this order?' };
    else if (st === 'packing') nextMove = { to: 'dispatched', label: 'Mark as dispatched', ask: 'Mark this order as sent out for delivery?' };
    else if (st === 'dispatched') nextMove = { to: 'delivered', label: 'Mark as delivered', ask: 'Mark this order as delivered?' };
  } else if (role === 'buyer' && st === 'delivered') {
    nextMove = { to: 'complete', label: 'I received it', ask: 'Confirm you have received everything. This pays the seller.' };
  }
  const canCancel = role === 'buyer' && awaitingPayment && st === 'placed';

  const move = (to: OrderStatusValue, ask: string, label: string, destructive = false) =>
    Alert.alert(label, ask, [
      { text: 'Not now', style: 'cancel' },
      {
        text: label,
        style: destructive ? 'destructive' : 'default',
        onPress: async () => {
          setMoving(true);
          try {
            await updateOrderStatus(order.id, to);
            await load('refresh');
          } catch (error: any) {
            Alert.alert("That didn't go through", error?.message ?? 'Please try again.');
          } finally {
            setMoving(false);
          }
        },
      },
    ]);

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {header}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load('refresh')} />}
      >
        {/* State */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: tones[status.tone].bg }]}>
              <Text style={[styles.badgeText, { color: tones[status.tone].fg }]}>{status.label}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: tones[payment.tone].bg }]}>
              <Text style={[styles.badgeText, { color: tones[payment.tone].fg }]}>{payment.label}</Text>
            </View>
          </View>
          <Text style={[styles.meta, { color: tc.sub }]}>Placed on {placed}</Text>
          {awaitingPayment && role === 'seller' ? (
            <Text style={[styles.note, { color: tc.text }]}>Waiting for the buyer to pay. You will be able to start packing once they have.</Text>
          ) : null}
          {awaitingPayment && role === 'buyer' ? (
            <>
              <Text style={[styles.note, { color: tc.text }]}>This order is waiting for payment.</Text>
              <TouchableOpacity
                style={{ height: 44, borderRadius: 10, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}
                onPress={() => router.push(`/checkout?orderId=${order.id}` as any)}
              >
                <Text style={{ color: '#0F1419', fontSize: 15, fontWeight: '700' }}>Pay now</Text>
              </TouchableOpacity>
            </>
          ) : null}
          {nextMove ? (
            <TouchableOpacity
              style={{ height: 44, borderRadius: 10, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center', marginTop: 12, opacity: moving ? 0.6 : 1 }}
              onPress={() => move(nextMove!.to, nextMove!.ask, nextMove!.label)}
              disabled={moving}
            >
              {moving ? <ActivityIndicator color="#0F1419" /> : <Text style={{ color: '#0F1419', fontSize: 15, fontWeight: '700' }}>{nextMove.label}</Text>}
            </TouchableOpacity>
          ) : null}
          {canCancel ? (
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }} onPress={() => move('cancelled', 'This order has not been paid for. Cancel it?', 'Cancel order', true)} disabled={moving}>
              <Text style={{ color: '#E5533F', fontSize: 14, fontWeight: '700' }}>Cancel this order</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Items */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <Text style={[styles.sectionTitle, { color: tc.text }]}>Items</Text>
          {(order.items ?? []).length === 0 ? (
            <Text style={[styles.meta, { color: tc.sub }]}>No item details were returned for this order.</Text>
          ) : (
            (order.items ?? []).map((item, index) => {
              const product = item.product;
              const image = product?.thumbnail_url || product?.media_url || undefined;
              return (
                <View
                  key={item.id}
                  style={[styles.itemRow, index > 0 && { borderTopColor: tc.border, borderTopWidth: 1 }]}
                >
                  {image ? (
                    <Image source={{ uri: image }} style={styles.itemThumb} />
                  ) : (
                    <View style={[styles.itemThumb, styles.itemThumbPlaceholder, { backgroundColor: Colors.light.primary + '20' }]}>
                      <Ionicons name="bag" size={20} color={Colors.light.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: tc.text }]} numberOfLines={2}>
                      {product?.title ?? `Product #${item.product_id}`}
                    </Text>
                    <Text style={[styles.meta, { color: tc.sub }]}>
                      {item.quantity} × {money(item.unit_price)}
                    </Text>
                  </View>
                  <Text style={[styles.itemTotal, { color: tc.text }]}>{money(item.total_price)}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Amounts */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border, gap: 10 }]}>
          <Text style={[styles.sectionTitle, { color: tc.text }]}>Summary</Text>
          <View style={styles.sumRow}>
            <Text style={[styles.meta, { color: tc.sub }]}>Subtotal</Text>
            <Text style={[styles.sumValue, { color: tc.text }]}>{money(order.subtotal)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={[styles.meta, { color: tc.sub }]}>Delivery</Text>
            <Text style={[styles.sumValue, { color: tc.text }]}>
              {toAmount(order.shipping) === 0 ? 'Free' : money(order.shipping)}
            </Text>
          </View>
          {toAmount(order.tax) > 0 ? (
            <View style={styles.sumRow}>
              <Text style={[styles.meta, { color: tc.sub }]}>Tax</Text>
              <Text style={[styles.sumValue, { color: tc.text }]}>{money(order.tax)}</Text>
            </View>
          ) : null}
          <View style={[styles.sumRow, styles.totalRow, { borderTopColor: tc.border }]}>
            <Text style={[styles.totalLabel, { color: tc.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: tc.text }]}>{money(order.total)}</Text>
          </View>
        </View>

        {/* Address */}
        {addressLines.length > 0 ? (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>{role === 'seller' ? 'Send to' : 'Deliver to'}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location" size={18} color={Colors.light.primary} />
              <Text style={[styles.addressText, { color: tc.text }]}>{addressLines.join(', ')}</Text>
            </View>
            {address.phone ? (
              <View style={styles.addressRow}>
                <Ionicons name="call" size={18} color={Colors.light.primary} />
                <Text style={[styles.addressText, { color: tc.text }]}>{address.phone}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {order.payment_reference ? (
          <Text style={[styles.reference, { color: tc.sub }]}>Payment reference: {order.payment_reference}</Text>
        ) : null}
      </ScrollView>
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
  content: { padding: 16, gap: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  meta: { fontSize: 13 },
  note: { fontSize: 14, lineHeight: 21 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  itemThumb: { width: 52, height: 52, borderRadius: 14 },
  itemThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemTotal: { fontSize: 15, fontWeight: '700' },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumValue: { fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, paddingTop: 12, marginTop: 2 },
  totalLabel: { fontSize: 16, fontWeight: '800' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  addressText: { flex: 1, fontSize: 15, lineHeight: 22 },
  reference: { fontSize: 12, textAlign: 'center' },
});
