import AppGuidance from '@/components/AppGuidance';
import { Text } from '@/components/AppText';
import EmptyState from '@/components/EmptyState';
import {
  CreativeFeedCard,
  ListingData,
  ListingFeedCard,
  PostFeedCard,
  WamiFeedCard,
} from '@/components/feed/FeedCards';
import { Ionicons } from '@/components/FlatIcon';
import type { CreativeData } from '@/components/SwipeableCardStack';
import Colors from '@/constants/Colors';
import { WAMI_CARDS, WamiCard } from '@/constants/WamiCards';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useFavorites } from '@/hooks/useFavorites';
import { useLocation } from '@/hooks/useLocationData';
import { DiscoveryOffering, getDiscoveryFeed, getNearYou } from '@/services/api/discoveryService';
import { getUnreadCount as getUnreadNotificationCount } from '@/services/api/notificationsService';
import { getProducts } from '@/services/api/productsService';
import { extractList } from '@/utils/extractList';
import { openCreator } from '@/utils/openCreator';
import { loadLocalProductPhotos, localProductPhoto } from '@/utils/localProductPhotos';
import { mapOfferingToCreativeData } from '@/utils/mapOffering';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['For you', 'Near you', 'Trending'] as const;
type Tab = (typeof TABS)[number];

const DISMISSED_KEY = '@wami_dismissed_cards';

type FeedItem =
  | { kind: 'wami'; key: string; card: WamiCard }
  | { kind: 'creative'; key: string; data: CreativeData }
  | { kind: 'listing'; key: string; data: ListingData };

