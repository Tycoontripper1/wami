import Colors from '@/constants/Colors';
import {
    ApiBooking,
    ApiMilestone,
    getBookingById,
    releaseMilestone,
} from '@/services/api/bookingsService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_STEPS: { status: string; label: string }[] = [
  { status: 'pending', label: 'Booking Requested' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'completed', label: 'Completed' },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  in_progress: 2,
  dispatched: 2,
  completed: 3,
  cancelled: -1,
};

export default function ServiceTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [releasingId, setReleasingId] = useState<string | number | null>(null);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
    input: isDark ? '#2C2C2E' : '#F3F4F6',
  };

  const load = useCallback(async () => {
    if (!bookingId) return;
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await getBookingById(bookingId);
      setBooking(res.data);
    } catch (error) {
      console.error('Failed to load booking:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReleaseMilestone = (milestone: ApiMilestone) => {
    Alert.alert(
      'Release Milestone',
      `Release ${milestone.title} (₦${Number(milestone.amount).toLocaleString()}) to the creative?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release',
          onPress: async () => {
            setReleasingId(milestone.id);
            try {
              await releaseMilestone(bookingId, milestone.id);
              await load();
            } catch (error) {
              console.error('Failed to release milestone:', error);
              Alert.alert("Couldn't Release", 'Something went wrong while releasing this milestone. Please try again.');
            } finally {
              setReleasingId(null);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.light.primary} />
      </View>
    );
  }

  if (loadError || !booking) {
    return (
      <View style={[styles.container, { backgroundColor: tc.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="search" size={64} color={tc.sub} />
        <Text style={[styles.emptyText, { color: tc.text }]}>
          {loadError ? "Couldn't load this booking" : 'Booking not found'}
        </Text>
        <TouchableOpacity onPress={() => (loadError ? load() : router.back())} style={styles.backBtnCentered}>
          <Text style={styles.backBtnText}>{loadError ? 'Try Again' : 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatusIndex = STATUS_INDEX[booking.status] ?? 0;
  const isCancelled = booking.status === 'cancelled';
  const milestones = booking.milestones ?? [];

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: tc.text }]}>Booking Tracking</Text>
          <Text style={[styles.headerSub, { color: tc.sub }]}>{booking.project_title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>

        {/* Booking Info */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <Text style={[styles.cardLabel, { color: tc.sub }]}>Booking Details</Text>
          <Text style={[styles.serviceTitle, { color: tc.text }]}>{booking.project_title}</Text>
          <Text style={[styles.servicePrice, { color: Colors.light.primary }]}>
            ₦{Number(booking.total_amount).toLocaleString()} {booking.currency}
          </Text>
          {!!booking.project_details && (
            <Text style={[styles.projectDetails, { color: tc.sub }]}>{booking.project_details}</Text>
          )}
          <View style={[styles.divider, { backgroundColor: tc.border, marginVertical: 12 }]} />
          <View style={styles.escrowRow}>
            <Ionicons name="calendar" size={16} color={tc.sub} />
            <Text style={[styles.escrowText, { color: tc.sub }]}>
              {booking.start_date}{booking.end_date && booking.end_date !== booking.start_date ? ` – ${booking.end_date}` : ''}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        {!isCancelled ? (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.cardLabel, { color: tc.sub, marginBottom: 16 }]}>Status</Text>
            {STATUS_STEPS.map((step, index) => {
              const isLast = index === STATUS_STEPS.length - 1;
              const completed = index <= currentStatusIndex;
              return (
                <View key={step.status} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineIcon, { backgroundColor: completed ? Colors.light.primary : tc.input }]}>
                      <Ionicons name={completed ? 'checkmark' : 'ellipse'} size={14} color={completed ? '#fff' : tc.sub} />
                    </View>
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: completed ? Colors.light.primary : tc.border }]} />}
                  </View>
                  <View style={[styles.timelineContent, !isLast && { paddingBottom: 24 }]}>
                    <Text style={[styles.timelineLabel, { color: completed ? tc.text : tc.sub }]}>{step.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.infoBanner, { backgroundColor: '#FF3B3015', borderColor: '#FF3B30' }]}>
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
            <Text style={[styles.infoText, { color: tc.text }]}>This booking was cancelled.</Text>
          </View>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.cardLabel, { color: tc.sub, marginBottom: 12 }]}>Milestones</Text>
            {milestones.map((m) => {
              const released = m.status === 'released';
              return (
                <View key={m.id} style={[styles.milestoneRow, { borderColor: tc.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.milestoneTitle, { color: tc.text }]}>{m.title}</Text>
                    <Text style={[styles.milestoneAmount, { color: tc.sub }]}>
                      ₦{Number(m.amount).toLocaleString()} · due {m.due_date}
                    </Text>
                  </View>
                  {released ? (
                    <View style={styles.releasedPill}>
                      <Text style={styles.releasedPillText}>Released</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.releaseBtn}
                      onPress={() => handleReleaseMilestone(m)}
                      disabled={releasingId === m.id}
                    >
                      {releasingId === m.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.releaseBtnText}>Release</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {booking.status === 'pending' && (
          <View style={[styles.infoBanner, { backgroundColor: Colors.light.primary + '15', borderColor: Colors.light.primary }]}>
            <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
            <Text style={[styles.infoText, { color: tc.text }]}>
              Waiting for the creative to confirm this booking.
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
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  serviceTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  servicePrice: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  projectDetails: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  divider: { height: 1 },
  escrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  escrowText: { fontSize: 13 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center' },
  timelineIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 15, fontWeight: '700' },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, gap: 10 },
  milestoneTitle: { fontSize: 14, fontWeight: '600' },
  milestoneAmount: { fontSize: 12, marginTop: 2 },
  releaseBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  releaseBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  releasedPill: { backgroundColor: '#4CD96420', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  releasedPillText: { color: '#4CD964', fontSize: 12, fontWeight: '700' },
  infoBanner: {
    flexDirection: 'row', gap: 12, padding: 16,
    borderRadius: 16, borderWidth: 1, alignItems: 'flex-start',
  },
  infoText: { fontSize: 14, flex: 1, lineHeight: 20 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 24, textAlign: 'center' },
  backBtnCentered: {
    backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30,
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
