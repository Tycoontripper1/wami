import { Text } from '@/components/AppText';
import EmptyState from '@/components/EmptyState';
import { ListingFeedCard, ListingData } from '@/components/feed/FeedCards';
import { Ionicons } from '@/components/FlatIcon';
import SafetySheet from '@/components/SafetySheet';
import { Alert } from '@/components/AppAlert';
import Colors from '@/constants/Colors';
import { useAuthGate } from '@/hooks/useAuthGate';
import {
  ApiCreator,
  followCreator,
  getCreator,
  getCreatorListings,
  getCreatorReviews,
  unfollowCreator,
} from '@/services/api/creatorsService';
import type { RootState } from '@/store/store';
import { extractList } from '@/utils/extractList';
import { absoluteUrl, initials } from '@/utils/mediaUrl';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const ORANGE = '#FFA000';

type Review = { id: string; name: string; rating: number; text: string; date: string };

const mapReview = (r: any, i: number): Review => ({
  id: String(r.id ?? i),
  name: r.user?.name || r.reviewer?.name || r.user_name || 'A customer',
  rating: Number(r.rating ?? 0),
  text: r.comment ?? r.body ?? r.text ?? '',
  date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
});

const toListing = (p: any): ListingData => ({
  id: String(p.listing_id ?? p.id),
  name: p.title || p.name || 'Untitled',
  category: p.category || '',
  price: Number(p.price) || 0,
  image: absoluteUrl(p.thumbnail_url || p.media_url),
  stock: typeof p.stock === 'number' ? p.stock : undefined,
});