// /products lists the same listing twice (a marketplace row and a manual row);
// keep one, preferring the manual row, which is the one the app can open.
function toListings(raw: any[]): ListingData[] {
  const published = raw.filter((p) => p.status === undefined || p.status === 'published');
  const seen = new Set<string>();
  const out: ListingData[] = [];
  [...published]
    .sort((a, b) => (a.source === 'manual' ? -1 : 0) - (b.source === 'manual' ? -1 : 0))
    .forEach((p) => {
      const sig = `${p.title}|${Number(p.price)}|${String(p.created_at ?? '').slice(0, 16)}`;
      if (seen.has(sig)) return;
      seen.add(sig);
      out.push({
        id: String(p.id),
        name: p.title || p.name || 'Untitled',
        category: p.category || '',
        price: Number(p.price) || 0,
        image: p.thumbnail_url || p.media_url || p.image || p.images?.[0] || localProductPhoto(p.id) || undefined,
        stock: typeof p.stock === 'number' ? p.stock : undefined,
      });
    });
  return out;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { region, city } = useLocation();
  const { signedIn, gate } = useAuthGate();

  const [activeTab, setActiveTab] = useState<Tab>('For you');
  const [feed, setFeed] = useState<DiscoveryOffering[] | null>(null);
  const [nearYou, setNearYou] = useState<DiscoveryOffering[] | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [feedError, setFeedError] = useState(false);
  const [nearYouError, setNearYouError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const tc = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    chip: isDark ? '#1A1A1A' : '#F5F7F8',
  };

  const loadFeed = useCallback(async () => {
    setFeedError(false);
    const [feedRes, productsRes] = await Promise.allSettled([
      getDiscoveryFeed(),
      getProducts({ limit: 20 }),
      loadLocalProductPhotos(),
    ]);
    if (feedRes.status === 'fulfilled') setFeed(extractList<DiscoveryOffering>(feedRes.value.data));
    else {
      console.error('Failed to load discovery feed:', feedRes.reason);
      setFeed(null);
      setFeedError(true);
    }
    if (productsRes.status === 'fulfilled') setListings(toListings(extractList<any>(productsRes.value.data)));
  }, []);

  const loadNearYou = useCallback(async () => {
    setNearYouError(false);
    try {
      const res = await getNearYou();
      setNearYou(extractList<DiscoveryOffering>(res.data));
    } catch (error) {
      console.error('Failed to load near-you offerings:', error);
      setNearYou(null);
      setNearYouError(true);
    }
  }, []);

  useEffect(() => {
    loadFeed().finally(() => setIsLoading(false));
  }, [loadFeed]);

  useEffect(() => {
    if (activeTab === 'Near you' && nearYou === null && !nearYouError) loadNearYou();
  }, [activeTab, nearYou, nearYouError, loadNearYou]);

  useEffect(() => {
    if (!signedIn) {
      setUnread(0);
      return;
    }
    getUnreadNotificationCount()
      .then((res) => setUnread(res.data?.count ?? 0))
      .catch((error) => console.error('Failed to load unread notification count:', error));
  }, [signedIn]);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((raw) => setDismissed(raw ? JSON.parse(raw) : []))
      .catch(() => {});
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([loadFeed(), activeTab === 'Near you' ? loadNearYou() : Promise.resolve()]);
    setIsRefreshing(false);
  }, [loadFeed, loadNearYou, activeTab]);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(next)).catch(() => {});
  };

  const openCreative = (item: CreativeData) => {
    openCreator(router, item);
  };

  // What the list shows: a pinned From Wami card, then creatives and
  // listings taking turns, with a second From Wami card further down.
  const items: FeedItem[] = useMemo(() => {
    const cards = WAMI_CARDS.filter((c) => !dismissed.includes(c.id));
    let creatives: CreativeData[];
    if (activeTab === 'Near you') creatives = (nearYou ?? []).map(mapOfferingToCreativeData);
    else {
      creatives = (feed ?? []).map(mapOfferingToCreativeData);
      if (activeTab === 'Trending') creatives.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
    }
    const shop = activeTab === 'For you' ? listings : [];

    const out: FeedItem[] = [];
    if (cards[0]) out.push({ kind: 'wami', key: `wami-${cards[0].id}`, card: cards[0] });
    let c = 0;
    let l = 0;
    while (c < creatives.length || l < shop.length) {
      if (c < creatives.length) out.push({ kind: 'creative', key: `c-${creatives[c].id}`, data: creatives[c++] });
      if (l < shop.length) out.push({ kind: 'listing', key: `l-${shop[l].id}`, data: shop[l++] });
      if (cards[1] && out.length === 5) out.push({ kind: 'wami', key: `wami-${cards[1].id}`, card: cards[1] });
    }
    if (cards[1] && !out.some((i) => i.kind === 'wami' && i.card.id === cards[1].id) && out.length >= 1) {
      out.push({ kind: 'wami', key: `wami-${cards[1].id}`, card: cards[1] });
    }
    return out;
  }, [activeTab, feed, nearYou, listings, dismissed]);

  const hasContent = items.some((i) => i.kind !== 'wami');
  const currentError = activeTab === 'Near you' ? nearYouError : feedError && listings.length === 0;
  const retry = activeTab === 'Near you' ? loadNearYou : loadFeed;

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.kind === 'wami') {
      return (
        <WamiFeedCard
          card={item.card}
          onPress={() => router.push(item.card.route as any)}
          onDismiss={() => dismiss(item.card.id)}
        />
      );
    }
    if (item.kind === 'creative') {
      const Card = item.data.image ? PostFeedCard : CreativeFeedCard;
      return (
        <Card
          item={item.data}
          saved={isFavorite(item.data.id)}
          onSave={() => toggleFavorite(item.data)}
          onOpen={() => openCreative(item.data)}
        />
      );
    }
    return <ListingFeedCard item={item.data} onOpen={() => router.push(`/product-detail/${item.data.id}` as any)} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.location} onPress={() => router.push('/location-picker' as any)}>
            <Ionicons name="location" size={18} color={Colors.light.primary} accent="#FFA000" />
            <Text style={[styles.locationText, { color: tc.text }]}>
              {city}, {region.name}
            </Text>
            <Ionicons name="chevron-down" size={16} color={tc.sub} />
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/explore-map' as any)} accessibilityLabel="Explore on the map">
              <Ionicons name="map" size={24} color={tc.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/products-listing' as any)} accessibilityLabel="Shop">
              <Ionicons name="basket" size={24} color={tc.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => gate('Sign in to see your notifications.', () => router.push('/notifications' as any))} accessibilityLabel="Notifications">
              <Ionicons name="notifications" size={24} color={tc.text} />
              {unread > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, { backgroundColor: active ? Colors.light.primary : tc.chip }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, { color: active ? '#0F1419' : tc.sub }]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.swipeBtn} onPress={() => router.push('/swipe' as any)} accessibilityLabel="Swipe through creatives">
            <Ionicons name="albums" size={18} color={Colors.light.primary} accent="#FFA000" />
            <Text style={styles.swipeText}>Swipe</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.light.primary} size="large" />
        </View>
      ) : currentError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Oops, we can't find anything"
          message="Something went wrong while loading. Please check your connection and try again."
          onRetry={retry}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.key}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
          ListFooterComponent={
            !hasContent ? (
              <EmptyState
                icon="location-outline"
                title="No creatives nearby"
                message="Try changing your location to discover more creatives"
                onRetry={() => router.push('/location-picker' as any)}
                retryLabel="Change location"
              />
            ) : undefined
          }
        />
      )}

      <AppGuidance />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 16, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBtn: { padding: 4, position: 'relative' },
  badge: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  tabRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tab: { paddingHorizontal: 14, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },
  swipeBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 6 },
  swipeText: { fontSize: 14, fontWeight: '700', color: Colors.light.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 6 },
});
