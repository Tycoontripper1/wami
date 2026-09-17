import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/Colors';
import { ApiBooking, getBookingsCalendar } from '@/services/api/bookingsService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const isoDate = (d: Date) => d.toISOString().split('T')[0];

export default function BookingCalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(isoDate(today));
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const from = isoDate(new Date(year, month, 1));
      const to = isoDate(new Date(year, month + 1, 0));
      const res = await getBookingsCalendar({ from, to });
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load booking calendar:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  // date -> bookings on that date, keyed by start_date (YYYY-MM-DD)
  const bookingsByDay = useMemo(() => {
    const map = new Map<string, ApiBooking[]>();
    bookings.forEach((b) => {
      const key = (b.start_date ?? '').slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return map;
  }, [bookings]);

  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(startWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const goPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); } else { setMonth(month - 1); }
  };
  const goNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); } else { setMonth(month + 1); }
  };

  const selectedBookings = selectedDay ? bookingsByDay.get(selectedDay) ?? [] : [];

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.text }]}>Booking Calendar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}>
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goPrevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={tc.text} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: tc.text }]}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={goNextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={tc.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={[styles.weekdayLabel, { color: tc.sub }]}>{w}</Text>
            ))}
          </View>

          {isLoading ? (
            <ActivityIndicator color={Colors.light.primary} style={{ marginVertical: 24 }} />
          ) : (
            <View style={styles.grid}>
              {grid.map((day, i) => {
                if (day === null) return <View key={i} style={styles.cell} />;
                const dateKey = isoDate(new Date(year, month, day));
                const dayBookings = bookingsByDay.get(dateKey) ?? [];
                const isSelected = selectedDay === dateKey;
                const isToday = dateKey === isoDate(today);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.cell,
                      styles.dayCell,
                      isSelected && { backgroundColor: Colors.light.primary },
                      isToday && !isSelected && { borderWidth: 1.5, borderColor: Colors.light.primary },
                    ]}
                    onPress={() => setSelectedDay(dateKey)}
                  >
                    <Text style={[styles.dayNum, { color: isSelected ? '#fff' : tc.text }]}>{day}</Text>
                    {dayBookings.length > 0 && (
                      <View style={[styles.dayDot, { backgroundColor: isSelected ? '#fff' : Colors.light.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {hasError ? (
          <EmptyState icon="cloud-offline-outline" title="Couldn't load bookings" onRetry={load} />
        ) : (
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>
              {selectedDay ? new Date(selectedDay).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Select a day'}
            </Text>
            {selectedBookings.length === 0 ? (
              <Text style={{ color: tc.sub, fontSize: 13, marginTop: 8 }}>No bookings on this day</Text>
            ) : (
              <View style={{ gap: 10, marginTop: 12 }}>
                {selectedBookings.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.bookingRow, { borderColor: tc.border }]}
                    onPress={() => router.push(`/service-tracking/${b.id}` as any)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bookingTitle, { color: tc.text }]} numberOfLines={1}>{b.project_title}</Text>
                      <Text style={[styles.bookingStatus, { color: tc.sub }]}>{b.status}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={tc.sub} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 16, fontWeight: '700' },
  weekdayRow: { flexDirection: 'row', marginBottom: 8 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCell: { borderRadius: 10 },
  dayNum: { fontSize: 14, fontWeight: '600' },
  dayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  bookingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, gap: 10 },
  bookingTitle: { fontSize: 14, fontWeight: '600' },
  bookingStatus: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
});