export default function CreatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const { gate } = useAuthGate();
  const me = useSelector((s: RootState) => s.auth.user);

  const [creator, setCreator] = useState<ApiCreator | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<'work' | 'reviews'>('work');
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);

  const t = {
    bg: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    card: isDark ? '#1A1A1A' : '#F5F7F8',
    border: isDark ? '#2C2C2E' : '#E3E7EA',
    tile: isDark ? '#12333B' : '#E3F7FA',
  };

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [c, l, r] = await Promise.all([
        getCreator(id),
        getCreatorListings(id).catch(() => null),
        getCreatorReviews(id).catch(() => null),
      ]);
      setCreator(c.data);
      setFollowing(!!c.data.viewer?.is_following);
      setFollowers(c.data.followers_count ?? 0);
      setListings(l ? extractList<any>(l.data).map(toListing) : []);
      if (r) {
        const body: any = r.data;
        setReviews(extractList<any>(body).map(mapReview));
        setBreakdown(body?.meta?.breakdown ?? {});
      }
    } catch (error) {
      console.error('Failed to load creator:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isMe = !!me && !!creator && String((me as any).id) === String(creator.id);

  const toggleFollow = () =>
    gate('Sign in to follow creatives and see their work in your Following feed.', async () => {
      if (!creator || followBusy) return;
      setFollowBusy(true);
      const next = !following;
      setFollowing(next);
      setFollowers((n) => Math.max(0, n + (next ? 1 : -1)));
      try {
        if (next) await followCreator(creator.id);
        else await unfollowCreator(creator.id);
      } catch (error: any) {
        setFollowing(!next);
        setFollowers((n) => Math.max(0, n + (next ? -1 : 1)));
        Alert.alert("Couldn't update", error?.message ?? 'Please try again.');
      } finally {
        setFollowBusy(false);
      }
    });

  const message = () =>
    gate('Sign in to message creatives and agree the details before you book.', () => {
      if (!creator) return;
      router.push({
        pathname: '/chat/[id]',
        params: { id: 'new', recipientId: String(creator.id), name: creator.name, avatar: absoluteUrl(creator.avatar_url) ?? '' },
      } as any);
    });

  const report = () => gate('Sign in to report a problem.', () => setSafetyOpen(true));

  const avatar = absoluteUrl(creator?.avatar_url);
  const place = [creator?.area, creator?.city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const rating = creator?.stats?.rating_avg ?? 0;
  const total = Object.values(breakdown).reduce((a, b) => a + Number(b || 0), 0);

  const Stat = ({ value, label }: { value: string; label: string }) => (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: t.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.sub }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={t.text} />
        </TouchableOpacity>
        {creator && !isMe ? (
          <TouchableOpacity onPress={report} style={styles.iconBtn} accessibilityLabel="Report or block">
            <Ionicons name="flag" size={22} color={t.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.light.primary} size="large" />
        </View>
      ) : failed || !creator ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="We couldn't open this page"
          message="It may have been removed, or your connection dropped."
          onRetry={load}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: t.tile }]}>
                <Text style={styles.avatarText}>{initials(creator.name)}</Text>
              </View>
            )}
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: t.text }]}>{creator.name}</Text>
              {creator.verified ? <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} /> : null}
            </View>
            <Text style={[styles.handle, { color: t.sub }]}>@{creator.username}</Text>
            {place ? (
              <View style={styles.placeRow}>
                <Ionicons name="location" size={15} color={Colors.light.primary} accent={ORANGE} />
                <Text style={[styles.place, { color: t.sub }]}>{place}</Text>
              </View>
            ) : null}
            {creator.categories && creator.categories.length > 0 ? (
              <View style={styles.chips}>
                {creator.categories.map((c) => (
                  <View key={c.id} style={[styles.chip, { backgroundColor: t.tile }]}>
                    <Text style={[styles.chipText, { color: isDark ? '#6FDCEC' : '#0A3A44' }]}>{c.name}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {creator.bio ? <Text style={[styles.bio, { color: t.text }]}>{creator.bio}</Text> : null}
          </View>

          <View style={[styles.stats, { backgroundColor: t.card }]}>
            <Stat value={rating > 0 ? rating.toFixed(1) : 'New'} label="Rating" />
            <Stat value={String(creator.stats?.reviews_count ?? 0)} label="Reviews" />
            <Stat value={String(creator.stats?.bookings_completed ?? 0)} label="Jobs done" />
            <Stat value={String(followers)} label="Followers" />
          </View>

          {!isMe ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.primary, following && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.light.primary }]}
                onPress={toggleFollow}
                disabled={followBusy}
              >
                <Text style={[styles.primaryText, following && { color: Colors.light.primary }]}>{following ? 'Following' : 'Follow'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondary, { borderColor: t.border }]} onPress={message}>
                <Ionicons name="chatbubbles" size={20} color={Colors.light.primary} accent={ORANGE} />
                <Text style={[styles.secondaryText, { color: t.text }]}>Message</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.tabs}>
            {(['work', 'reviews'] as const).map((k) => {
              const active = tab === k;
              return (
                <TouchableOpacity key={k} style={[styles.tab, { backgroundColor: active ? Colors.light.primary : t.card }]} onPress={() => setTab(k)}>
                  <Text style={[styles.tabText, { color: active ? '#0F1419' : t.sub }]}>
                    {k === 'work' ? `Work ${listings.length}` : `Reviews ${creator.stats?.reviews_count ?? reviews.length}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {tab === 'work' ? (
            <View style={styles.list}>
              {listings.length === 0 ? (
                <EmptyState icon="basket-outline" title="Nothing listed yet" message="When they list a service or a product, it shows up here." />
              ) : (
                listings.map((item) => (
                  <ListingFeedCard key={item.id} item={item} onOpen={() => router.push(`/product-detail/${item.id}` as any)} />
                ))
              )}
            </View>
          ) : (
            <View style={styles.list}>
              {total > 0 ? (
                <View style={[styles.breakdown, { backgroundColor: t.card }]}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const n = Number(breakdown[String(star)] ?? 0);
                    return (
                      <View key={star} style={styles.barRow}>
                        <Text style={[styles.barLabel, { color: t.sub }]}>{star}</Text>
                        <View style={[styles.barTrack, { backgroundColor: t.border }]}>
                          <View style={[styles.barFill, { width: `${(n / total) * 100}%` }]} />
                        </View>
                        <Text style={[styles.barCount, { color: t.sub }]}>{n}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}
              {reviews.length === 0 ? (
                <EmptyState icon="chatbubble-outline" title="No reviews yet" message="Reviews come from people who booked or bought, so every one is from a real job." />
              ) : (
                reviews.map((r) => (
                  <View key={r.id} style={[styles.review, { backgroundColor: t.card }]}>
                    <View style={styles.reviewHead}>
                      <Text style={[styles.reviewName, { color: t.text }]}>{r.name}</Text>
                      <View style={styles.stars}>
                        <Ionicons name="star" size={14} color={ORANGE} />
                        <Text style={[styles.reviewRating, { color: t.text }]}>{r.rating}</Text>
                      </View>
                    </View>
                    {r.text ? <Text style={[styles.reviewText, { color: t.text }]}>{r.text}</Text> : null}
                    {r.date ? <Text style={[styles.reviewDate, { color: t.sub }]}>{r.date}</Text> : null}
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      <SafetySheet
        visible={safetyOpen}
        target={creator ? { type: 'user', id: creator.id, userId: creator.id, name: creator.name } : null}
        onClose={() => setSafetyOpen(false)}
        onBlocked={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 4 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 4 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#0A3A44' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  name: { fontSize: 24, fontWeight: '800' },
  handle: { fontSize: 14, marginTop: 2 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  place: { fontSize: 14, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 },
  chip: { paddingHorizontal: 12, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '700' },
  bio: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 14 },
  stats: { flexDirection: 'row', marginHorizontal: 16, marginTop: 20, borderRadius: 18, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 16 },
  primary: { flex: 1, height: 48, borderRadius: 12, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#0F1419' },
  secondary: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { fontSize: 16, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 22 },
  tab: { paddingHorizontal: 16, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },
  breakdown: { borderRadius: 18, padding: 16, gap: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 14, fontSize: 13, fontWeight: '700' },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: ORANGE },
  barCount: { width: 28, textAlign: 'right', fontSize: 13 },
  review: { borderRadius: 18, padding: 14 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewName: { fontSize: 15, fontWeight: '700' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reviewRating: { fontSize: 14, fontWeight: '700' },
  reviewText: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  reviewDate: { fontSize: 12, marginTop: 8 },
});
