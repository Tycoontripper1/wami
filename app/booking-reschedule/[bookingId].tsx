import Colors from '@/constants/Colors';
import { ApiBooking, getBookingById, rescheduleBooking } from '@/services/api/bookingsService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      full: date.toISOString().split('T')[0],
    });
  }
  return dates;
};

export default function BookingRescheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId: string }>();
  const bookingId = params.bookingId;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dates = useMemo(() => generateDates(), []);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
  };

  useEffect(() => {
    if (!bookingId) return;
    getBookingById(bookingId)
      .then((res) => setBooking(res.data))
      .catch((error) => console.error('Failed to load booking:', error))
      .finally(() => setIsLoading(false));
  }, [bookingId]);

  const handleConfirm = async () => {
    if (!bookingId || !selectedDate) return;
    setIsSubmitting(true);
    try {
      await rescheduleBooking(bookingId, { start_date: selectedDate, end_date: selectedDate });
      Alert.alert('Booking Rescheduled', `Your booking has been moved to ${selectedDate}${selectedTime ? ` at ${selectedTime}` : ''}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Failed to reschedule booking:', error);
      Alert.alert("Couldn't Reschedule", error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.text }]}>Reschedule</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
          {booking && (
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <Text style={[styles.cardLabel, { color: tc.sub }]}>Booking</Text>
              <Text style={[styles.projectTitle, { color: tc.text }]}>{booking.project_title}</Text>
              <Text style={[styles.currentDate, { color: tc.sub }]}>
                Currently: {booking.start_date}{booking.end_date && booking.end_date !== booking.start_date ? ` – ${booking.end_date}` : ''}
              </Text>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: tc.text }]}>Select New Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {dates.map((d) => {
                const active = selectedDate === d.full;
                return (
                  <TouchableOpacity
                    key={d.full}
                    style={[
                      styles.dateCard,
                      { backgroundColor: active ? Colors.light.primary : tc.card, borderColor: active ? Colors.light.primary : tc.border },
                    ]}
                    onPress={() => setSelectedDate(d.full)}
                  >
                    <Text style={[styles.dateDay, { color: active ? '#fff' : tc.sub }]}>{d.day}</Text>
                    <Text style={[styles.dateNum, { color: active ? '#fff' : tc.text }]}>{d.date}</Text>
                    <Text style={[styles.dateMonth, { color: active ? '#fff' : tc.sub }]}>{d.month}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Text style={[styles.sectionTitle, { color: tc.text }]}>Select New Time</Text>
          <View style={styles.timesGrid}>
            {TIME_SLOTS.map((time) => {
              const active = selectedTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeCard, { backgroundColor: active ? Colors.light.primary : tc.card, borderColor: active ? Colors.light.primary : tc.border }]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={{ color: active ? '#fff' : tc.text, fontSize: 14, fontWeight: '600' }}>{time}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      <View style={[styles.footer, { backgroundColor: tc.card, borderTopColor: tc.border, paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, (!selectedDate || isSubmitting) && { opacity: 0.5 }]}
          onPress={handleConfirm}
          disabled={!selectedDate || isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm New Date</Text>}
        </TouchableOpacity>
      </View>
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  projectTitle: { fontSize: 17, fontWeight: '700', marginTop: 6 },
  currentDate: { fontSize: 13, marginTop: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  dateCard: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, minWidth: 64, borderWidth: 1 },
  dateDay: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  dateNum: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  dateMonth: { fontSize: 11 },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeCard: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  footer: { padding: 16, borderTopWidth: 1 },
  confirmBtn: { backgroundColor: Colors.light.primary, borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
