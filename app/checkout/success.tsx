import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckoutSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const trackingNumber = params.trackingNumber as string;

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
  };

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 100 }),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        {/* Animated check */}
        <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
          <Ionicons name="checkmark-circle" size={100} color={Colors.light.primary} />
        </Animated.View>

        <Animated.View style={{ opacity, transform: [{ translateY: slideUp }], alignItems: 'center' }}>
          <Text style={[styles.title, { color: tc.text }]}>Done!</Text>
          <Text style={[styles.subtitle, { color: tc.sub }]}>
            Your order has been successfully placed
          </Text>

          {/* Tracking number card */}
          <View style={[styles.trackingCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.trackingLabel, { color: tc.sub }]}>Tracking Number</Text>
            <Text style={[styles.trackingNumber, { color: tc.text }]}>{trackingNumber}</Text>
          </View>

          {/* Track order button */}
          <View style={styles.actions}>
            <Animated.View>
              <Text
                style={styles.trackBtn}
                onPress={() => router.replace(`/order-tracking/${orderId}`)}
              >
                Track My Order
              </Text>
            </Animated.View>

            <Text
              style={[styles.continueBtn, { color: tc.sub }]}
              onPress={() => router.replace('/(tabs)')}
            >
              Continue Shopping
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { marginBottom: 24 },
  title: { fontSize: 36, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  trackingCard: {
    width: '100%', padding: 20, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', marginBottom: 32, gap: 6,
  },
  trackingLabel: { fontSize: 13 },
  trackingNumber: { fontSize: 18, fontWeight: '700', letterSpacing: 1.5 },
  actions: { width: '100%', gap: 12 },
  trackBtn: {
    backgroundColor: Colors.light.primary, color: '#fff', fontSize: 17, fontWeight: '700',
    textAlign: 'center', paddingVertical: 18, borderRadius: 30, overflow: 'hidden',
  },
  continueBtn: { fontSize: 16, fontWeight: '600', textAlign: 'center', paddingVertical: 12 },
});
