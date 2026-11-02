import Colors from '@/constants/Colors';
import {
    ApiBooking,
    ApiMilestone,
    BookingAction,
    bookingAction,
    bookingRole,
    cancelBooking,
    getBookingById,
    normaliseStatus,
    releaseMilestone,
} from '@/services/api/bookingsService';
import { cancelBooking as cancelLocalBooking } from '@/store/bookingsSlice';
import { Ionicons } from '@/components/FlatIcon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Alert } from '@/components/AppAlert';
import { Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

const STATUS_STEPS: { status: string; label: string }[] = [
  { status: 'requested', label: 'Requested' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'paid', label: 'Paid, held by Wami' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'completed', label: 'Completed' },
];

const STATUS_INDEX: Record<string, number> = {
  requested: 0,
  accepted: 1,
  paid: 2,
  in_progress: 3,
  completed: 4,
};

// Ends that are not on the happy path, and what to tell people.
const ENDED: Record<string, string> = {
  cancelled: 'This booking was cancelled.',
  declined: 'The creative declined this request.',
  expired: 'This request ran out of time before it was answered.',
  disputed: 'A dispute is open. The money is frozen until it is settled.',
};

// The API returns ISO timestamps ("2026-11-01T00:00:00.000000Z"); show "1 Nov 2026".
const formatBookingDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
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
  const [isCancelling, setIsCancelling] = useState(false);
  const dispatch = useDispatch();
  const myId = useSelector((st: RootState) => (st.auth.user as any)?.id);
  const [acting, setActing] = useState<BookingAction | null>(null);

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

  // The server decides what is allowed; a refused move comes back as a
  // plain-language message.
  const run = async (action: BookingAction, body?: { reason?: string }) => {
    setActing(action);
    try {
      await bookingAction(bookingId, action, body);
      if (action === 'cancel') dispatch(cancelLocalBooking(String(bookingId)));
      await load();
    } catch (error: any) {
      console.error(`Booking ${action} failed:`, error);
      Alert.alert("That didn't go through", error?.message ?? 'Please try again.');
    } finally {
      setActing(null);
    }
  };

  const confirmAction = (action: BookingAction, title: string, message: string, label: string, destructive = false) =>
    Alert.alert(title, message, [
      { text: 'Not now', style: 'cancel' },
      { text: label, style: destructive ? 'destructive' : 'default', onPress: () => run(action) },
    ]);

  const handleCancelBooking = () =>
    confirmAction(
      'cancel',
      'Cancel this booking?',
      'This cannot be undone. Anything already paid is returned to the buyer.',
      'Cancel booking',
      true
    );

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

  const status = normaliseStatus(booking.status);
  const role = bookingRole(booking, myId);
  const currentStatusIndex = STATUS_INDEX[status] ?? 0;
  const endedNote = ENDED[status];
  const when = booking.scheduled_at ?? booking.start_date;
  const amount = Number(booking.total_amount ?? booking.amount ?? booking.price ?? 0);
  const busy = acting !== null;
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
            {amount > 0 ? `₦${amount.toLocaleString()}` : 'Price set by the creative'}
          </Text>
          {!!(booking.notes ?? booking.project_details) && (
            <Text style={[styles.projectDetails, { color: tc.sub }]}>{booking.notes ?? booking.project_details}</Text>
          )}
          <View style={[styles.divider, { backgroundColor: tc.border, marginVertical: 12 }]} />
          <View style={styles.escrowRow}>
            <Ionicons name="calendar" size={16} color={tc.sub} />
            <Text style={[styles.escrowText, { color: tc.sub }]}>
              {formatBookingDate(when)}{when && String(when).includes('T') ? ` · ${new Date(when).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}` : ''}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        {!endedNote ? (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.cardLabel, { color: tc.sub, marginBottom: 16 }]}>Status</Text>
            {STATUS_STEPS.map((step, index) => {
              const isLast = index === STATUS_STEPS.length - 1;
              const completed = index <= currentStatusIndex;
              return (
                <View key={step.status} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineIcon, { backgroundColor: completed ? Colors.light.primary : tc.input }]}>
                      <Ionicons name={completed ? 'checkmark' : 'ellipse'} size={14} color={completed ? '#0F1419' : tc.sub} />
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
            <Text style={[styles.infoText, { color: tc.text }]}>{endedNote}</Text>
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
                        <ActivityIndicator color="#0F1419" size="small" />
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

        {status === 'requested' && (
          <View style={[styles.infoBanner, { backgroundColor: Colors.light.primary + '15', borderColor: Colors.light.primary }]}>
            <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
            <Text style={[styles.infoText, { color: tc.text }]}>
              {role === 'creative' ? 'A buyer is waiting for your answer.' : 'Waiting for the creative to answer your request.'}
            </Text>
          </View>
        )}

        {status === 'accepted' && role === 'buyer' && (
          <View style={[styles.infoBanner, { backgroundColor: Colors.light.primary + '15', borderColor: Colors.light.primary }]}>
            <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
            <Text style={[styles.infoText, { color: tc.text }]}>
              Accepted. Once you pay, Wami holds the money until the work is done.
            </Text>
          </View>
        )}

        {status === 'requested' && role === 'creative' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1 }, busy && { opacity: 0.6 }]}
              onPress={() => run('accept')}
              disabled={busy}
            >
              {acting === 'accept' ? <ActivityIndicator color="#0F1419" /> : <Text style={styles.primaryBtnText}>Accept</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rescheduleBtn, { flex: 1, borderColor: tc.border }, busy && { opacity: 0.6 }]}
              onPress={() => confirmAction('decline', 'Decline this request?', 'The buyer will be told.', 'Decline', true)}
              disabled={busy}
            >
              <Text style={[styles.rescheduleBtnText, { color: tc.text }]}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'paid' && role === 'creative' && (
          <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.6 }]} onPress={() => run('start')} disabled={busy}>
            {acting === 'start' ? <ActivityIndicator color="#0F1419" /> : <Text style={styles.primaryBtnText}>Start the work</Text>}
          </TouchableOpacity>
        )}

        {status === 'in_progress' && role === 'creative' && (
          <TouchableOpacity
            style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
            onPress={() => confirmAction('complete', 'Mark the work done?', 'The buyer is asked to release the money.', 'Mark done')}
            disabled={busy}
          >
            {acting === 'complete' ? <ActivityIndicator color="#0F1419" /> : <Text style={styles.primaryBtnText}>Mark work done</Text>}
          </TouchableOpacity>
        )}

        {(status === 'in_progress' || status === 'completed') && role === 'buyer' && booking.money_released !== true && (
          <TouchableOpacity
            style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
            onPress={() => confirmAction('release', 'Release the money?', 'Only do this when you are happy with the work. It pays the creative.', 'Release')}
            disabled={busy}
          >
            {acting === 'release' ? <ActivityIndicator color="#0F1419" /> : <Text style={styles.primaryBtnText}>Release payment</Text>}
          </TouchableOpacity>
        )}

        {['requested', 'accepted', 'paid'].includes(status) && (
          <TouchableOpacity
            style={[styles.rescheduleBtn, { borderColor: tc.border }]}
            onPress={() => router.push(`/booking-reschedule/${booking.id}` as any)}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.light.primary} />
            <Text style={[styles.rescheduleBtnText, { color: Colors.light.primary }]}>Change the date</Text>
          </TouchableOpacity>
        )}

        {['paid', 'in_progress', 'completed'].includes(status) && (
          <TouchableOpacity
            style={[styles.rescheduleBtn, { borderColor: tc.border }]}
            onPress={() => confirmAction('dispute', 'Raise a dispute?', 'This freezes the money while we look into it.', 'Raise dispute', true)}
            disabled={busy}
          >
            <Ionicons name="flag" size={18} color={tc.sub} />
            <Text style={[styles.rescheduleBtnText, { color: tc.sub }]}>Something is wrong</Text>
          </TouchableOpacity>
        )}

        {['requested', 'accepted', 'paid'].includes(status) && (
          <TouchableOpacity
            style={[styles.rescheduleBtn, { borderColor: '#FF3B30' }, busy && { opacity: 0.6 }]}
            onPress={handleCancelBooking}
            disabled={busy}
          >
            {acting === 'cancel' ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <Ionicons name="close-circle-outline" size={18} color="#FF3B30" />
            )}
            <Text style={[styles.rescheduleBtnText, { color: '#FF3B30' }]}>
              {acting === 'cancel' ? 'Cancelling…' : 'Cancel booking'}
            </Text>
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
  releaseBtnText: { color: '#0F1419', fontSize: 13, fontWeight: '700' },
  releasedPill: { backgroundColor: '#4CD96420', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  releasedPillText: { color: '#4CD964', fontSize: 12, fontWeight: '700' },
  infoBanner: {
    flexDirection: 'row', gap: 12, padding: 16,
    borderRadius: 16, borderWidth: 1, alignItems: 'flex-start',
  },
  infoText: { fontSize: 14, flex: 1, lineHeight: 20 },
  rescheduleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 13,
  },
  rescheduleBtnText: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 24, textAlign: 'center' },
  backBtnCentered: {
    backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 13, borderRadius: 12,
  },
  primaryBtn: { height: 48, borderRadius: 12, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#0F1419', fontSize: 16, fontWeight: '700' },
  backBtnText: { color: '#0F1419', fontSize: 16, fontWeight: '700' },
});
