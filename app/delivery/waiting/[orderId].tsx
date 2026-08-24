import Colors from '@/constants/Colors';
import { deliveryService } from '@/services/deliveryService';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StatusBar, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

function ExpandingCircle({ delayMs }: { delayMs: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] });
  const opacity = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0.2, 0] });

  return (
    <Animated.View
      style={[styles.circle, { transform: [{ scale }], opacity }]}
    />
  );
}

export default function WaitingForDriversScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const order = useSelector((state: RootState) => state.payment.productOrders.find(o => o.id === orderId));
  const [driverCount, setDriverCount] = useState(0);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
  };

  useEffect(() => {
    if (!order) return;

    const countInterval = setInterval(() => {
      setDriverCount(prev => (prev < 4 ? prev + 1 : prev));
    }, 500);

    deliveryService.findDrivers(order).then(() => {
      clearInterval(countInterval);
      router.replace(`/delivery/compare/${order.id}` as any);
    });

    return () => clearInterval(countInterval);
  }, [order?.id]);

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: tc.text }}>Order not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.light.primary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="close" size={26} color={tc.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.radarWrap}>
          <ExpandingCircle delayMs={0} />
          <ExpandingCircle delayMs={600} />
          <ExpandingCircle delayMs={1200} />
          <View style={styles.centerDot}>
            <Ionicons name="bicycle" size={22} color="#fff" />
          </View>
        </View>

        <Text style={[styles.title, { color: tc.text }]}>Finding drivers near you...</Text>
        <Text style={[styles.subtitle, { color: tc.sub }]}>{driverCount} drivers found nearby</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 10, width: 40, height: 40, justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  radarWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  circle: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.light.primary,
  },
  centerDot: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.light.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 19, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14 },
});
