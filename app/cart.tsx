import { Alert } from '@/components/AppAlert';
import { Text } from '@/components/AppText';
import EmptyState from '@/components/EmptyState';
import { Ionicons } from '@/components/FlatIcon';
import GuestPrompt from '@/components/GuestPrompt';
import Colors from '@/constants/Colors';
import { CartLine, getCartLines, removeCartItem, updateCartItem } from '@/services/api/ordersService';
import type { RootState } from '@/store/store';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StatusBar, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const signedIn = useSelector((s: RootState) => s.auth.isAuthenticated);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const t = {
    bg: isDark ? '#000' : '#fff',
    card: isDark ? '#1A1A1A' : '#F5F7F8',
    text: isDark ? '#fff' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    border: isDark ? '#2C2C2E' : '#E3E7EA',
  };

  const load = useCallback(async () => {
    if (!signedIn) {
      setLoading(false);
      return;
    }
    setFailed(false);
    try {
      setLines(await getCartLines());
    } catch (error) {
      console.error('Failed to load cart:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [signedIn]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const change = async (line: CartLine, quantity: number) => {
    if (quantity < 1 || busyId) return;
    setBusyId(line.id);
    try {
      await updateCartItem(line.id, quantity);
      setLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, quantity } : l)));
    } catch (error: any) {
      Alert.alert("Couldn't update your cart", error?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = (line: CartLine) =>
    Alert.alert('Remove this item?', line.name, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusyId(line.id);
          try {
            await removeCartItem(line.id);
            setLines((prev) => prev.filter((l) => l.id !== line.id));
          } catch (error: any) {
            Alert.alert("Couldn't remove it", error?.message ?? 'Please try again.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const checkout = () => router.push('/checkout' as any);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.text }]}>Your cart</Text>
        <View style={styles.iconBtn} />
      </View>

      {!signedIn ? (
        <GuestPrompt illustration="bag" title="Sign in to use your cart" message="Your cart is saved to your account, so you can pick it up on any phone." />
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.light.primary} size="large" />
        </View>
      ) : failed ? (
        <EmptyState icon="cloud-offline-outline" title="We couldn't open your cart" message="Check your connection and try again." onRetry={load} />
      ) : lines.length === 0 ? (
        <EmptyState illustration="bag" title="Your cart is empty" message="Things you add from the shop show up here." onRetry={() => router.push('/(tabs)/discover' as any)} retryLabel="Browse the shop" />
      ) : (
        <>
          <FlatList
            data={lines}
            keyExtractor={(l) => l.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <View style={[styles.line, { backgroundColor: t.card }]}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Ionicons name="bag" size={26} color={Colors.light.primary} accent="#FFA000" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: t.text }]} numberOfLines={2}>{item.name}</Text>
                  <Text style={[styles.price, { color: Colors.light.primary }]}>₦{item.price.toLocaleString()}</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, { borderColor: t.border }, item.quantity <= 1 && { opacity: 0.4 }]}
                      onPress={() => change(item, item.quantity - 1)}
                      disabled={item.quantity <= 1 || busyId === item.id}
                      accessibilityLabel="Fewer"
                    >
                      <Ionicons name="remove" size={18} color={t.text} />
                    </TouchableOpacity>
                    <Text style={[styles.qty, { color: t.text }]}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={[styles.qtyBtn, { borderColor: t.border }]}
                      onPress={() => change(item, item.quantity + 1)}
                      disabled={busyId === item.id}
                      accessibilityLabel="More"
                    >
                      <Ionicons name="add" size={18} color={t.text} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity onPress={() => remove(item)} style={styles.trash} accessibilityLabel="Remove">
                  <Ionicons name="trash" size={20} color="#E5533F" />
                </TouchableOpacity>
              </View>
            )}
          />
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: t.border, backgroundColor: t.bg }]}>
            <View style={styles.totalRow}>
              <Text style={{ color: t.sub, fontSize: 15 }}>Subtotal</Text>
              <Text style={[styles.total, { color: t.text }]}>₦{subtotal.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.checkout} onPress={checkout}>
              <Text style={styles.checkoutText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 6 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', gap: 12, borderRadius: 16, padding: 12, alignItems: 'center' },
  thumb: { width: 76, height: 76, borderRadius: 12 },
  thumbEmpty: { backgroundColor: '#E3F7FA', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700' },
  price: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qty: { fontSize: 15, fontWeight: '700', minWidth: 18, textAlign: 'center' },
  trash: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  total: { fontSize: 20, fontWeight: '800' },
  checkout: { height: 48, borderRadius: 12, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  checkoutText: { fontSize: 16, fontWeight: '700', color: '#0F1419' },
});
