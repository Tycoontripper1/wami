import Colors from '@/constants/Colors';
import { ApiBooking, getBookings } from '@/services/api/bookingsService';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: '#FF9500', icon: 'time' },
  confirmed: { label: 'Confirmed', color: Colors.light.primary, icon: 'checkmark-circle' },
  in_progress: { label: 'In Progress', color: Colors.light.primary, icon: 'construct' },
  dispatched: { label: 'In Progress', color: Colors.light.primary, icon: 'construct' },
  completed: { label: 'Completed', color: '#4CD964', icon: 'checkmark-circle' },
  cancelled: { label: 'Cancelled', color: '#8E8E93', icon: 'close-circle' },
};

export default function BookingHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Local optimistic cache from the booking flow (components/BookingModal.tsx)
  // — used as an instant fallback if the real fetch below fails or is slow.
  const localBookings = useSelector((state: RootState) => state.bookings.items);

  const [apiBookings, setApiBookings] = useState<ApiBooking[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await getBookings({ page: 1 });
      const data: any = res.data;
      setApiBookings(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real data when we have it; otherwise fall back to whatever was created
  // locally this session so the screen isn't empty while offline.
  const bookings = apiBookings ?? localBookings.map((b) => ({
    id: b.id,
    offering_id: b.creativeId,
    project_title: b.service ?? `Booking with ${b.creativeName}`,
    project_details: b.notes ?? '',
    start_date: b.date,
    end_date: b.date,
    total_amount: 0,
    currency: 'NGN',
    status: b.status,
    created_at: b.createdAt,
  } as ApiBooking));

  const localNameById = new Map(localBookings.map((b) => [b.id, b.creativeName]));

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#fff',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const renderBooking = ({ item }: { item: ApiBooking }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const creativeName = localNameById.get(String(item.id)) ?? 'Booking';

    return (
      <TouchableOpacity
        style={[styles.bookingCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}
        onPress={() => router.push(`/service-tracking/${item.id}` as any)}
      >
        <View style={[styles.creativeImage, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={24} color={themeColors.subText} />
        </View>
        <View style={styles.bookingInfo}>
          <Text style={[styles.creativeName, { color: themeColors.text }]}>{creativeName}</Text>
          <Text style={[styles.service, { color: themeColors.subText }]} numberOfLines={1}>{item.project_title}</Text>
          {item.total_amount > 0 && (
            <Text style={[styles.price, { color: themeColors.text }]}>
              ₦{Number(item.total_amount).toLocaleString()} {item.currency}
            </Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
            <Ionicons name={status.icon as any} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={themeColors.subText} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={80} color={themeColors.subText} />
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No bookings yet</Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.subText }]}>
        Your booking history will appear here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Booking History</Text>
        <TouchableOpacity onPress={() => router.push('/booking-calendar' as any)} style={styles.backButton}>
          <Ionicons name="calendar-outline" size={22} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      {isLoading && bookings.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      ) : loadError && bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={80} color={themeColors.subText} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Couldn't load bookings</Text>
          <TouchableOpacity onPress={load} style={{ marginTop: 16 }}>
            <Text style={{ color: Colors.light.primary, fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : bookings.length > 0 ? (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  creativeImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  bookingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  creativeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  service: {
    fontSize: 13,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
