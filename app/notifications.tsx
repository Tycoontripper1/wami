import EmptyState from '@/components/EmptyState';
import { SkeletonRow } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import {
    ApiNotification,
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from '@/services/api/notificationsService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
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
      const res = await getNotifications({ page: 1 });
      const data: any = res.data;
      setNotifications(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isRead = (n: ApiNotification) => n.is_read ?? Boolean(n.read_at);

  const handlePressNotification = async (n: ApiNotification) => {
    if (isRead(n)) return;
    setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item)));
    try {
      await markNotificationRead(n.id);
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  };

  const renderItem = ({ item }: { item: ApiNotification }) => {
    const read = isRead(item);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border, opacity: read ? 0.65 : 1 }]}
        onPress={() => handlePressNotification(item)}
        activeOpacity={0.8}
      >
        {!read && <View style={styles.unreadDot} />}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: tc.text }]} numberOfLines={2}>
            {item.title ?? item.type ?? 'Notification'}
          </Text>
          {(item.body ?? item.message) && (
            <Text style={[styles.body, { color: tc.sub }]} numberOfLines={3}>
              {item.body ?? item.message}
            </Text>
          )}
          {item.created_at && (
            <Text style={[styles.date, { color: tc.sub }]}>
              {new Date(item.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.text }]}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.backBtn}>
          <Text style={{ color: Colors.light.primary, fontWeight: '600', fontSize: 13 }}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ padding: 16, gap: 14 }}>
          {[...Array(6)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : hasError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load notifications"
          message="Something went wrong. Please check your connection and try again."
          onRetry={load}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<EmptyState icon="notifications-outline" title="No notifications yet" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { minWidth: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  card: { flexDirection: 'row', gap: 10, borderRadius: 16, borderWidth: 1, padding: 16 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light.primary, marginTop: 6 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  body: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  date: { fontSize: 11 },
});
