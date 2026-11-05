import { Alert } from '@/components/AppAlert';
import { Text } from '@/components/AppText';
import { AddressSheet, Destination, PhoneSheet } from '@/components/checkout/CheckoutSheets';
import { Ionicons } from '@/components/FlatIcon';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/Colors';
import {
  CartLine,
  describePaymentStatus,
  getCartLines,
  getOrderById,
  placeOrder,
  toAmount,
} from '@/services/api/ordersService';
import { initializePayment, verifyPayment } from '@/services/api/paymentsService';
import type { RootState } from '@/store/store';
import { SavedAddress, loadAddresses } from '@/utils/addressBook';
import { absoluteUrl } from '@/utils/mediaUrl';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

type Phase = 'form' | 'awaiting';

const PAID = ['paid', 'success', 'successful'];

/* Checkout runs off the cart. Pay places the order (once), asks the server to
   start the payment, and opens the gateway's own page. The money side is the
   server's: when the person comes back we ask it whether the payment landed,
   and only a paid order reaches the success screen. */
export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const params = useLocalSearchParams<{ orderId?: string }>();
  const user = useSelector((s: RootState) => s.auth.user) as any;

  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // The phone on the account is used by default and can be changed per order.
  const accountPhone: string = user?.phone ?? '';
  const [phone, setPhone] = useState(accountPhone);

  // Saved addresses live on this phone. `destination` is where this order goes.
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [showAddress, setShowAddress] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  // An order that exists but is not paid yet. Coming from "Pay now" on an
  // order sets it straight away; otherwise it is created on the first Pay.
  const [orderId, setOrderId] = useState<string | null>(params.orderId ? String(params.orderId) : null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const reference = useRef<string | null>(null);

  const [phase, setPhase] = useState<Phase>('form');
  const [busy, setBusy] = useState(false);
  const checking = useRef(false);

  const t = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      if (params.orderId) {
        const order = await getOrderById(params.orderId);
        setOrderTotal(toAmount(order.total));
        setLines(
          (order.items ?? []).map((i) => ({
            id: String(i.id),
            productId: String(i.product_id),
            name: i.product?.title ?? 'Item',
            price: toAmount(i.unit_price),
            quantity: i.quantity,
            image: absoluteUrl(i.product?.thumbnail_url || i.product?.media_url),
          }))
        );
      } else {
        setLines(await getCartLines());
      }
    } catch (error) {
      console.error('Failed to load checkout:', error);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [params.orderId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadAddresses(user?.id).then((list) => {
      setSaved(list);
      const first = list.find((a) => a.isDefault) ?? list[0];
      if (first) {
        setDestination({ id: first.id, label: first.label, line1: first.line1, city: first.city });
        if (first.phone) setPhone(first.phone);
      }
    });
  }, [user?.id]);

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const total = orderTotal ?? subtotal;
  const needsAddress = !orderId && !destination;
  const needsPhone = !orderId && phone.trim().length === 0;

  /** Ask the server whether this order is paid. Returns true and moves on if it is. */
  const checkPayment = useCallback(
    async (quiet = false): Promise<boolean> => {
      if (!orderId || checking.current) return false;
      checking.current = true;
      setBusy(true);
      try {
        // The gateway's webhook is the source of truth; verify is the fallback
        // for when it has not arrived. A refusal here only means "not yet".
        if (reference.current) {
          await verifyPayment({ order_id: orderId, reference: reference.current }).catch(() => {});
        }
        const order = await getOrderById(orderId);
        if (PAID.includes(String(order.payment_status ?? '').toLowerCase())) {
          router.replace(`/checkout/success?orderId=${orderId}&trackingNumber=${encodeURIComponent(`WM-${String(orderId).padStart(6, '0')}`)}` as any);
          return true;
        }
        if (!quiet) {
          const status = describePaymentStatus(String(order.payment_status ?? 'pending')).label;
          Alert.alert('Not paid yet', `We have not received your payment (${status}). If you have just paid, give it a moment and check again.`);
        }
        return false;
      } catch (error: any) {
        if (!quiet) Alert.alert("Couldn't check your payment", error?.message ?? 'Please try again.');
        return false;
      } finally {
        checking.current = false;
        setBusy(false);
      }
    },
    [orderId, router]
  );

  // Coming back from the payment page: look at the order straight away.
  useEffect(() => {
    if (phase !== 'awaiting') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkPayment(true);
    });
    return () => sub.remove();
  }, [phase, checkPayment]);

  const pay = async () => {
    if (busy) return;
    Keyboard.dismiss();
    if (!orderId && lines.length === 0) {
      Alert.alert('Your cart is empty', 'Add something before you check out.');
      return;
    }
    if (needsAddress) {
      setShowAddress(true);
      return;
    }
    if (needsPhone) {
      setShowPhone(true);
      return;
    }

    setBusy(true);
    try {
      // The order is created once; paying again after a cancelled attempt reuses it.
      let id = orderId;
      if (!id) {
        const res = await placeOrder({ shipping_address: { line1: destination!.line1, city: destination!.city, country: 'Nigeria', phone: phone.trim() } });
        id = String((res.data as any)?.id ?? (res.data as any)?.order?.id ?? '');
        if (!id) throw new Error('The order was created but we did not get its number back.');
        setOrderId(id);
        setOrderTotal(toAmount((res.data as any)?.total ?? (res.data as any)?.order?.total) || null);
      }

      const init = await initializePayment({ order_id: id });
      const body: any = init.data ?? {};
      const url: string | undefined = body.authorization_url ?? body.data?.authorization_url;
      reference.current = body.reference ?? body.data?.reference ?? null;
      if (!url) throw new Error('The payment page did not open. Please try again.');

      setPhase('awaiting');
      setBusy(false);
      await WebBrowser.openBrowserAsync(url);
      // iOS resolves when the page is closed; Android may resolve at once, and
      // the app coming back to the foreground covers that case.
      void checkPayment(true);
    } catch (error: any) {
      console.error('Checkout failed:', error);
      setBusy(false);
      Alert.alert("Couldn't start your payment", error?.message ?? 'Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (loadFailed) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg, paddingTop: insets.top }]}>
        <EmptyState icon="cloud-offline-outline" title="We couldn't open checkout" message="Check your connection and try again." onRetry={load} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: t.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: t.card, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.text }]}>Checkout</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* What you are buying */}
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[styles.label, { color: t.sub }]}>Your order</Text>
          {lines.length === 0 ? (
            <Text style={{ color: t.sub, marginTop: 8 }}>Nothing here yet.</Text>
          ) : (
            lines.map((l) => (
              <View key={l.id} style={styles.item}>
                {l.image ? (
                  <Image source={{ uri: l.image }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Ionicons name="bag" size={22} color={Colors.light.primary} accent="#FFA000" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: t.text }]} numberOfLines={2}>{l.name}</Text>
                  <Text style={{ color: t.sub, fontSize: 13, marginTop: 2 }}>Qty {l.quantity}</Text>
                </View>
                <Text style={[styles.itemPrice, { color: t.text }]}>₦{(l.price * l.quantity).toLocaleString()}</Text>
              </View>
            ))
          )}
          <View style={[styles.divider, { backgroundColor: t.border }]} />
          <View style={styles.row}>
            <Text style={{ color: t.sub, fontSize: 15 }}>{orderTotal ? 'Total' : 'Subtotal'}</Text>
            <Text style={[styles.total, { color: t.text }]}>₦{(orderTotal ?? subtotal).toLocaleString()}</Text>
          </View>
          {!orderTotal ? (
            <Text style={{ color: t.sub, fontSize: 12, marginTop: 6 }}>Delivery and any fees are worked out when you place the order. You will see the final total on the payment page.</Text>
          ) : null}
        </View>

        {/* Where it goes and who to call: only before the order exists */}
        {!orderId ? (
          <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border, paddingVertical: 4 }]}>
            <TouchableOpacity style={styles.summaryRow} onPress={() => setShowAddress(true)} activeOpacity={0.7}>
              <Ionicons name="location" size={22} color={Colors.light.primary} accent="#FFA000" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: t.sub }]}>Deliver to</Text>
                {destination ? (
                  <Text style={[styles.rowValue, { color: t.text }]} numberOfLines={2}>
                    {destination.label ? `${destination.label} · ` : ''}{destination.line1}, {destination.city}
                  </Text>
                ) : (
                  <Text style={[styles.rowValue, { color: Colors.light.primary }]}>Add a delivery address</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={t.sub} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: t.border, marginVertical: 0 }]} />
            <TouchableOpacity style={styles.summaryRow} onPress={() => setShowPhone(true)} activeOpacity={0.7}>
              <Ionicons name="call" size={22} color={Colors.light.primary} accent="#FFA000" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: t.sub }]}>Contact</Text>
                <Text style={[styles.rowValue, { color: phone ? t.text : Colors.light.primary }]}>{phone || 'Add a phone number'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={t.sub} />
            </TouchableOpacity>
          </View>
        ) : null}

        {phase === 'awaiting' ? (
          <View style={[styles.card, { backgroundColor: Colors.light.primary + '15', borderColor: Colors.light.primary }]}>
            <Text style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>
              Finished paying? Tap below and we will check. If you closed the payment page, you can open it again.
            </Text>
            <TouchableOpacity style={[styles.secondary, { borderColor: t.border }]} onPress={() => checkPayment(false)} disabled={busy}>
              {busy ? <ActivityIndicator color={Colors.light.primary} /> : <Text style={[styles.secondaryText, { color: Colors.light.primary }]}>I have paid, check now</Text>}
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: t.card, borderTopColor: t.border }]}>
        <View style={styles.footerRow}>
          <View>
            <Text style={{ color: t.sub, fontSize: 12 }}>{orderTotal ? 'Total' : 'Subtotal'}</Text>
            <Text style={[styles.footerTotal, { color: t.text }]}>₦{total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={[styles.primary, styles.payBtn, busy && { opacity: 0.6 }]} onPress={pay} disabled={busy}>
            {busy && phase === 'form' ? (
              <ActivityIndicator color="#0F1419" />
            ) : (
              <Text style={styles.primaryText}>{phase === 'awaiting' ? 'Open payment page' : 'Pay now'}</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={{ color: t.sub, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
          You pay on a secure page. Wami holds the money until your order is delivered.
        </Text>
      </View>

      <AddressSheet
        visible={showAddress}
        onClose={() => setShowAddress(false)}
        userId={user?.id}
        saved={saved}
        selectedId={destination?.id}
        accountPhone={accountPhone}
        onSaved={setSaved}
        onSelect={(d, savedPhone) => {
          setDestination(d);
          if (savedPhone) setPhone(savedPhone);
        }}
      />
      <PhoneSheet visible={showPhone} onClose={() => setShowPhone(false)} phone={phone} accountPhone={accountPhone} onSave={setPhone} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  thumbEmpty: { backgroundColor: '#E3F7FA', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemPrice: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  rowLabel: { fontSize: 12, fontWeight: '600' },
  rowValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  footerTotal: { fontSize: 22, fontWeight: '800' },
  payBtn: { flex: 1, maxWidth: 220 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 20, fontWeight: '800' },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  primary: { height: 48, borderRadius: 12, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#0F1419' },
  secondary: { height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  secondaryText: { fontSize: 15, fontWeight: '700' },
});
