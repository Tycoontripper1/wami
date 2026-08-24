import Colors from '@/constants/Colors';
import { deliveryService } from '@/services/deliveryService';
import { updateProductOrderStatus } from '@/store/paymentSlice';
import { RootState } from '@/store/store';
import { Driver, VEHICLE_ICONS } from '@/types/delivery';
import { buildOrderTimeline, formatCurrency } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function DriverCompareScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const order = useSelector((state: RootState) => state.payment.productOrders.find(o => o.id === orderId));
  const [drivers, setDrivers] = useState<Driver[] | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
  };

  useEffect(() => {
    if (!order) return;
    deliveryService.findDrivers(order).then(setDrivers);
  }, [order?.id]);

  const handleSelect = (driver: Driver) => {
    if (!order) return;
    setSelectingId(driver.id);
    dispatch(updateProductOrderStatus({
      orderId: order.id,
      orderStatus: 'out_for_delivery',
      timeline: buildOrderTimeline('out_for_delivery'),
    }));
    router.push(`/delivery/tracking/${order.id}?driverId=${driver.id}` as any);
  };

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: tc.text }}>Order not found</Text>
      </View>
    );
  }

  const renderDriver = ({ item }: { item: Driver }) => (
    <View style={[styles.driverCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={[styles.driverName, { color: tc.text }]} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.tierBadge, { backgroundColor: item.tier === 'premium' ? '#FFD70020' : tc.border }]}>
            <Text style={[styles.tierBadgeText, { color: item.tier === 'premium' ? '#B8860B' : tc.sub }]}>
              {item.tier === 'premium' ? 'Premium' : 'Standard'}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name={VEHICLE_ICONS[item.vehicleType] as any} size={14} color={tc.sub} />
          <Text style={[styles.metaText, { color: tc.sub }]}>{item.vehicleType}</Text>
          <Ionicons name="star" size={14} color="#FFD700" style={{ marginLeft: 8 }} />
          <Text style={[styles.metaText, { color: tc.sub }]}>{item.rating}</Text>
        </View>
        <View style={styles.badgeRow}>
          {item.isCheapest && (
            <View style={[styles.flagBadge, { backgroundColor: '#34C75920' }]}>
              <Text style={[styles.flagBadgeText, { color: '#34C759' }]}>Cheapest</Text>
            </View>
          )}
          {item.isFastest && (
            <View style={[styles.flagBadge, { backgroundColor: Colors.light.primary + '20' }]}>
              <Text style={[styles.flagBadgeText, { color: Colors.light.primary }]}>Fastest</Text>
            </View>
          )}
        </View>
        <View style={styles.priceEtaRow}>
          <Text style={[styles.price, { color: tc.text }]}>{formatCurrency(item.price)}</Text>
          <Text style={[styles.eta, { color: tc.sub }]}>{item.etaMinutes} min ETA</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.selectBtn}
        onPress={() => handleSelect(item)}
        disabled={!!selectingId}
      >
        {selectingId === item.id ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.selectBtnText}>Select</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.text }]}>Choose a Driver</Text>
        <View style={{ width: 40 }} />
      </View>

      {drivers ? (
        <FlatList
          data={drivers}
          keyExtractor={(d) => d.id}
          renderItem={renderDriver}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 20 }}
        />
      ) : (
        <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 60 }} />
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
  headerTitle: { fontSize: 17, fontWeight: '700' },
  driverCard: {
    flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center',
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  driverName: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tierBadgeText: { fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontSize: 12, textTransform: 'capitalize' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  flagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  flagBadgeText: { fontSize: 10, fontWeight: '700' },
  priceEtaRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 },
  price: { fontSize: 16, fontWeight: '800' },
  eta: { fontSize: 12 },
  selectBtn: {
    backgroundColor: Colors.light.primary, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 20, minWidth: 76, alignItems: 'center',
  },
  selectBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
