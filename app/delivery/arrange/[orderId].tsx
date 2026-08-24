import { Brand } from '@/constants/Brand';
import Colors from '@/constants/Colors';
import { deliveryService } from '@/services/deliveryService';
import { RootState } from '@/store/store';
import { DeliveryEstimate } from '@/types/delivery';
import { formatCurrency } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import MapView, { Marker } from '@/components/maps/MapKit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const { height } = Dimensions.get('window');

export default function ArrangeDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const order = useSelector((state: RootState) =>
    state.payment.productOrders.find(o => o.id === orderId)
  );

  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
  };

  const coords = useMemo(() => (order ? deliveryService.getCoordinates(order) : null), [order?.id]);

  useEffect(() => {
    if (!order) return;
    deliveryService.estimatePriceRange(order).then(setEstimate);
  }, [order?.id]);

  if (!order || !coords) {
    return (
      <View style={[styles.container, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="search" size={64} color={tc.sub} />
        <Text style={[styles.emptyText, { color: tc.text }]}>Order not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCentered}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const midpoint = {
    latitude: (coords.seller.latitude + coords.buyer.latitude) / 2,
    longitude: (coords.seller.longitude + coords.buyer.longitude) / 2,
    latitudeDelta: Math.abs(coords.seller.latitude - coords.buyer.latitude) * 3 + 0.03,
    longitudeDelta: Math.abs(coords.seller.longitude - coords.buyer.longitude) * 3 + 0.03,
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.text }]}>Arrange Delivery</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={styles.mapWrap}>
          <MapView style={StyleSheet.absoluteFill} initialRegion={midpoint} pointerEvents="none">
            <Marker coordinate={coords.seller} title={coords.seller.label} description="Pickup" pinColor={Brand.amber} />
            <Marker coordinate={coords.buyer} title={coords.buyer.label} description="Drop-off" pinColor={Colors.light.primary} />
          </MapView>
        </View>

        <View style={{ padding: 16, gap: 16 }}>
          {/* Order summary */}
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.cardLabel, { color: tc.sub }]}>Order Summary</Text>
            <Text style={[styles.orderName, { color: tc.text }]}>{order.productName}</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryText, { color: tc.sub }]}>Tracking</Text>
              <Text style={[styles.summaryValue, { color: tc.text }]}>{order.trackingNumber}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryText, { color: tc.sub }]}>Order Total</Text>
              <Text style={[styles.summaryValue, { color: tc.text }]}>{formatCurrency(order.total)}</Text>
            </View>
          </View>

          {/* Address confirmation */}
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.cardLabel, { color: tc.sub }]}>Route</Text>
            <View style={styles.routeRow}>
              <View style={[styles.pinDot, { backgroundColor: Brand.amber }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.routeLabel, { color: tc.sub }]}>Pickup from seller</Text>
                <Text style={[styles.routeValue, { color: tc.text }]}>{coords.seller.label}</Text>
              </View>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <View style={[styles.pinDot, { backgroundColor: Colors.light.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.routeLabel, { color: tc.sub }]}>Deliver to</Text>
                <Text style={[styles.routeValue, { color: tc.text }]}>
                  {order.shippingAddress.address}, {order.shippingAddress.city}
                </Text>
              </View>
            </View>
          </View>

          {/* Price estimate */}
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.cardLabel, { color: tc.sub }]}>Estimated Delivery Price</Text>
            {estimate ? (
              <Text style={[styles.priceRange, { color: tc.text }]}>
                {formatCurrency(estimate.low)} – {formatCurrency(estimate.high)}
              </Text>
            ) : (
              <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
            )}
          </View>

          <TouchableOpacity
            style={styles.findDriversBtn}
            onPress={() => router.push(`/delivery/waiting/${order.id}` as any)}
          >
            <Ionicons name="search" size={18} color="#fff" />
            <Text style={styles.findDriversBtnText}>Find Drivers</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  mapWrap: { height: height * 0.32, width: '100%' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  cardLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  orderName: { fontSize: 17, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryText: { fontSize: 13 },
  summaryValue: { fontSize: 13, fontWeight: '600' },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pinDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  routeLabel: { fontSize: 12 },
  routeValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  routeConnector: { width: 1, height: 16, backgroundColor: '#8E8E9340', marginLeft: 5.5 },
  priceRange: { fontSize: 20, fontWeight: '800' },
  findDriversBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.light.primary, borderRadius: 30, paddingVertical: 16,
  },
  findDriversBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 24 },
  backBtnCentered: {
    backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30,
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
