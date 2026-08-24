import Colors from '@/constants/Colors';
import { deliveryService } from '@/services/deliveryService';
import { updateProductOrderStatus } from '@/store/paymentSlice';
import { RootState } from '@/store/store';
import { Driver, VEHICLE_ICONS } from '@/types/delivery';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import MapView, { Marker, Polyline } from '@/components/maps/MapKit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const TRACKING_DURATION_MS = 12000;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function DeliveryTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const driverId = params.driverId as string;

  const order = useSelector((state: RootState) => state.payment.productOrders.find(o => o.id === orderId));
  const coords = useMemo(() => (order ? deliveryService.getCoordinates(order) : null), [order?.id]);

  const [driver, setDriver] = useState<Driver | null>(null);
  const [markerPos, setMarkerPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const panelHeight = useRef(new Animated.Value(0)).current;
  const deliveryCode = useState(() => String(Math.floor(1000 + Math.random() * 9000)))[0];

  const tc = {
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
  };

  useEffect(() => {
    if (!order) return;
    deliveryService.findDrivers(order).then((drivers) => {
      const found = drivers.find(d => d.id === driverId) || drivers[0];
      setDriver(found);
      setSecondsRemaining(found.etaMinutes * 60);
    });
  }, [order?.id, driverId]);

  useEffect(() => {
    if (!coords || !driver) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / TRACKING_DURATION_MS, 1);

      setMarkerPos({
        latitude: lerp(coords.seller.latitude, coords.buyer.latitude, t),
        longitude: lerp(coords.seller.longitude, coords.buyer.longitude, t),
      });
      setSecondsRemaining(Math.round(driver.etaMinutes * 60 * (1 - t)));

      if (t >= 1) {
        clearInterval(interval);
        if (order) {
          dispatch(updateProductOrderStatus({ orderId: order.id, orderStatus: 'delivered' }));
        }
        router.replace(`/delivery/rate/${orderId}?driverId=${driver.id}` as any);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [coords, driver?.id]);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.timing(panelHeight, { toValue: next ? 1 : 0, duration: 250, useNativeDriver: false }).start();
  };

  if (!order || !coords) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: tc.text }}>Order not found</Text>
      </View>
    );
  }

  const midpoint = {
    latitude: (coords.seller.latitude + coords.buyer.latitude) / 2,
    longitude: (coords.seller.longitude + coords.buyer.longitude) / 2,
    latitudeDelta: Math.abs(coords.seller.latitude - coords.buyer.latitude) * 3 + 0.03,
    longitudeDelta: Math.abs(coords.seller.longitude - coords.buyer.longitude) * 3 + 0.03,
  };

  const mm = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
  const ss = String(secondsRemaining % 60).padStart(2, '0');

  const extraHeight = panelHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 84] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <MapView style={StyleSheet.absoluteFill} initialRegion={midpoint}>
        <Marker coordinate={coords.seller} pinColor="#FFA000" />
        <Marker coordinate={coords.buyer} pinColor={Colors.light.primary} />
        <Polyline coordinates={[coords.seller, coords.buyer]} strokeColor={Colors.light.primary} strokeWidth={4} />
        {markerPos && (
          <Marker coordinate={markerPos} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.driverMarker}>
              <Ionicons name={(driver ? VEHICLE_ICONS[driver.vehicleType] : 'bicycle') as any} size={16} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { top: insets.top + 12 }]}>
        <Ionicons name="chevron-down" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={[styles.etaPill, { top: insets.top + 12 }]}>
        <Ionicons name="time" size={14} color="#fff" />
        <Text style={styles.etaPillText}>{mm}:{ss} away</Text>
      </View>

      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient
          colors={isDark ? ['rgba(20,20,20,0.55)', 'rgba(20,20,20,0.92)'] : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.92)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.codeRow}>
          <View>
            <Text style={[styles.codeLabel, { color: tc.sub }]}>Delivery Code</Text>
            <Text style={[styles.codeValue, { color: tc.text }]}>{deliveryCode}</Text>
          </View>
          <Ionicons name="shield-checkmark" size={28} color={Colors.light.primary} />
        </View>

        <TouchableOpacity style={styles.driverRow} onPress={toggleExpanded} activeOpacity={0.8}>
          {driver && <Image source={{ uri: driver.avatar }} style={styles.driverAvatar} />}
          <View style={{ flex: 1 }}>
            <Text style={[styles.driverName, { color: tc.text }]}>{driver?.name ?? 'Assigning driver...'}</Text>
            <Text style={[styles.driverSub, { color: tc.sub }]}>On the way to you</Text>
          </View>
          <Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={20} color={tc.sub} />
        </TouchableOpacity>

        <Animated.View style={{ height: extraHeight, overflow: 'hidden' }}>
          <View style={styles.expandedRow}>
            <View style={styles.expandedInfo}>
              <Ionicons name={(driver ? VEHICLE_ICONS[driver.vehicleType] : 'bicycle') as any} size={16} color={tc.sub} />
              <Text style={[styles.expandedText, { color: tc.sub }]}>{driver?.vehicleType}</Text>
              <Ionicons name="star" size={16} color="#FFD700" style={{ marginLeft: 12 }} />
              <Text style={[styles.expandedText, { color: tc.sub }]}>{driver?.rating}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  closeBtn: {
    position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  etaPill: {
    position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24,
  },
  etaPillText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  driverMarker: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.light.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, overflow: 'hidden',
  },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  codeLabel: { fontSize: 12 },
  codeValue: { fontSize: 22, fontWeight: '800', letterSpacing: 4 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: { width: 44, height: 44, borderRadius: 22 },
  driverName: { fontSize: 15, fontWeight: '700' },
  driverSub: { fontSize: 12, marginTop: 2 },
  expandedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 16, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#8E8E9340',
  },
  expandedInfo: { flexDirection: 'row', alignItems: 'center' },
  expandedText: { fontSize: 13, marginLeft: 4, textTransform: 'capitalize' },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.light.primary,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18,
  },
  callBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
