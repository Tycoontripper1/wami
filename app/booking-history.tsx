import Colors from '@/constants/Colors';
import { RootState } from '@/store/store';
import { formatCurrency } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
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

const STATUS_CONFIG = {
  negotiating: { label: 'Negotiating', color: '#FF9500', icon: 'chatbubbles' },
  awaiting_payment: { label: 'Awaiting Payment', color: '#FF9500', icon: 'time' },
  paid: { label: 'Paid - In Escrow', color: Colors.light.primary, icon: 'shield-checkmark' },
  in_progress: { label: 'In Progress', color: Colors.light.primary, icon: 'construct' },
  completed: { label: 'Completed', color: '#4CD964', icon: 'checkmark-circle' },
  disputed: { label: 'Disputed', color: '#FF3B30', icon: 'warning' },
  cancelled: { label: 'Cancelled', color: '#8E8E93', icon: 'close-circle' },
  pending: { label: 'Pending', color: '#FF9500', icon: 'time' },
  confirmed: { label: 'Confirmed', color: Colors.light.primary, icon: 'checkmark-circle' },
};

export default function BookingHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get bookings from both slices
  const appointmentBookings = useSelector((state: RootState) => state.bookings.items);
  const paymentBookings = useSelector((state: RootState) => state.payment.bookings);

  // Merge both types of bookings
  const allBookings = [
    ...appointmentBookings.map((b) => ({
      id: b.id,
      creativeName: b.creativeName,
      service: `Appointment on ${b.date} at ${b.time}`,
      status: b.status,
      createdAt: b.createdAt,
      creativeRole: b.creativeRole,
    })),
    ...paymentBookings.map((b) => ({
      id: b.id,
      creativeName: b.creativeName,
      service: b.service,
      status: b.status,
      createdAt: b.createdAt,
      agreedPrice: b.agreedPrice,
      currency: b.currency,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#fff',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const renderBooking = ({ item }: { item: typeof allBookings[0] }) => {
    const status = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;

    const handleRebook = () => {
      // Navigate to profile with booking intent
      router.push(`/profile/${item.id || '1'}` as any);
    };

    const handlePress = () => {
      if (item.status === 'paid' || item.status === 'in_progress' || item.status === 'completed') {
        router.push(`/service-tracking/${item.id}` as any);
      } else {
        // Just stay or show chat
      }
    };

    return (
      <View style={[styles.bookingCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
        <TouchableOpacity
          style={styles.bookingContent}
          onPress={handlePress}
        >
          <View style={[styles.creativeImage, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color={themeColors.subText} />
          </View>
          <View style={styles.bookingInfo}>
            <Text style={[styles.creativeName, { color: themeColors.text }]}>{item.creativeName}</Text>
            <Text style={[styles.service, { color: themeColors.subText }]}>{item.service}</Text>
            {'agreedPrice' in item && item.agreedPrice && (
              <Text style={[styles.price, { color: themeColors.text }]}>
                {formatCurrency(item.agreedPrice, item.currency || 'NGN')}
              </Text>
            )}
            <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
              <Ionicons name={status.icon as any} size={14} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={themeColors.subText} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        {/* Rebook Button */}
        {(item.status === 'completed' || item.status === 'cancelled') && (
          <TouchableOpacity style={styles.rebookButton} onPress={handleRebook}>
            <Ionicons name="refresh" size={16} color={Colors.light.primary} />
            <Text style={styles.rebookText}>Book Again</Text>
          </TouchableOpacity>
        )}
      </View>
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
        <View style={{ width: 32 }} />
      </View>

      {/* Bookings List */}
      {allBookings.length > 0 ? (
        <FlatList
          data={allBookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
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
  bookingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  rebookText: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
