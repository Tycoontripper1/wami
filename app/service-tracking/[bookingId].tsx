import Colors from '@/constants/Colors';
import { RootState } from '@/store/store';
import { releaseEscrow } from '@/store/paymentSlice';
import { formatCurrency } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useEffect } from 'react';
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
import { useSelector, useDispatch } from 'react-redux';

const SERVICE_STEPS = [
  { status: 'paid', label: 'Payment Secured', description: '70% released to creative, 30% held in Wami Escrow.' },
  { status: 'scheduled', label: 'Appointment Scheduled', description: 'Date and time have been confirmed for the service.' },
  { status: 'in_progress', label: 'Service In Progress', description: 'The creative is currently delivering the service.' },
  { status: 'completed', label: 'Service Completed', description: 'Service delivered. Funds awaiting your confirmation.' },
  { status: 'released', label: 'Funds Released', description: 'All funds have been released to the creative.' },
];

export default function ServiceTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const booking = useSelector((state: RootState) =>
    state.payment.bookings.find(b => b.id === bookingId)
  );

  const progressAnim = useRef(new Animated.Value(0)).current;

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
    input: isDark ? '#2C2C2E' : '#F3F4F6',
  };

  const getStatusIndex = (status: string) => {
    switch (status) {
      case 'paid': return 0;
      case 'in_progress': return 2;
      case 'completed': return 3;
      case 'fully_paid': return 4;
      default: return 0;
    }
  };

  const currentStatusIndex = booking ? getStatusIndex(booking.status) : 0;
  const progressPercent = (currentStatusIndex / (SERVICE_STEPS.length - 1)) * 100;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  if (!booking) {
    return (
      <View style={[styles.container, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="search" size={64} color={tc.sub} />
        <Text style={[styles.emptyText, { color: tc.text }]}>Booking not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCentered}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleConfirmCompletion = () => {
    Alert.alert(
      'Confirm Completion',
      'By confirming, the remaining 30% held in escrow will be released to the creative. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm & Release', 
          onPress: () => {
            const paymentId = booking.payment?.id;
            if (paymentId) {
              dispatch(releaseEscrow({ paymentId }));
              Alert.alert('Success', 'Funds released! Thank you for using Wami Escrow.');
            }
          } 
        }
      ]
    );
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
          <Text style={[styles.headerTitle, { color: tc.text }]}>Service Tracking</Text>
          <Text style={[styles.headerSub, { color: tc.sub }]}>{booking.creativeName}</Text>
        </View>
        <View style={{ width: 40 }} />
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
                  backgroundColor: Colors.light.primary,
                },
              ]}
            />
          </View>
          <View style={styles.stepDots}>
            {SERVICE_STEPS.map((_, i) => {
              const done = i <= currentStatusIndex;
              return (
                <View key={i} style={[styles.stepDot, { backgroundColor: done ? Colors.light.primary : tc.input, borderColor: done ? Colors.light.primary : tc.border }]}>
                  {done && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Service Info */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <Text style={[styles.cardLabel, { color: tc.sub }]}>Service Details</Text>
          <Text style={[styles.serviceTitle, { color: tc.text }]}>{booking.service}</Text>
          <Text style={[styles.servicePrice, { color: Colors.light.primary }]}>
            {formatCurrency(booking.agreedPrice, booking.currency)}
          </Text>
          
          <View style={[styles.divider, { backgroundColor: tc.border, marginVertical: 12 }]} />
          
          <View style={styles.escrowDetails}>
            <View style={styles.escrowRow}>
              <Ionicons name="flash" size={16} color="#4CD964" />
              <Text style={[styles.escrowText, { color: tc.sub }]}>70% Instant Payment: <Text style={{ color: tc.text, fontWeight: '600' }}>{formatCurrency(booking.agreedPrice * 0.7)}</Text></Text>
            </View>
            <View style={styles.escrowRow}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.light.primary} />
              <Text style={[styles.escrowText, { color: tc.sub }]}>30% Escrow Hold: <Text style={{ color: tc.text, fontWeight: '600' }}>{formatCurrency(booking.agreedPrice * 0.3)}</Text></Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <Text style={[styles.cardLabel, { color: tc.sub, marginBottom: 16 }]}>Service Progress</Text>
          {SERVICE_STEPS.map((step, index) => {
            const isLast = index === SERVICE_STEPS.length - 1;
            const completed = index <= currentStatusIndex;
            return (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineIcon, { backgroundColor: completed ? Colors.light.primary : tc.input }]}>
                    <Ionicons name={completed ? "checkmark" : "ellipse"} size={14} color={completed ? "#fff" : tc.sub} />
                  </View>
                  {!isLast && <View style={[styles.timelineLine, { backgroundColor: completed ? Colors.light.primary : tc.border }]} />}
                </View>
                <View style={[styles.timelineContent, !isLast && { paddingBottom: 24 }]}>
                  <Text style={[styles.timelineLabel, { color: completed ? tc.text : tc.sub }]}>{step.label}</Text>
                  <Text style={[styles.timelineDesc, { color: tc.sub }]}>{step.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* File Delivery Area */}
        {booking.status === 'completed' && (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.cardLabel, { color: tc.sub, marginBottom: 12 }]}>Delivered Files</Text>
            {['Final_Edit_01.jpg', 'Final_Edit_02.jpg', 'Project_Files.zip'].map((file) => (
              <TouchableOpacity key={file} style={[styles.fileRow, { borderColor: tc.border }]}>
                <Ionicons name="document-attach-outline" size={20} color={Colors.light.primary} />
                <Text style={[styles.fileName, { color: tc.text }]} numberOfLines={1}>{file}</Text>
                <Ionicons name="download-outline" size={20} color={tc.sub} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Action Button */}
        {booking.status === 'completed' && (
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmCompletion}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.confirmBtnText}>Confirm Delivery & Release Funds</Text>
          </TouchableOpacity>
        )}

        {booking.status === 'paid' && (
          <View style={[styles.infoBanner, { backgroundColor: Colors.light.primary + '15', borderColor: Colors.light.primary }]}>
            <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
            <Text style={[styles.infoText, { color: tc.text }]}>
              The creative is currently preparing for your service. We'll notify you once it starts!
            </Text>
          </View>
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
  stepDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -14 },
  stepDot: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  serviceTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  servicePrice: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  divider: { height: 1 },
  escrowDetails: { gap: 8 },
  escrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  escrowText: { fontSize: 13 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center' },
  timelineIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 15, fontWeight: '700' },
  timelineDesc: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#4CD964', borderRadius: 30, paddingVertical: 18,
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoBanner: {
    flexDirection: 'row', gap: 12, padding: 16,
    borderRadius: 16, borderWidth: 1, alignItems: 'flex-start',
  },
  infoText: { fontSize: 14, flex: 1, lineHeight: 20 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, marginTop: 0 },
  fileName: { flex: 1, fontSize: 14, fontWeight: '500' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 24 },
  backBtnCentered: {
    backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30,
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
