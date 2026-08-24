import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/Colors';
import { updateProductOrderStatus } from '@/store/paymentSlice';
import { RootState } from '@/store/store';
import { buildOrderTimeline } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const STATUS_STEPS = ['packed', 'on_way_to_logistics', 'at_logistics', 'shipped', 'out_for_delivery', 'delivered'];

const STEP_ICONS: Record<string, string> = {
  packed: 'cube',
  on_way_to_logistics: 'car',
  at_logistics: 'business',
  shipped: 'airplane',
  out_for_delivery: 'bicycle',
  delivered: 'checkmark-circle',
  delivery_failed: 'close-circle',
};

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const order = useSelector((state: RootState) =>
    state.payment.productOrders.find(o => o.id === orderId)
  );

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showDeliveredOptions, setShowDeliveredOptions] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
    input: isDark ? '#2C2C2E' : '#F3F4F6',
  };

  const currentStatusIndex = order
    ? STATUS_STEPS.indexOf(order.orderStatus === 'delivery_failed' ? 'out_for_delivery' : order.orderStatus)
    : 0;

  const progressPercent = STATUS_STEPS.length > 1
    ? (currentStatusIndex / (STATUS_STEPS.length - 1)) * 100
    : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  const timeline = order?.timeline ?? buildOrderTimeline('packed');

  if (!order) {
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

  if (order.orderStatus === 'cancelled') {
    return (
      <View style={[styles.container, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <EmptyState
          icon="close-circle-outline"
          title="Order Cancelled"
          message={`Your order (${order.trackingNumber}) has been cancelled. If this wasn't you, please contact support.`}
        />
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnCentered, { alignSelf: 'center' }]}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDelivered = order.orderStatus === 'delivered';
  const isDeliveryFailed = order.orderStatus === 'delivery_failed';

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: tc.text }]}>To Receive</Text>
          <Text style={[styles.headerSub, { color: tc.sub }]}>Track Your Order</Text>
        </View>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="eye" size={22} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>

        {/* Progress Bar */}
        <View style={[styles.progressCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <View style={[styles.progressTrack, { backgroundColor: tc.input }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: isDeliveryFailed ? '#FF3B30' : Colors.light.primary,
                },
              ]}
            />
          </View>

          {/* Step dots */}
          <View style={styles.stepDots}>
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStatusIndex;
              return (
                <View key={step} style={[styles.stepDot, { backgroundColor: done ? Colors.light.primary : tc.input, borderColor: done ? Colors.light.primary : tc.border }]}>
                  {done && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Tracking Number */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <View style={styles.trackingRow}>
            <View>
              <Text style={[styles.cardLabel, { color: tc.sub }]}>Tracking Number</Text>
              <Text style={[styles.trackingNum, { color: tc.text }]}>{order.trackingNumber}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: Colors.light.primary + '20' }]}
              onPress={() => Alert.alert('Copied!', order.trackingNumber)}
            >
              <Ionicons name="copy" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
          {order.estimatedDelivery && !isDelivered && (
            <Text style={[styles.estimatedDelivery, { color: tc.sub }]}>
              Expected on {order.estimatedDelivery}
            </Text>
          )}
        </View>

        {/* Arrange Delivery / Cancel */}
        {order.orderStatus === 'packed' && (
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={styles.arrangeDeliveryBtn}
              onPress={() => router.push(`/delivery/arrange/${order.id}` as any)}
            >
              <Ionicons name="bicycle" size={18} color="#fff" />
              <Text style={styles.arrangeDeliveryBtnText}>Arrange Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
                  { text: 'No', style: 'cancel' },
                  {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => dispatch(updateProductOrderStatus({ orderId: order.id, orderStatus: 'cancelled' })),
                  },
                ])
              }
            >
              <Text style={[styles.cancelOrderText, { color: '#FF3B30' }]}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delivery Failed Banner */}
        {isDeliveryFailed && (
          <View style={[styles.failedBanner, { backgroundColor: '#FF3B30' + '15', borderColor: '#FF3B30' }]}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.failedTitle, { color: '#FF3B30' }]}>Delivery Attempt Was Not Successful</Text>
              <Text style={[styles.failedSub, { color: tc.sub }]}>
                Don't worry, we'll contact you to arrange another suitable time for delivery.
              </Text>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          {timeline.map((event, index) => {
            const isLast = index === timeline.length - 1;
            const icon = STEP_ICONS[event.status] || 'ellipse';
            return (
              <View key={event.status} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIcon,
                    { backgroundColor: event.completed ? Colors.light.primary : tc.input }
                  ]}>
                    <Ionicons name={icon as any} size={16} color={event.completed ? '#fff' : tc.sub} />
                  </View>
                  {!isLast && (
                    <View style={[styles.timelineLine, { backgroundColor: event.completed ? Colors.light.primary : tc.border }]} />
                  )}
                </View>
                <View style={[styles.timelineContent, !isLast && { paddingBottom: 24 }]}>
                  <View style={styles.timelineHeader}>
                    <Text style={[styles.timelineLabel, { color: event.completed ? tc.text : tc.sub }]}>
                      {event.label}
                    </Text>
                    {event.timestamp && (
                      <Text style={[styles.timelineTime, { color: tc.sub }]}>{formatTimestamp(event.timestamp)}</Text>
                    )}
                  </View>
                  <Text style={[styles.timelineDesc, { color: tc.sub }]}>{event.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Delivered actions */}
        {isDelivered && (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border, gap: 10 }]}>
            <Text style={[styles.cardLabel, { color: tc.sub }]}>Order Delivered — What's next?</Text>
            <TouchableOpacity style={styles.deliveredOption} onPress={() => Alert.alert('Refund requested', 'A refund request has been submitted.')}>
              <Ionicons name="refresh-circle" size={22} color={Colors.light.primary} />
              <Text style={[styles.deliveredOptionText, { color: tc.text }]}>Make a Refund</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deliveredOption} onPress={() => Alert.alert('Report Issue', 'Navigating to issue reporter...')}>
              <Ionicons name="warning" size={22} color="#FF9500" />
              <Text style={[styles.deliveredOptionText, { color: tc.text }]}>Report an Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deliveredOption} onPress={() => Alert.alert('Confirmed!', 'Thank you for confirming delivery.')}>
              <Ionicons name="checkmark-circle" size={22} color="#4CD964" />
              <Text style={[styles.deliveredOptionText, { color: tc.text }]}>Confirm Receipt</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chat Now for failed delivery */}
        {isDeliveryFailed && (
          <TouchableOpacity style={styles.chatBtn}>
            <Ionicons name="chatbubble" size={20} color="#fff" />
            <Text style={styles.chatBtnText}>Chat Now</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: insets.bottom + 20 }} />
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
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  progressCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  stepDots: { flexDirection: 'row', justifyContent: 'space-between' },
  stepDot: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  trackingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontSize: 12, marginBottom: 4 },
  trackingNum: { fontSize: 16, fontWeight: '700', letterSpacing: 1.2 },
  copyBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  estimatedDelivery: { fontSize: 13, marginTop: 10 },
  arrangeDeliveryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.light.primary, borderRadius: 16, paddingVertical: 14,
  },
  arrangeDeliveryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelOrderText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  failedBanner: {
    flexDirection: 'row', gap: 12, padding: 16,
    borderRadius: 16, borderWidth: 1, alignItems: 'flex-start',
  },
  failedTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  failedSub: { fontSize: 13, lineHeight: 18 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center' },
  timelineIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },
  timelineContent: { flex: 1, paddingBottom: 0 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  timelineLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  timelineTime: { fontSize: 11 },
  timelineDesc: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  deliveredOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  deliveredOptionText: { fontSize: 15, fontWeight: '500' },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.light.primary, borderRadius: 30, paddingVertical: 16,
  },
  chatBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 24 },
  backBtnCentered: {
    backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30,
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
